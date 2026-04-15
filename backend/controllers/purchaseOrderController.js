const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const { notifyPOCreated, notifyMaterialReady } = require('../utils/notifications');

const formatFile = (file, folder) => file ? {
  originalName: file.originalname,
  filename: file.filename,
  path: `/uploads/${folder}/${file.filename}`
} : null;

exports.createPO = async (req, res) => {
  try {
    const { quotationId, enquiryId, remarks } = req.body;
    const quotation = await Quotation.findById(quotationId);
    if (!quotation || quotation.salesStatus !== 'APPROVED')
      return res.status(400).json({ success: false, message: 'Quotation must be approved' });

    const bomFile = req.file ? formatFile(req.file, 'purchase') : null;
    const po = await PurchaseOrder.create({
      quotationId, enquiryId, remarks, bomFile,
      status: 'PENDING_APPROVAL',
      createdBy: req.user._id
    });

    await notifyPOCreated(po);
    const populated = await po.populate([
      { path: 'quotationId', select: 'quotationNumber quotationValue' },
      { path: 'enquiryId', select: 'clientName companyName enquiryNumber' },
      { path: 'createdBy', select: 'name role' }
    ]);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPOs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await PurchaseOrder.countDocuments(filter);
    const pos = await PurchaseOrder.find(filter)
      .populate('quotationId', 'quotationNumber quotationValue')
      .populate('enquiryId', 'clientName companyName enquiryNumber')
      .populate('createdBy', 'name role')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: pos, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('quotationId')
      .populate('enquiryId')
      .populate('createdBy', 'name role')
      .populate('superAdminApproval.approvedBy', 'name role');
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.approvePO = async (req, res) => {
  try {
    const { action, remarks } = req.body; // action: 'APPROVED' | 'REJECTED'
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    po.superAdminApproval = {
      status: action,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      remarks
    };
    po.status = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    await po.save();
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMaterialTracking = async (req, res) => {
  try {
    const { materialTracking } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    po.materialTracking = materialTracking;
    po.status = 'MATERIALS_RECEIVING';

    const allReceived = materialTracking.every(m => !m.isPending);
    if (allReceived) {
      po.status = 'READY_FOR_PRODUCTION';
      await notifyMaterialReady(po);
    }
    await po.save();
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMaterialItem = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    po.materialTracking.push({ ...req.body, isPending: true });
    // Move from APPROVED → MATERIALS_RECEIVING when first item is added
    if (po.status === 'APPROVED') po.status = 'MATERIALS_RECEIVING';
    await po.save();
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMaterialItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    const item = po.materialTracking.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Material item not found' });

    Object.assign(item, req.body);
    item.isPending = item.receivedQuantity < item.quantity;
    if (item.receivedQuantity > 0 && !item.receivedDate) item.receivedDate = new Date();

    // Auto-promote to READY_FOR_PRODUCTION only if there are items and all received
    if (po.materialTracking.length > 0) {
      const allReceived = po.materialTracking.every(m => !m.isPending);
      if (allReceived && po.status !== 'READY_FOR_PRODUCTION') {
        po.status = 'READY_FOR_PRODUCTION';
        await notifyMaterialReady(po);
      }
    }
    await po.save();
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markReadyForProduction = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    if (!['APPROVED', 'MATERIALS_RECEIVING'].includes(po.status)) {
      return res.status(400).json({ success: false, message: 'PO must be APPROVED or in MATERIALS_RECEIVING state' });
    }

    po.status = 'READY_FOR_PRODUCTION';
    await po.save();
    await notifyMaterialReady(po);
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deletePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, message: 'Purchase Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
