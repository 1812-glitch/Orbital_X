const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { unreadOnly, type, limit = 50 } = req.query;
    let query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    if (type && type !== 'ALL') {
      query.type = type.toUpperCase();
    }
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));
      
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new notification (system or user-triggered test)
// @route   POST /api/notifications
// @access  Private
exports.createNotification = async (req, res) => {
  try {
    const { type = 'SYSTEM', title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    const notification = await Notification.create({
      userId: req.user._id,
      type: type.toUpperCase(),
      title,
      message,
      read: false
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds, id } = req.body || {};
    
    let query = { userId: req.user._id };
    if (id) {
      query._id = id;
    } else if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    } else {
      query.read = false;
    }

    await Notification.updateMany(query, { read: true });

    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Clear all notifications for a user or single notification
// @route   DELETE /api/notifications
// @access  Private
exports.clearNotifications = async (req, res) => {
  try {
    const { id } = req.query;
    let query = { userId: req.user._id };
    if (id) {
      query._id = id;
    }
    await Notification.deleteMany(query);
    res.status(200).json({ success: true, message: 'Notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
