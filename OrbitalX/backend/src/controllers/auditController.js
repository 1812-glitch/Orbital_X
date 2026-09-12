const AuditLog = require('../models/AuditLog');

// @desc    Get system audit logs
// @route   GET /api/audit
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const { severity, startDate, endDate, limit = '50', page = '1' } = req.query;
    let query = {};

    if (severity && typeof severity === 'string' && severity !== 'ALL') {
      query.severity = severity;
    }

    if (startDate && typeof startDate === 'string' && endDate && typeof endDate === 'string') {
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      if (!isNaN(sDate) && !isNaN(eDate)) {
        query.timestamp = { $gte: sDate, $lte: eDate };
      }
    } else if (startDate && typeof startDate === 'string') {
      const sDate = new Date(startDate);
      if (!isNaN(sDate)) {
        query.timestamp = { $gte: sDate };
      }
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (parsedPage - 1) * parsedLimit;

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({ success: true, data: logs, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
