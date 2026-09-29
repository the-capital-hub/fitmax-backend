const RehabPlan = require("../models/RehabPlan");
const ExerciseAssignment = require("../models/ExerciseAssignment");
const Consultation = require("../models/Consultation");

// A patient is considered assigned to a physiotherapist when there is an
// existing rehab plan, exercise assignment, or consultation connecting them.
const isPhysioAssignedToPatient = async (physioId, patientId) => {
  const [rehabPlan, exerciseAssignment, consultation] = await Promise.all([
    RehabPlan.exists({ patient: patientId, physio: physioId }),
    ExerciseAssignment.exists({ patient: patientId, physio: physioId }),
    Consultation.exists({ patient: patientId, physio: physioId }),
  ]);

  return Boolean(rehabPlan || exerciseAssignment || consultation);
};

module.exports = { isPhysioAssignedToPatient };
