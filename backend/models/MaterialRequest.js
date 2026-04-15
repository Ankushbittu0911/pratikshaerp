const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
  requestNumber: { type: String, unique: true },
  productionJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production' },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: String,
  department: { type: String, enum: ['FABRICATION', 'ELECTRICAL'], required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

materialRequestSchema.pre('save', async function(next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('MaterialRequest').countDocuments();
    this.requestNumber = `MR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
