const AuditLog = require('../models/AuditLog');

const auditService = {
  /**
   * Log an action to the audit trail.
   */
  logAction: async ({ userId, source, action, resource, resourceId, details, severity = 'INFO', ipAddress }) => {
    try {
      await AuditLog.create({
        userId,
        source: source || (userId ? null : 'SYSTEM'),
        action,
        resource,
        resourceId,
        details,
        severity,
        ipAddress
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
};

module.exports = auditService;
