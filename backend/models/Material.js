const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  unit: { type: String, required: true },
  stockQuantity: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 0 },
  category: String,
  description: String,
  isActive: { type: Boolean, default: true },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

materialSchema.virtual('isLowStock').get(function() {
  return this.stockQuantity <= this.minimumStock;
});

module.exports = mongoose.model('Material', materialSchema);
