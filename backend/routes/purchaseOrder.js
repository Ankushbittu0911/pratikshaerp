const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseOrderController');
const { protect, authorize } = require('../middleware/auth');
const { createSingleUpload } = require('../config/multer');

router.use(protect);
router.get('/', ctrl.getPOs);
router.post('/', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), createSingleUpload('purchase', 'file'), ctrl.createPO);
router.get('/:id', ctrl.getPO);
router.put('/:id/approve', authorize('SUPER_ADMIN'), ctrl.approvePO);
router.put('/:id/mark-ready', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.markReadyForProduction);
router.put('/:id/material-tracking', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.updateMaterialTracking);
router.post('/:id/material-items', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.addMaterialItem);
router.put('/:id/material-items/:itemId', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.updateMaterialItem);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deletePO);
module.exports = router;
