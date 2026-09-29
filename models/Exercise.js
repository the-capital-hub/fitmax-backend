const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: "Mobility", trim: true },
  bodyArea: { type: String, default: "", trim: true },
  difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  instructions: { type: String, default: "", trim: true },
  startingPosition: { type: String, default: "", trim: true },
  movement: { type: String, default: "", trim: true },
  sets: { type: Number, default: 3, min: 1 },
  reps: { type: Number, default: 10, min: 1 },
  duration: { type: String, default: "", trim: true },
  videoUrl: { type: String, default: "", trim: true },
  imageUrl: { type: String, default: "", trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Exercise", exerciseSchema);
