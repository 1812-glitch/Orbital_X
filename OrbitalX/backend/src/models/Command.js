const mongoose = require('mongoose');

const commandSchema = new mongoose.Schema(
  {
    satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Satellite', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['SENT', 'PROCESSING', 'ACKNOWLEDGED', 'FAILED'],
      default: 'SENT',
    },
    sentAt: { type: Date, default: Date.now },
    acknowledgedAt: { type: Date },
    response: { type: String },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Command', commandSchema);
