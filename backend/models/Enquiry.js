const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  originalName: String,
  filename: String,
  path: String,
  mimetype: String,
  size: Number
});

const enquirySchema = new mongoose.Schema({
  enquiryNumber: { type: String, unique: true },
  clientName: { type: String, required: true, trim: true },
  companyName: { type: String, required: true, trim: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  requirementDetails: { type: String, required: true },
  attachments: [attachmentSchema],
  status: {
    type: String,
    enum: ['OPEN', 'IN_QUOTATION', 'APPROVED', 'REJECTED', 'CLOSED'],
    default: 'OPEN'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String
}, { timestamps: true });

enquirySchema.pre('save', async function(next) {
  if (!this.enquiryNumber) {
    const count = await mongoose.model('Enquiry').countDocuments();
    this.enquiryNumber = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Enquiry', enquirySchema);
