const Alert = require('../models/Alert');

// @desc    Get all alerts with filtering
// @route   GET /api/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
  try {
    const { status, severity, satelliteId, limit = 50 } = req.query;
    
    let query = {};
    if (status === 'ACTIVE') {
      query.severity = { $ne: 'RESOLVED' };
    } else if (status === 'RESOLVED') {
      query.severity = 'RESOLVED';
    }
    
    if (severity && severity !== 'ALL') query.severity = severity;
    if (satelliteId && satelliteId !== 'ALL') query.satelliteId = satelliteId;

    const alerts = await Alert.find(query)
      .populate('satelliteId', 'name satelliteId')
      .populate('acknowledgedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get alert statistics (KPIs)
// @route   GET /api/alerts/stats
// @access  Private
exports.getAlertStats = async (req, res) => {
  try {
    const critical = await Alert.countDocuments({ severity: 'CRITICAL' });
    const warning = await Alert.countDocuments({ severity: 'WARNING' });
    const resolved = await Alert.countDocuments({ severity: 'RESOLVED' });
    
    // Total alerts in last 24 hours
    const yesterday = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
    const total24h = await Alert.countDocuments({ createdAt: { $gte: yesterday } });

    res.status(200).json({
      success: true,
      data: { critical, warning, resolved, total24h }
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update alert status (Acknowledge / Resolve)
// @route   PUT /api/alerts/:id/status
// @access  Private
exports.updateAlertStatus = async (req, res) => {
  try {
    const { action } = req.body; // 'ACKNOWLEDGE' or 'RESOLVE'
    const alertId = req.params.id;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    if (action === 'ACKNOWLEDGE') {
      alert.acknowledged = true;
      alert.acknowledgedBy = req.user._id;
    } else if (action === 'RESOLVE') {
      alert.severity = 'RESOLVED';
      alert.resolvedAt = new Date();
    }

    await alert.save();
    
    // Re-fetch with populated fields to return
    const updatedAlert = await Alert.findById(alertId)
      .populate('satelliteId', 'name satelliteId')
      .populate('acknowledgedBy', 'name email');

    // Here we would ideally emit a socket event to update clients
    const io = req.app.get('io');
    if (io) {
      io.emit('alert:updated', updatedAlert);
    }

    res.status(200).json({ success: true, data: updatedAlert });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
