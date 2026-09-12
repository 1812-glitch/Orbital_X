const mongoose = require('mongoose');

const satelliteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    satelliteId: { type: String, required: true, unique: true },
    noradId: { type: String },
    status: { type: String, default: 'ACTIVE' },
    orbitType: { type: String, default: 'LEO' },
    orbitRadius: { type: Number },
    orbitSpeed: { type: Number },
    inclination: { type: Number },
    currentPosition: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    currentTelemetry: { type: mongoose.Schema.Types.ObjectId, ref: 'Telemetry' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Satellite', satelliteSchema);
