const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    condition: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: String,
      required: true,
      trim: true,
    },

    pain: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },

    surgery: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    mainGoal: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Submitted",
        "Under Review",
        "Reviewed",
      ],
      default: "Submitted",
    },
  },
  {
    timestamps: true,
  }
);

const Assessment =
  mongoose.model(
    "Assessment",
    assessmentSchema
  );

module.exports = Assessment;