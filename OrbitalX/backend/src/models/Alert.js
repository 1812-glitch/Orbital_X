const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Satellite', required: true },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL', 'RESOLVED'],
      default: 'INFO',
    },
    type: { type: String, required: true },
    message: { type: String, required: true },
    metric: { type: String },
    value: { type: Number },
    threshold: { type: Number },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
