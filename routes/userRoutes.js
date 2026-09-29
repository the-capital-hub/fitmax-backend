const express = require("express");

const protect = require(
  "../middleware/authMiddleware"
);

const User = require(
  "../models/User"
);
const authorizeRoles = require(
  "../middleware/roleMiddleware"
);
const RehabPlan = require("../models/RehabPlan");
const ExerciseAssignment = require("../models/ExerciseAssignment");
const Consultation = require("../models/Consultation");

const router = express.Router();


// GET USER PROFILE
router.get(
  "/profile",
  protect,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.userId
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profession: user.profession,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching profile",
      });
    }
  }
);


// UPDATE USER PROFILE
router.put(
  "/profile",
  protect,
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        profession,
      } = req.body;

      // Validate required fields
      if (
        !firstName ||
        !lastName ||
        !email ||
        !profession
      ) {
        return res.status(400).json({
          success: false,
          message:
            "First name, last name, email and profession are required",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      // Check whether another user already
      // has this email
      const existingUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: req.user.userId,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists",
        });
      }

      const user =
        await User.findByIdAndUpdate(
          req.user.userId,
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            profession: profession.trim(),
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profession: user.profession,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Profile update error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while updating profile",
      });
    }
  }
);

// GET ALL PATIENTS FOR PHYSIO
router.get(
  "/patients",
  protect,
  authorizeRoles("physio"),
  async (req, res) => {
    try {
      const [rehabPatients, exercisePatients, consultationPatients] = await Promise.all([
        RehabPlan.distinct("patient", { physio: req.user.userId }),
        ExerciseAssignment.distinct("patient", { physio: req.user.userId }),
        Consultation.distinct("patient", { physio: req.user.userId }),
      ]);
      const assignedPatientIds = [...new Set([
        ...rehabPatients.map(String),
        ...exercisePatients.map(String),
        ...consultationPatients.map(String),
      ])];
      const patients = assignedPatientIds.length
        ? await User.find({
            _id: { $in: assignedPatientIds },
            role: { $in: ["patient", "member"] },
            isActive: true,
          })
            .select("firstName lastName email profession role isActive createdAt")
            .sort({ createdAt: -1 })
        : [];

      return res.status(200).json({
        success: true,
        patients,
      });
    } catch (error) {
      console.error(
        "Patients fetch error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching patients",
      });
    }
  }
);


// GET PATIENT DETAIL FOR PHYSIO
router.get(
  "/patients/:patientId",
  protect,
  authorizeRoles("physio"),
  async (req, res) => {
    try {
      const [rehabAssigned, exerciseAssigned, consultationAssigned] = await Promise.all([
        RehabPlan.exists({ patient: req.params.patientId, physio: req.user.userId }),
        ExerciseAssignment.exists({ patient: req.params.patientId, physio: req.user.userId }),
        Consultation.exists({ patient: req.params.patientId, physio: req.user.userId }),
      ]);
      if (!rehabAssigned && !exerciseAssigned && !consultationAssigned) {
        return res.status(403).json({ success: false, message: "You are not assigned to this patient" });
      }
      const patient = await User.findOne({
        _id: req.params.patientId,
        role: { $in: ["patient", "member"] },
        isActive: true,
      }).select("-password");
      if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });
      return res.json({
        success: true,
        patient: {
          id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          profession: patient.profession,
          role: patient.role === "member" ? "patient" : patient.role,
          isActive: patient.isActive,
          createdAt: patient.createdAt,
        },
      });
    } catch (error) {
      console.error("Patient detail error:", error.message);
      return res.status(500).json({ success: false, message: "Server error while fetching patient" });
    }
  }
);


// GET ALL PATIENTS FOR ADMIN
router.get(
  "/admin/patients",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const patients = await User.find({
        role: { $in: ["patient", "member"] },
      })
        .select("firstName lastName email profession role isActive createdAt")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        patients: patients.map((patient) => ({
          id: patient._id,
          name: `${patient.firstName} ${patient.lastName}`.trim(),
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          profession: patient.profession,
          role: "patient",
          isActive: patient.isActive,
          createdAt: patient.createdAt,
        })),
        stats: {
          total: patients.length,
          active: patients.filter((patient) => patient.isActive).length,
          inactive: patients.filter((patient) => !patient.isActive).length,
        },
      });
    } catch (error) {
      console.error("Admin patients fetch error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching admin patients",
      });
    }
  }
);

// GET ALL PHYSIOTHERAPISTS FOR ADMIN
router.get(
  "/admin/physiotherapists",
  protect,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const physiotherapists = await User.find({ role: "physio" })
        .select("firstName lastName email profession role isActive createdAt")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        physiotherapists: physiotherapists.map((physio) => ({
          id: physio._id,
          name: `${physio.firstName} ${physio.lastName}`.trim(),
          firstName: physio.firstName,
          lastName: physio.lastName,
          email: physio.email,
          profession: physio.profession,
          role: physio.role,
          isActive: physio.isActive,
          createdAt: physio.createdAt,
        })),
        stats: {
          total: physiotherapists.length,
          active: physiotherapists.filter((physio) => physio.isActive).length,
          inactive: physiotherapists.filter((physio) => !physio.isActive).length,
        },
      });
    } catch (error) {
      console.error("Admin physiotherapists fetch error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching admin physiotherapists",
      });
    }
  }
);

module.exports = router;