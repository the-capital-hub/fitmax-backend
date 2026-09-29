const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  physio: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  pain: { type: Number, min: 0, max: 10, required: true },
  movementStatus: { type: String, enum: ["Better", "Same", "Worse"], default: "Same" },
  exerciseCompletion: { type: Number, min: 0, max: 100, default: 0 },
  notes: { type: String, default: "", trim: true },
  recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);
