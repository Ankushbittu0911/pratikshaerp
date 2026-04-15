const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getNotifications);
router.put('/mark-all-read', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);
module.exports = router;
