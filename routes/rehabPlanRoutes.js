const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const RehabPlan = require("../models/RehabPlan");
const createNotification = require("../utils/createNotification");
const User = require("../models/User");

const router = express.Router();

router.post("/", protect, authorizeRoles("physio"), async (req, res) => {
  try {
    const { patient, title, currentPhase, phaseProgress, phases, weeklyFocus, status, nextReviewDate } = req.body;
    if (!patient || !title) return res.status(400).json({ success: false, message: "Patient and plan title are required" });
    const patientUser = await User.findOne({ _id: patient, role: { $in: ["patient", "member"] }, isActive: true }).select("_id");
    if (!patientUser) return res.status(404).json({ success: false, message: "Patient not found" });
    if (phaseProgress !== undefined && (Number(phaseProgress) < 0 || Number(phaseProgress) > 100)) {
      return res.status(400).json({ success: false, message: "Phase progress must be between 0 and 100" });
    }
    const rehabPlan = await RehabPlan.create({
      patient, physio: req.user.userId, title,
      currentPhase: currentPhase !== undefined ? Number(currentPhase) : 1,
      phaseProgress: phaseProgress !== undefined ? Number(phaseProgress) : 0,
      phases: phases || [], weeklyFocus: weeklyFocus || "",
      status: status || "Draft", nextReviewDate: nextReviewDate || null,
    });
    await createNotification({ recipient: patient, sender: req.user.userId, type: "Rehab", title: "Rehab plan created", message: `${title} is now available in your recovery space.`, link: "/patient/rehab" });
    res.status(201).json({ success: true, message: "Rehab plan created successfully", rehabPlan });
  } catch (error) {
    console.error("Rehab plan creation error:", error.message);
    res.status(500).json({ success: false, message: "Server error while creating rehab plan" });
  }
});

router.get("/my", protect, authorizeRoles("patient"), async (req, res) => {
  try {
    const rehabPlan = await RehabPlan.findOne({ patient: req.user.userId })
      .populate("physio", "firstName lastName email profession").sort({ createdAt: -1 });
    if (!rehabPlan) return res.status(404).json({ success: false, message: "No rehab plan found" });
    res.json({ success: true, rehabPlan });
  } catch (error) {
    console.error("Rehab plan fetch error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching rehab plan" });
  }
});

router.get("/patient/:patientId", protect, authorizeRoles("physio"), async (req, res) => {
  try {
    const rehabPlan = await RehabPlan.findOne({ patient: req.params.patientId, physio: req.user.userId })
      .populate("physio", "firstName lastName email profession").sort({ createdAt: -1 });
    res.json({ success: true, rehabPlan: rehabPlan || null });
  } catch (error) {
    console.error("Physio rehab fetch error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching patient rehab plan" });
  }
});

router.patch("/:planId", protect, authorizeRoles("physio"), async (req, res) => {
  try {
    const plan = await RehabPlan.findOne({ _id: req.params.planId, physio: req.user.userId });
    if (!plan) return res.status(404).json({ success: false, message: "Rehab plan not found" });
    const allowed = ["title", "currentPhase", "phaseProgress", "phases", "weeklyFocus", "status", "nextReviewDate"];
    allowed.forEach((key) => { if (req.body[key] !== undefined) plan[key] = req.body[key]; });
    await plan.save();
    await createNotification({ recipient: plan.patient, sender: req.user.userId, type: "Rehab", title: "Rehab plan updated", message: "Your physiotherapist updated your rehabilitation plan.", link: "/patient/rehab" });
    res.json({ success: true, rehabPlan: plan });
  } catch (error) {
    console.error("Rehab plan update error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating rehab plan" });
  }
});

module.exports = router;
