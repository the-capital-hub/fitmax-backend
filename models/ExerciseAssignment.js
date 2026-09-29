const mongoose = require("mongoose");

const exerciseAssignmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  physio: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise", required: true },
  frequency: { type: String, default: "Daily", trim: true },
  sets: { type: Number, default: 3, min: 1 },
  reps: { type: Number, default: 10, min: 1 },
  duration: { type: String, default: "", trim: true },
  instructions: { type: String, default: "", trim: true },
  status: { type: String, enum: ["Active", "Paused", "Completed"], default: "Active" },
  assignedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("ExerciseAssignment", exerciseAssignmentSchema);
