const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    missionId: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, default: 'PLANNED' },
    launchDate: { type: Date },
    launchSite: { type: String },
    assignedSatellites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Satellite' }],
    formFactor: { type: String, default: '3U' },
    orbitType: { type: String, default: 'LEO' },
    cubesatDesign: { type: mongoose.Schema.Types.Mixed },
    duration: { type: String },
    objective: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mission', missionSchema);
