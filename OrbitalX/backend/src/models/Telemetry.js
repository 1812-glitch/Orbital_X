const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
  {
    satelliteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Satellite', required: true },
    timestamp: { type: Date, default: Date.now, required: true },
    temperature: { type: Number },
    speed: { type: Number },
    altitude: { type: Number },
    distanceFromEarth: { type: Number },
    battery: { type: Number },
    signal: { type: Number },
    connectivity: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    health: { type: Number },
    cpu: { type: Number },
    memory: { type: Number },
  },
  { timestamps: false }
);

telemetrySchema.index({ satelliteId: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);
