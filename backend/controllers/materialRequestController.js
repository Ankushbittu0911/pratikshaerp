const MaterialRequest = require('../models/MaterialRequest');
const Material = require('../models/Material');
const { notifyMaterialRequest } = require('../utils/notifications');

exports.createRequest = async (req, res) => {
  try {
    const { productionJobId, materialId, materialName, quantity, unit, department, reason } = req.body;
    const request = await MaterialRequest.create({
      productionJobId, materialId, materialName, quantity, unit, department, reason,
      requestedBy: req.user._id
    });
    await notifyMaterialRequest(request);
    const populated = await request.populate('requestedBy', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { status, department, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;

    // Restrict: Fab/Electrical only see their own department
    if (['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'].includes(req.user.role)) {
      filter.requestedBy = req.user._id;
    }

    const total = await MaterialRequest.countDocuments(filter);
    const requests = await MaterialRequest.find(filter)
      .populate('requestedBy', 'name role')
      .populate('approvedBy', 'name role')
      .populate('materialId', 'name code unit')
      .populate('productionJobId', 'jobNumber')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: requests, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const request = await MaterialRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Material request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = status;
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    if (rejectionReason) request.rejectionReason = rejectionReason;

    // Deduct from stock if approved
    if (status === 'APPROVED' && request.materialId) {
      await Material.findByIdAndUpdate(request.materialId, {
        $inc: { stockQuantity: -request.quantity }
      });
    }
    await request.save();
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
