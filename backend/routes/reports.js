const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', ctrl.getSuperAdminDashboard);
router.get('/enquiry', ctrl.getEnquiryReport);
router.get('/quotation', ctrl.getQuotationReport);
router.get('/purchase', ctrl.getPurchaseReport);
router.get('/material', ctrl.getMaterialReport);
router.get('/production', ctrl.getProductionReport);
module.exports = router;
