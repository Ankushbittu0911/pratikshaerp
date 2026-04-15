const Enquiry = require('../models/Enquiry');
const { notifyNewEnquiry } = require('../utils/notifications');
const path = require('path');

const formatAttachments = (files) => files?.map(f => ({
  originalName: f.originalname,
  filename: f.filename,
  path: `/uploads/enquiries/${f.filename}`,
  mimetype: f.mimetype,
  size: f.size
})) || [];

exports.createEnquiry = async (req, res) => {
  try {
    const { clientName, companyName, email, phone, requirementDetails, notes } = req.body;
    const attachments = formatAttachments(req.files);

    const enquiry = await Enquiry.create({
      clientName, companyName, email, phone, requirementDetails, notes,
      attachments, createdBy: req.user._id
    });

    await notifyNewEnquiry(enquiry, req.user._id);
    const populated = await enquiry.populate('createdBy', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEnquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [
      { clientName: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { enquiryNumber: { $regex: search, $options: 'i' } }
    ];

    const total = await Enquiry.countDocuments(filter);
    const enquiries = await Enquiry.find(filter)
      .populate('createdBy', 'name email role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: enquiries, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id).populate('createdBy', 'name email role');
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const total = await Enquiry.countDocuments();
    res.json({ success: true, data: { stats, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
