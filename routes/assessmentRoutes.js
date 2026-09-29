const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Assessment = require("../models/Assessment");
const createNotification = require("../utils/createNotification");
const { isPhysioAssignedToPatient } = require("../utils/physioAccess");

const router = express.Router();

router.post("/", protect, authorizeRoles("patient"), async (req, res) => {
  try {
    const { condition, duration, pain, surgery, notes, mainGoal } = req.body;
    if (!condition || !duration) {
      return res.status(400).json({ success: false, message: "Condition and duration are required" });
    }
    if (pain !== undefined && (Number(pain) < 0 || Number(pain) > 10)) {
      return res.status(400).json({ success: false, message: "Pain must be between 0 and 10" });
    }
    const assessment = await Assessment.create({
      patient: req.user.userId, condition, duration,
      pain: pain !== undefined ? Number(pain) : 0,
      surgery: surgery || "", notes: notes || "", mainGoal: mainGoal || "", status: "Submitted",
    });
    res.status(201).json({ success: true, message: "Assessment submitted successfully", assessment });
  } catch (error) {
    console.error("Assessment creation error:", error.message);
    res.status(500).json({ success: false, message: "Server error while creating assessment" });
  }
});

router.get("/my", protect, authorizeRoles("patient"), async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ patient: req.user.userId }).sort({ createdAt: -1 });
    if (!assessment) return res.status(404).json({ success: false, message: "No assessment found" });
    res.json({ success: true, assessment });
  } catch (error) {
    console.error("Assessment fetch error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching assessment" });
  }
});

router.get("/patient/:patientId", protect, authorizeRoles("physio"), async (req, res) => {
  try {
    const assigned = await isPhysioAssignedToPatient(req.user.userId, req.params.patientId);
    if (!assigned) return res.status(403).json({ success: false, message: "You are not assigned to this patient" });
    const assessment = await Assessment.findOne({ patient: req.params.patientId }).sort({ createdAt: -1 });
    if (!assessment) return res.status(404).json({ success: false, message: "No assessment found for this patient" });
    res.json({ success: true, assessment });
  } catch (error) {
    console.error("Physio assessment fetch error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching patient assessment" });
  }
});

router.patch("/:assessmentId/status", protect, authorizeRoles("physio"), async (req, res) => {
  try {
    const allowed = ["Submitted", "Under Review", "Reviewed"];
    const existing = await Assessment.findById(req.params.assessmentId);
    if (!existing) return res.status(404).json({ success: false, message: "Assessment not found" });
    const assigned = await isPhysioAssignedToPatient(req.user.userId, existing.patient);
    if (!assigned) return res.status(403).json({ success: false, message: "You are not assigned to this patient" });
    if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid assessment status" });
    const assessment = await Assessment.findByIdAndUpdate(req.params.assessmentId, { status: req.body.status }, { new: true });
    await createNotification({ recipient: assessment.patient, sender: req.user.userId, type: "Assessment", title: "Assessment updated", message: `Your assessment is now ${req.body.status.toLowerCase()}.`, link: "/patient/assessment" });
    res.json({ success: true, assessment });
  } catch (error) {
    console.error("Assessment status error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating assessment" });
  }
});

module.exports = router;
