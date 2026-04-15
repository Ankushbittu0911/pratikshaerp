const Enquiry = require('../models/Enquiry');
const Quotation = require('../models/Quotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const Production = require('../models/Production');
const Material = require('../models/Material');

exports.getEnquiryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const [enquiries, statusBreakdown, monthlyTrend] = await Promise.all([
      Enquiry.find(filter).populate('createdBy', 'name').sort('-createdAt').limit(100),
      Enquiry.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Enquiry.aggregate([
        { $match: filter },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);
    res.json({ success: true, data: { enquiries, statusBreakdown, monthlyTrend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getQuotationReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const [quotations, conversionRate, totalValue] = await Promise.all([
      Quotation.find(filter)
        .populate('enquiryId', 'clientName companyName')
        .sort('-createdAt').limit(100),
      Quotation.aggregate([
        { $match: filter },
        { $group: { _id: '$salesStatus', count: { $sum: 1 }, totalValue: { $sum: '$quotationValue' } } }
      ]),
      Quotation.aggregate([
        { $match: { ...filter, salesStatus: 'APPROVED' } },
        { $group: { _id: null, total: { $sum: '$quotationValue' } } }
      ])
    ]);
    res.json({ success: true, data: { quotations, conversionRate, totalValue: totalValue[0]?.total || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPurchaseReport = async (req, res) => {
  try {
    const pos = await PurchaseOrder.find()
      .populate('enquiryId', 'clientName companyName')
      .populate('quotationId', 'quotationNumber quotationValue')
      .sort('-createdAt').limit(100);
    const statusBreakdown = await PurchaseOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { pos, statusBreakdown } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMaterialReport = async (req, res) => {
  try {
    const [materials, lowStock] = await Promise.all([
      Material.find({ isActive: true }).sort('name'),
      Material.find({ isActive: true, $expr: { $lte: ['$stockQuantity', '$minimumStock'] } })
    ]);
    res.json({ success: true, data: { materials, lowStockCount: lowStock.length, lowStockItems: lowStock } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getProductionReport = async (req, res) => {
  try {
    const [jobs, fabricationStats, electricalStats, completedJobs] = await Promise.all([
      Production.find()
        .populate('enquiryId', 'clientName companyName enquiryNumber')
        .populate('quotationId', 'quotationNumber')
        .sort('-createdAt').limit(100),
      Production.aggregate([{ $group: { _id: '$fabricationStatus', count: { $sum: 1 } } }]),
      Production.aggregate([{ $group: { _id: '$electricalStatus', count: { $sum: 1 } } }]),
      Production.countDocuments({ overallStatus: 'DISPATCHED' })
    ]);
    res.json({ success: true, data: { jobs, fabricationStats, electricalStats, completedJobs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSuperAdminDashboard = async (req, res) => {
  try {
    const restrictedRoles = ['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'];
    let productionFilter = {};

    if (restrictedRoles.includes(req.user.role)) {
      if (req.user.role === 'FABRICATION_ADMIN') {
        productionFilter.$or = [
          { fabricationAssignedTo: req.user._id },
          { fabricationAssignedTo: { $exists: false } },
          { fabricationAssignedTo: null }
        ];
      } else if (req.user.role === 'ELECTRICAL_ADMIN') {
        productionFilter.$or = [
          { electricalAssignedTo: req.user._id },
          { electricalAssignedTo: { $exists: false } },
          { electricalAssignedTo: null }
        ];
      }
    }

    const [
      totalEnquiries, openEnquiries, approvedEnquiries,
      totalQuotations, pendingQuotations,
      activePOs, readyForProduction,
      activeJobs, readyForDispatch, completedJobs,
      lowStockCount
    ] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'OPEN' }),
      Enquiry.countDocuments({ status: 'APPROVED' }),
      Quotation.countDocuments(),
      Quotation.countDocuments({ salesStatus: 'PENDING' }),
      PurchaseOrder.countDocuments({ status: { $in: ['APPROVED', 'MATERIALS_RECEIVING'] } }),
      PurchaseOrder.countDocuments({ status: 'READY_FOR_PRODUCTION' }),
      Production.countDocuments({ ...productionFilter, overallStatus: 'IN_PRODUCTION' }),
      Production.countDocuments({ ...productionFilter, overallStatus: 'READY_FOR_DISPATCH' }),
      Production.countDocuments({ ...productionFilter, overallStatus: 'DISPATCHED' }),
      Material.countDocuments({ isActive: true, $expr: { $lte: ['$stockQuantity', '$minimumStock'] } })
    ]);

    const recentEnquiries = await Enquiry.find().sort('-createdAt').limit(5).populate('createdBy', 'name');
    const activeRecentFilter = {
      ...productionFilter,
      overallStatus: { $in: ['IN_PRODUCTION', 'READY_FOR_DISPATCH'] }
    };
    const recentJobs = await Production.find(activeRecentFilter).sort('-createdAt').limit(5)
      .populate('enquiryId', 'clientName companyName enquiryNumber');

    res.json({
      success: true,
      data: {
        enquiries: { total: totalEnquiries, open: openEnquiries, approved: approvedEnquiries },
        quotations: { total: totalQuotations, pending: pendingQuotations },
        purchase: { active: activePOs, readyForProduction },
        production: { active: activeJobs, readyForDispatch, completed: completedJobs },
        materials: { lowStock: lowStockCount },
        recentEnquiries, recentJobs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
