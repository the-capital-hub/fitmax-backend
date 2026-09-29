const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Consultation = require("../models/Consultation");
const createNotification = require("../utils/createNotification");
const User = require("../models/User");

const router = express.Router();

router.get("/my", protect, authorizeRoles("patient"), async (req, res) => {
  try {
    const consultations = await Consultation.find({ patient: req.user.userId })
      .populate("physio", "firstName lastName email")
      .sort({ date: 1, time: 1 });

    return res.json({ success: true, consultations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch consultations",
    });
  }
});

router.get("/physio", protect, authorizeRoles("physio"), async (req, res) => {
  try {
    const consultations = await Consultation.find({
      $or: [
        { physio: req.user.userId },
        { physio: null, status: "Requested" },
      ],
    })
      .populate("patient", "firstName lastName email")
      .populate("physio", "firstName lastName email")
      .sort({ date: 1, time: 1 });

    return res.json({ success: true, consultations });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch consultations",
    });
  }
});

router.post(
  "/",
  protect,
  authorizeRoles("patient", "physio"),
  async (req, res) => {
    try {
      const role = req.user.role;
      const {
        patient: requestedPatient,
        careTeam,
        title,
        date,
        time,
        type,
        status,
        notes,
      } = req.body;

      if (!date || !time) {
        return res.status(400).json({
          success: false,
          message: "Consultation date and time are required",
        });
      }

      let patientId = req.user.userId;
      let physioId = null;
      let consultationStatus = "Requested";

      if (role === "physio") {
        if (!requestedPatient || !title) {
          return res.status(400).json({
            success: false,
            message: "Patient and consultation title are required",
          });
        }

        const patientUser = await User.findOne({
          _id: requestedPatient,
          role: { $in: ["patient", "member"] },
          isActive: true,
        }).select("_id");

        if (!patientUser) {
          return res.status(404).json({
            success: false,
            message: "Patient not found",
          });
        }

        patientId = requestedPatient;
        physioId = req.user.userId;
        consultationStatus = "Confirmed";
      }

      const consultation = await Consultation.create({
        patient: patientId,
        physio: physioId,
        careTeam: careTeam || "FitMax Care Team",
        title: title || "Physiotherapy Consultation",
        date,
        time,
        type: type || "Video",
        status: role === "physio" ? status || consultationStatus : "Requested",
        notes: notes || "",
      });

      if (role === "physio") {
        await createNotification({
          recipient: patientId,
          sender: req.user.userId,
          type: "Consultation",
          title: "Consultation scheduled",
          message: `${consultation.title} is confirmed for ${date}${time ? ` at ${time}` : ""}.`,
          link: "/patient/consultations",
        });
      }

      return res.status(201).json({ success: true, consultation });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to create consultation",
      });
    }
  }
);

router.patch(
  "/:id",
  protect,
  authorizeRoles("physio"),
  async (req, res) => {
    try {
      const consultation = await Consultation.findOne({
        _id: req.params.id,
        $or: [
          { physio: req.user.userId },
          { physio: null, status: "Requested" },
        ],
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: "Consultation not found or not available to you",
        });
      }

      const previousStatus = consultation.status;
      const wasUnassigned = !consultation.physio;

      if (wasUnassigned) {
        consultation.physio = req.user.userId;
      }

      ["title", "date", "time", "type", "status", "notes", "careTeam"].forEach(
        (field) => {
          if (req.body[field] !== undefined) {
            consultation[field] = req.body[field];
          }
        }
      );

      await consultation.save();

      if (
        req.body.status &&
        req.body.status !== previousStatus
      ) {
        await createNotification({
          recipient: consultation.patient,
          sender: req.user.userId,
          type: "Consultation",
          title: `Consultation ${req.body.status.toLowerCase()}`,
          message: `${consultation.title} is now ${req.body.status.toLowerCase()}.`,
          link: "/patient/consultations",
        });
      }

      return res.json({ success: true, consultation });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to update consultation",
      });
    }
  }
);

module.exports = router;
