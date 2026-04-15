// materialRequest.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/materialRequestController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getRequests);
router.post('/', authorize('SUPER_ADMIN', 'FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'), ctrl.createRequest);
router.put('/:id/status', authorize('SUPER_ADMIN', 'PURCHASE_ADMIN'), ctrl.updateRequestStatus);
router.delete('/:id', authorize('SUPER_ADMIN'), ctrl.deleteRequest);
module.exports = router;
