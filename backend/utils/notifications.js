const Notification = require('../models/Notification');

const createNotification = async ({ title, message, type, targetRoles = [], targetUsers = [], relatedId, relatedModel, link }) => {
  try {
    await Notification.create({ title, message, type, targetRoles, targetUsers, relatedId, relatedModel, link });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = {
  notifyNewEnquiry: (enquiry, createdById) => createNotification({
    title: 'New Enquiry Received',
    message: `New enquiry from ${enquiry.companyName} (${enquiry.enquiryNumber})`,
    type: 'ENQUIRY',
    targetRoles: ['SUPER_ADMIN', 'QUOTATION_ADMIN'],
    relatedId: enquiry._id,
    relatedModel: 'Enquiry',
    link: `/enquiries/${enquiry._id}`
  }),

  notifyQuotationCompleted: (quotation) => createNotification({
    title: 'Quotation Ready',
    message: `Quotation ${quotation.quotationNumber} is completed and ready for review`,
    type: 'QUOTATION',
    targetRoles: ['SUPER_ADMIN', 'SALES_ADMIN'],
    relatedId: quotation._id,
    relatedModel: 'Quotation',
    link: `/quotations/${quotation._id}`
  }),

  notifyQuotationApproved: (quotation) => createNotification({
    title: 'Quotation Approved',
    message: `Quotation ${quotation.quotationNumber} has been approved by client`,
    type: 'QUOTATION',
    targetRoles: ['SUPER_ADMIN', 'PURCHASE_ADMIN'],
    relatedId: quotation._id,
    relatedModel: 'Quotation',
    link: `/quotations/${quotation._id}`
  }),

  notifyPOCreated: (po) => createNotification({
    title: 'Purchase Order Created',
    message: `Purchase Order ${po.poNumber} requires Super Admin approval`,
    type: 'PURCHASE',
    targetRoles: ['SUPER_ADMIN'],
    relatedId: po._id,
    relatedModel: 'PurchaseOrder',
    link: `/purchase-orders/${po._id}`
  }),

  notifyMaterialReady: (po) => createNotification({
    title: 'Materials Ready',
    message: `All materials received for PO ${po.poNumber} - Ready for Production`,
    type: 'PRODUCTION',
    targetRoles: ['SUPER_ADMIN', 'FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'],
    relatedId: po._id,
    relatedModel: 'PurchaseOrder',
    link: `/purchase-orders/${po._id}`
  }),

  notifyPowderCoatingComplete: (job) => createNotification({
    title: 'Powder Coating Completed',
    message: `Powder coating completed for Job ${job.jobNumber} - Electrical team can start`,
    type: 'PRODUCTION',
    targetRoles: ['SUPER_ADMIN', 'ELECTRICAL_ADMIN'],
    relatedId: job._id,
    relatedModel: 'Production',
    link: `/production/${job._id}`
  }),

  notifyMaterialRequest: (request) => createNotification({
    title: 'New Material Request',
    message: `${request.department} requests ${request.quantity} ${request.unit || ''} of ${request.materialName}`,
    type: 'MATERIAL',
    targetRoles: ['SUPER_ADMIN', 'PURCHASE_ADMIN'],
    relatedId: request._id,
    relatedModel: 'MaterialRequest',
    link: `/material-requests/${request._id}`
  }),

  createNotification
};
