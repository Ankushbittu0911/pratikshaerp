const Quotation = require('../models/Quotation');
const Enquiry = require('../models/Enquiry');
const { notifyQuotationCompleted, notifyQuotationApproved } = require('../utils/notifications');

const formatFile = (file, folder) => file ? {
  originalName: file.originalname,
  filename: file.filename,
  path: `/uploads/${folder}/${file.filename}`
} : null;

exports.createQuotation = async (req, res) => {
  try {
    const { enquiryId } = req.body;
    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    const existing = await Quotation.findOne({ enquiryId });
    if (existing) return res.status(400).json({ success: false, message: 'Quotation already exists for this enquiry' });

    const quotation = await Quotation.create({
      enquiryId, createdBy: req.user._id,
      statusHistory: [{ status: 'QUOTE_RECEIVED', changedBy: req.user._id }]
    });

    await Enquiry.findByIdAndUpdate(enquiryId, { status: 'IN_QUOTATION' });
    const populated = await quotation.populate([
      { path: 'enquiryId', select: 'clientName companyName enquiryNumber' },
      { path: 'createdBy', select: 'name role' }
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getQuotations = async (req, res) => {
  try {
    const { salesStatus, quotationAdminStatus, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (salesStatus) filter.salesStatus = salesStatus;
    if (quotationAdminStatus) filter.quotationAdminStatus = quotationAdminStatus;

    const total = await Quotation.countDocuments(filter);
    const quotations = await Quotation.find(filter)
      .populate('enquiryId', 'clientName companyName enquiryNumber email phone')
      .populate('createdBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: quotations, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('enquiryId')
      .populate('createdBy', 'name role')
      .populate('statusHistory.changedBy', 'name role');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateQuotationAdminStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const fileUpdate = {};
    if (req.file && status === 'COMPLETED') {
      fileUpdate.quotationPdf = formatFile(req.file, 'quotations');
    }

    quotation.quotationAdminStatus = status;
    quotation.statusHistory.push({ status: `QA_${status}`, changedBy: req.user._id, remarks });
    if (fileUpdate.quotationPdf) quotation.quotationPdf = fileUpdate.quotationPdf;
    await quotation.save();

    if (status === 'COMPLETED') await notifyQuotationCompleted(quotation);
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSalesStatus = async (req, res) => {
  try {
    const { status, rejectionReason, remarks, quotationValue } = req.body;
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (status === 'REJECTED' && !rejectionReason)
      return res.status(400).json({ success: false, message: 'Rejection reason required' });

    quotation.salesStatus = status;
    if (rejectionReason) quotation.rejectionReason = rejectionReason;
    if (quotationValue) quotation.quotationValue = quotationValue;
    quotation.statusHistory.push({ status, changedBy: req.user._id, remarks });
    await quotation.save();

    if (status === 'APPROVED') {
      await Enquiry.findByIdAndUpdate(quotation.enquiryId, { status: 'APPROVED' });
      await notifyQuotationApproved(quotation);
    }
    if (status === 'REJECTED') {
      await Enquiry.findByIdAndUpdate(quotation.enquiryId, { status: 'REJECTED' });
    }

    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, message: 'Quotation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadBomDrawings = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const files = req.files || [];
    const { fileType } = req.body; // 'bom' or 'drawing'

    if (fileType === 'bom' && files.length > 0) {
      quotation.bomFile = formatFile(files[0], 'bom');
    } else if (fileType === 'drawing') {
      quotation.drawingFiles.push(...files.map(f => formatFile(f, 'drawings')));
    }

    await quotation.save();
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
