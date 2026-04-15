const mongoose = require('mongoose');

const materialTrackingSchema = new mongoose.Schema({
  materialName: String,
  quantity: Number,
  unit: String,
  receivedQuantity: { type: Number, default: 0 },
  isPending: { type: Boolean, default: true },
  remarks: String,
  receivedDate: Date
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
  bomFile: {
    originalName: String,
    filename: String,
    path: String
  },
  remarks: String,
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'MATERIALS_RECEIVING', 'READY_FOR_PRODUCTION', 'IN_PRODUCTION'],
    default: 'DRAFT'
  },
  superAdminApproval: {
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    remarks: String
  },
  materialTracking: [materialTrackingSchema],
  vendors: [{ name: String, contact: String, items: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

purchaseOrderSchema.pre('save', async function(next) {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
