const express = require('express');
const { 
  getNotifications, 
  getUnreadCount, 
  createNotification, 
  markAsRead, 
  clearNotifications 
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/unread-count', getUnreadCount);
router.get('/', getNotifications);
router.post('/', createNotification);
router.put('/read', markAsRead);
router.delete('/', clearNotifications);

module.exports = router;

