const mongoose = require('mongoose');

const workLogSchema = new mongoose.Schema({
  department: { type: String, enum: ['FABRICATION', 'ELECTRICAL', 'POWDER_COATING'] },
  workDone: { type: String, required: true },
  issues: String,
  date: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const productionSchema = new mongoose.Schema({
  jobNumber: { type: String, unique: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  bomFiles: [{
    originalName: String,
    filename: String,
    path: String
  }],
  drawingFiles: [{
    originalName: String,
    filename: String,
    path: String
  }],
  fabricationStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'MOUNTING_PLATE_READY', 'MOUNTING_PLATE_SENT_TO_POWDER_COATING', 'PANEL_READY', 'PANEL_SENT_FOR_POWDER_COATING', 'SENT_TO_POWDER_COATING', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  powderCoatingStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'RECEIVED'],
    default: 'NOT_STARTED'
  },
  mountingPlatePowderCoatingStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'RECEIVED'],
    default: 'NOT_STARTED'
  },
  fabricationStartedAt: Date,
  mountingPlateReadyAt: Date,
  panelReadyAt: Date,
  mountingPlateSentToPowderCoatingAt: Date,
  panelSentToPowderCoatingAt: Date,
  powderCoatingPanelStartedAt: Date,
  powderCoatingPanelReceivedAt: Date,
  powderCoatingMountingPlateStartedAt: Date,
  powderCoatingMountingPlateReceivedAt: Date,
  electricalStartedAt: Date,
  electricalTestingAt: Date,
  electricalReadyForDispatchAt: Date,
  electricalDispatchedAt: Date,
  electricalStatus: {
    type: String,
    enum: ['NOT_STARTED', 'READY_TO_START', 'IN_PROGRESS', 'TESTING', 'READY_FOR_DISPATCH', 'DISPATCHED'],
    default: 'NOT_STARTED'
  },
  overallStatus: {
    type: String,
    enum: ['IN_PRODUCTION', 'READY_FOR_DISPATCH', 'DISPATCHED'],
    default: 'IN_PRODUCTION'
  },
  workLogs: [workLogSchema],
  fabricationAssignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  electricalAssignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetDate: Date,
  dispatchDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productionSchema.pre('save', async function(next) {
  if (!this.jobNumber) {
    const count = await mongoose.model('Production').countDocuments();
    this.jobNumber = `JOB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  // Auto-update overall status
  if (this.electricalStatus === 'READY_FOR_DISPATCH') {
    this.overallStatus = 'READY_FOR_DISPATCH';
  }
  if (this.electricalStatus === 'DISPATCHED') {
    this.overallStatus = 'DISPATCHED';
    this.dispatchDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Production', productionSchema);
