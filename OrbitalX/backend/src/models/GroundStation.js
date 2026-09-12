const mongoose = require('mongoose');

const groundStationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    stationId: { type: String, required: true, unique: true },
    country: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    status: { type: String, default: 'OPERATIONAL' },
    connectedSatellites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Satellite' }],
    signalQuality: { type: Number },
    lastContact: { type: Date },
    nextContact: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GroundStation', groundStationSchema);
