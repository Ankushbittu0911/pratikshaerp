const Production = require('../models/Production');
const Quotation = require('../models/Quotation');

const formatFiles = (files, folder) => (files || []).map(f => ({
  originalName: f.originalname,
  filename: f.filename,
  path: `/uploads/${folder}/${f.filename}`
}));

exports.createJob = async (req, res) => {
  try {
    const { quotationId, enquiryId, purchaseOrderId, targetDate } = req.body;
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const bomFiles = formatFiles(req.files?.bomFiles, 'production/bom');
    const drawingFiles = formatFiles(req.files?.drawingFiles, 'production/drawings');

    // Use quotation files if no new ones uploaded
    const finalBom = bomFiles.length > 0 ? bomFiles : (quotation.bomFile ? [quotation.bomFile] : []);
    const finalDrawings = drawingFiles.length > 0 ? drawingFiles : quotation.drawingFiles;

    const job = await Production.create({
      quotationId, enquiryId, purchaseOrderId, targetDate,
      bomFiles: finalBom,
      drawingFiles: finalDrawings,
      createdBy: req.user._id
    });

    if (purchaseOrderId) {
      const PurchaseOrder = require('../models/PurchaseOrder');
      await PurchaseOrder.findByIdAndUpdate(purchaseOrderId, { status: 'IN_PRODUCTION' });
    }

    const populated = await job.populate([
      { path: 'quotationId', select: 'quotationNumber' },
      { path: 'enquiryId', select: 'clientName companyName enquiryNumber' },
      { path: 'createdBy', select: 'name role' }
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const { overallStatus, fabricationStatus, electricalStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    
    // Handle comma-separated overallStatus values
    if (overallStatus) {
      const statuses = overallStatus.split(',').map(s => s.trim());
      if (statuses.length > 1) {
        filter.overallStatus = { $in: statuses };
      } else {
        filter.overallStatus = statuses[0];
      }
    }
    
    if (fabricationStatus) filter.fabricationStatus = fabricationStatus;
    if (electricalStatus) filter.electricalStatus = electricalStatus;

    // Role-based filtering — Fabrication/Electrical see jobs assigned to them, plus unassigned jobs
    const restrictedRoles = ['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'];
    if (restrictedRoles.includes(req.user.role)) {
      if (req.user.role === 'FABRICATION_ADMIN') {
        filter.$or = [
          { fabricationAssignedTo: req.user._id },
          { fabricationAssignedTo: { $exists: false } },
          { fabricationAssignedTo: null }
        ];
      }
      if (req.user.role === 'ELECTRICAL_ADMIN') {
        filter.$or = [
          { electricalAssignedTo: req.user._id },
          { electricalAssignedTo: { $exists: false } },
          { electricalAssignedTo: null }
        ];
      }
    }

    const total = await Production.countDocuments(filter);
    const jobs = await Production.find(filter)
      .populate('enquiryId', 'clientName companyName enquiryNumber')
      .populate('quotationId', 'quotationNumber')
      .populate('createdBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Strip price-sensitive data for restricted roles
    const sanitized = jobs.map(j => {
      const obj = j.toObject();
      if (restrictedRoles.includes(req.user.role)) {
        if (obj.quotationId) delete obj.quotationId.quotationValue;
      }
      return obj;
    });

    res.json({ success: true, data: sanitized, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Production.findById(req.params.id)
      .populate('enquiryId', 'clientName companyName enquiryNumber email phone')
      .populate('quotationId', 'quotationNumber bomFile drawingFiles')
      .populate('fabricationAssignedTo', 'name email')
      .populate('electricalAssignedTo', 'name email')
      .populate('workLogs.updatedBy', 'name role')
      .populate('createdBy', 'name role');

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const obj = job.toObject();
    const restrictedRoles = ['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'];
    if (restrictedRoles.includes(req.user.role)) {
      if (obj.quotationId) {
        delete obj.quotationId.quotationValue;
      }
    }
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFabricationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Production.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.fabricationStatus = status;
    if (!job.fabricationStartedAt && status !== 'NOT_STARTED') {
      job.fabricationStartedAt = new Date();
    }
    if (status === 'MOUNTING_PLATE_READY' && !job.mountingPlateReadyAt) {
      job.mountingPlateReadyAt = new Date();
    }
    if (status === 'PANEL_READY' && !job.panelReadyAt) {
      job.panelReadyAt = new Date();
    }
    if (status === 'MOUNTING_PLATE_SENT_TO_POWDER_COATING') {
      if (!job.mountingPlateSentToPowderCoatingAt) job.mountingPlateSentToPowderCoatingAt = new Date();
      job.mountingPlatePowderCoatingStatus = 'IN_PROGRESS';
      if (!job.powderCoatingMountingPlateStartedAt) job.powderCoatingMountingPlateStartedAt = new Date();
    }
    if (status === 'PANEL_SENT_FOR_POWDER_COATING') {
      if (!job.panelSentToPowderCoatingAt) job.panelSentToPowderCoatingAt = new Date();
      job.powderCoatingStatus = 'IN_PROGRESS';
      if (!job.powderCoatingPanelStartedAt) job.powderCoatingPanelStartedAt = new Date();
    }
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePowderCoatingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Production.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.powderCoatingStatus = status;
    if (status === 'IN_PROGRESS' && !job.powderCoatingPanelStartedAt) {
      job.powderCoatingPanelStartedAt = new Date();
    }
    if (status === 'RECEIVED' && !job.powderCoatingPanelReceivedAt) {
      job.powderCoatingPanelReceivedAt = new Date();
    }
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMountingPlatePowderCoatingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Production.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.mountingPlatePowderCoatingStatus = status;
    if (status === 'IN_PROGRESS' && !job.powderCoatingMountingPlateStartedAt) {
      job.powderCoatingMountingPlateStartedAt = new Date();
    }
    if (status === 'RECEIVED' && !job.powderCoatingMountingPlateReceivedAt) {
      job.powderCoatingMountingPlateReceivedAt = new Date();
    }
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateElectricalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Production.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const gatedStatuses = ['IN_PROGRESS', 'TESTING', 'READY_FOR_DISPATCH', 'DISPATCHED'];
    if (gatedStatuses.includes(status)) {
      if (job.powderCoatingStatus !== 'RECEIVED' || job.mountingPlatePowderCoatingStatus !== 'RECEIVED') {
        return res.status(400).json({ success: false, message: 'Both panel and mounting plate must be received from powder coating before electrical work' });
      }
    }

    if (!job.electricalStartedAt && status !== 'NOT_STARTED') {
      job.electricalStartedAt = new Date();
    }
    if (status === 'TESTING' && !job.electricalTestingAt) {
      job.electricalTestingAt = new Date();
    }
    if (status === 'READY_FOR_DISPATCH' && !job.electricalReadyForDispatchAt) {
      job.electricalReadyForDispatchAt = new Date();
    }
    if (status === 'DISPATCHED' && !job.electricalDispatchedAt) {
      job.electricalDispatchedAt = new Date();
    }
    job.electricalStatus = status;
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.addWorkLog = async (req, res) => {
  try {
    const { workDone, issues, department } = req.body;
    const job = await Production.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.workLogs.push({ workDone, issues, department, updatedBy: req.user._id, date: new Date() });
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignJob = async (req, res) => {
  try {
    const { fabricationAssignedTo, electricalAssignedTo } = req.body;
    const update = {};
    if (fabricationAssignedTo) update.fabricationAssignedTo = fabricationAssignedTo;
    if (electricalAssignedTo) update.electricalAssignedTo = electricalAssignedTo;

    const job = await Production.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const restrictedRoles = ['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'];
    let matchFilter = {};

    if (restrictedRoles.includes(req.user.role)) {
      if (req.user.role === 'FABRICATION_ADMIN') {
        matchFilter.$or = [
          { fabricationAssignedTo: req.user._id },
          { fabricationAssignedTo: { $exists: false } },
          { fabricationAssignedTo: null }
        ];
      } else if (req.user.role === 'ELECTRICAL_ADMIN') {
        matchFilter.$or = [
          { electricalAssignedTo: req.user._id },
          { electricalAssignedTo: { $exists: false } },
          { electricalAssignedTo: null }
        ];
      }
    }

    const [fabricationStats, electricalStats, overallStats] = await Promise.all([
      Production.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$fabricationStatus', count: { $sum: 1 } } }
      ]),
      Production.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$electricalStatus', count: { $sum: 1 } } }
      ]),
      Production.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$overallStatus', count: { $sum: 1 } } }
      ])
    ]);
    res.json({ success: true, data: { fabricationStats, electricalStats, overallStats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Production.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Production job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
