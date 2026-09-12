const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema(
  {
    satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Satellite', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    direction: { type: String, enum: ['TX', 'RX'], required: true }, // TX = Transmit (To satellite), RX = Receive (From satellite)
    message: { type: String, required: true },
    type: { type: String, default: 'TEXT' },
    status: { type: String, default: 'DELIVERED' },
    latency: { type: Number }, // in milliseconds
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('Communication', communicationSchema);
