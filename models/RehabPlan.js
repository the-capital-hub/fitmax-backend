const mongoose = require("mongoose");

const rehabPhaseSchema = new mongoose.Schema(
  {
    no: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Upcoming",
        "Current",
        "Completed",
      ],
      default: "Upcoming",
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const rehabPlanSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    physio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    currentPhase: {
      type: Number,
      default: 1,
      min: 1,
    },

    phaseProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    phases: {
      type: [rehabPhaseSchema],
      default: [],
    },

    weeklyFocus: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Active",
        "Completed",
        "Paused",
      ],
      default: "Draft",
    },

    nextReviewDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RehabPlan = mongoose.model(
  "RehabPlan",
  rehabPlanSchema
);

module.exports = RehabPlan;