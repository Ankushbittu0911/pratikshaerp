const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['ENQUIRY', 'QUOTATION', 'PURCHASE', 'PRODUCTION', 'MATERIAL', 'SYSTEM'],
    default: 'SYSTEM'
  },
  targetRoles: [{ type: String }],
  targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedModel: String,
  link: String
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
