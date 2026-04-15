const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt: { type: Date, default: Date.now },
  remarks: String
});

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, unique: true },
  enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
  quotationAdminStatus: {
    type: String,
    enum: ['QUOTE_RECEIVED', 'IN_PROGRESS', 'COMPLETED'],
    default: 'QUOTE_RECEIVED'
  },
  salesStatus: {
    type: String,
    enum: ['PENDING', 'SENT_TO_CLIENT', 'NEGOTIATION', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  quotationPdf: {
    originalName: String,
    filename: String,
    path: String
  },
  bomFile: {
    originalName: String,
    filename: String,
    path: String
  },
  drawingFiles: [{
    originalName: String,
    filename: String,
    path: String
  }],
  rejectionReason: String,
  statusHistory: [statusHistorySchema],
  quotationValue: Number,
  currency: { type: String, default: 'INR' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

quotationSchema.pre('save', async function(next) {
  if (!this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
