const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    source: { type: String }, // E.g., SYS_MONITOR_DMN, SYS_AUTH
    action: { type: String, required: true },
    resource: { type: String },
    resourceId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
