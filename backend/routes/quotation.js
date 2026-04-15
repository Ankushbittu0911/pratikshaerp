const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/auth');
const { createUpload, createSingleUpload } = require('../config/multer');

router.use(protect);
router.get('/', ctrl.getQuotations);
router.post('/', authorize('SUPER_ADMIN', 'QUOTATION_ADMIN', 'SALES_ADMIN'), ctrl.createQuotation);
router.get('/:id', ctrl.getQuotation);
router.put('/:id/admin-status',
  authorize('SUPER_ADMIN', 'QUOTATION_ADMIN'),
  createSingleUpload('quotations', 'file'),
  ctrl.updateQuotationAdminStatus
);
router.put('/:id/sales-status',
  authorize('SUPER_ADMIN', 'SALES_ADMIN'),
  ctrl.updateSalesStatus
);
router.post('/:id/upload-files',
  authorize('SUPER_ADMIN', 'SALES_ADMIN'),
  createUpload('bom'),
  ctrl.uploadBomDrawings
);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deleteQuotation);
module.exports = router;
