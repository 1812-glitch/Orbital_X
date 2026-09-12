const express = require('express');
const { getNotifications, markAsRead, clearNotifications } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.put('/read', markAsRead);
router.delete('/', clearNotifications);

module.exports = router;
