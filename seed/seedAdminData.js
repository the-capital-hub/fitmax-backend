const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const connectDB = require("../config/db");
const User = require("../models/User");
const Assessment = require("../models/Assessment");
const RehabPlan = require("../models/RehabPlan");
const Exercise = require("../models/Exercise");
const ExerciseAssignment = require("../models/ExerciseAssignment");
const Progress = require("../models/Progress");
const Consultation = require("../models/Consultation");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");

const DEMO_PREFIX = "demo@fitmax.local";
const DEMO_EXERCISE_PREFIX = "[FITMAX DEMO]";

const firstNames = [
  "Aarav", "Ananya", "Rohan", "Priya", "Arjun", "Neha", "Vikram", "Kavya",
  "Rahul", "Ishita", "Aditya", "Sneha", "Karan", "Meera", "Nikhil", "Pooja",
  "Aman", "Riya", "Siddharth", "Tanya", "Varun", "Shreya", "Dev", "Simran",
  "Yash", "Aditi", "Manish", "Nandini", "Harsh", "Muskan"
];

const lastNames = [
  "Sharma", "Singh", "Verma", "Kumar", "Gupta", "Mishra", "Patel", "Mehta",
  "Sinha", "Rao", "Das", "Joshi", "Nair", "Kapoor", "Yadav"
];

const physioProfiles = [
  ["Ankit", "Verma", "Orthopedic Rehabilitation", "ankit.verma@fitmax.local"],
  ["Neha", "Sharma", "Sports Physiotherapy", "neha.sharma@fitmax.local"],
  ["Rahul", "Mehta", "Post Surgical Rehabilitation", "rahul.mehta@fitmax.local"],
  ["Priya", "Nair", "Pain and Mobility", "priya.nair@fitmax.local"],
  ["Vivek", "Rao", "Neurological Rehabilitation", "vivek.rao@fitmax.local"],
  ["Sneha", "Joshi", "Women Health Physiotherapy", "sneha.joshi@fitmax.local"],
  ["Kunal", "Patel", "Sports Injury Rehabilitation", "kunal.patel@fitmax.local"],
  ["Ritika", "Kapoor", "Musculoskeletal Physiotherapy", "ritika.kapoor@fitmax.local"],
  ["Amit", "Das", "Geriatric Rehabilitation", "amit.das@fitmax.local"],
  ["Isha", "Gupta", "Movement and Strength", "isha.gupta@fitmax.local"]
];

const conditions = [
  ["ACL Rehabilitation", "8 weeks", "Return to pain free running and sport"],
  ["Knee Rehabilitation", "6 weeks", "Walk stairs confidently"],
  ["Back Pain", "4 weeks", "Return to comfortable daily movement"],
  ["Neck Pain", "3 weeks", "Improve mobility and reduce stiffness"],
  ["Shoulder Rehabilitation", "7 weeks", "Restore overhead movement"],
  ["Sports Injury", "5 weeks", "Return to training safely"],
  ["Post Surgical Rehabilitation", "10 weeks", "Regain strength and independence"],
  ["Accident Recovery", "12 weeks", "Return to normal daily activities"],
  ["Mobility and Strength", "6 weeks", "Improve functional strength"],
  ["Fracture Rehabilitation", "9 weeks", "Restore mobility and confidence"]
];

const exerciseSeed = [
  ["Knee Extension", "Strength", "Knee", "Beginner", 3, 12],
  ["Straight Leg Raise", "Strength", "Knee", "Beginner", 3, 10],
  ["Heel Slides", "Mobility", "Knee", "Beginner", 3, 12],
  ["Glute Bridge", "Strength", "Hip", "Beginner", 3, 12],
  ["Clamshell", "Strength", "Hip", "Beginner", 3, 15],
  ["Calf Raise", "Strength", "Ankle", "Beginner", 3, 15],
  ["Hamstring Stretch", "Flexibility", "Leg", "Beginner", 3, 10],
  ["Quad Stretch", "Flexibility", "Knee", "Beginner", 3, 10],
  ["Wall Sit", "Strength", "Knee", "Intermediate", 3, 30],
  ["Step Up", "Functional", "Knee", "Intermediate", 3, 10],
  ["Single Leg Balance", "Balance", "Ankle", "Intermediate", 3, 30],
  ["Bird Dog", "Core", "Back", "Beginner", 3, 10],
  ["Cat Cow", "Mobility", "Back", "Beginner", 2, 12],
  ["Chin Tuck", "Mobility", "Neck", "Beginner", 3, 12],
  ["Shoulder Wall Slide", "Mobility", "Shoulder", "Beginner", 3, 10],
  ["External Rotation", "Strength", "Shoulder", "Intermediate", 3, 12],
  ["Resistance Row", "Strength", "Shoulder", "Intermediate", 3, 12],
  ["Thoracic Rotation", "Mobility", "Back", "Beginner", 2, 10],
  ["Sit to Stand", "Functional", "Full Body", "Beginner", 3, 10],
  ["Supported Squat", "Strength", "Full Body", "Intermediate", 3, 10]
];

const dateString = (daysFromToday) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
};

const dateValue = (daysFromToday) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d;
};

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await connectDB();
  const password = await bcrypt.hash("Fitmax@123", 10);

  // Remove only previous FitMax demo records. Existing real records stay untouched.
  const demoUsers = await User.find({
    $or: [
      { email: { $regex: /@fitmax\.local$/i } },
      { email: "admin@fitmax.demo" },
    ],
  }).select("_id");

  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length) {
    await Promise.all([
      Assessment.deleteMany({ patient: { $in: demoUserIds } }),
      RehabPlan.deleteMany({ $or: [{ patient: { $in: demoUserIds } }, { physio: { $in: demoUserIds } }] }),
      ExerciseAssignment.deleteMany({ $or: [{ patient: { $in: demoUserIds } }, { physio: { $in: demoUserIds } }] }),
      Progress.deleteMany({ $or: [{ patient: { $in: demoUserIds } }, { physio: { $in: demoUserIds } }] }),
      Consultation.deleteMany({ $or: [{ patient: { $in: demoUserIds } }, { physio: { $in: demoUserIds } }] }),
      Payment.deleteMany({ patient: { $in: demoUserIds } }),
      Notification.deleteMany({ $or: [{ recipient: { $in: demoUserIds } }, { sender: { $in: demoUserIds } }] }),
      User.deleteMany({ _id: { $in: demoUserIds } }),
    ]);
  }

  await Exercise.deleteMany({ title: { $regex: /^\[FITMAX DEMO\]/ } });

  const admin = await User.create({
    firstName: "FitMax",
    lastName: "Administrator",
    email: "admin@fitmax.demo",
    profession: "FitMax Operations",
    password,
    role: "admin",
    isActive: true,
  });

  const physios = await User.insertMany(
    physioProfiles.map(([firstName, lastName, profession, email]) => ({
      firstName,
      lastName,
      email,
      profession,
      password,
      role: "physio",
      isActive: true,
    }))
  );

  const patients = await User.insertMany(
    firstNames.map((firstName, index) => ({
      firstName,
      lastName: lastNames[index % lastNames.length],
      email: `patient${String(index + 1).padStart(2, "0")}@fitmax.local`,
      profession: "Patient",
      password,
      role: "patient",
      isActive: index % 11 !== 0,
    }))
  );

  const exercises = await Exercise.insertMany(
    exerciseSeed.map(([title, category, bodyArea, difficulty, sets, reps]) => ({
      title: `${DEMO_EXERCISE_PREFIX} ${title}`,
      category,
      bodyArea,
      difficulty,
      instructions: `Perform ${title.toLowerCase()} with controlled movement and follow the instructions provided by your physiotherapist.`,
      startingPosition: "Use a comfortable and supported starting position.",
      movement: "Move slowly through the prescribed range without forcing pain.",
      sets,
      reps,
      duration: difficulty === "Beginner" ? "10 minutes" : "15 minutes",
      active: true,
    }))
  );

  const assessments = [];
  const rehabPlans = [];
  const progressRows = [];
  const consultations = [];
  const payments = [];
  const assignments = [];
  const notifications = [];

  for (let i = 0; i < patients.length; i += 1) {
    const patient = patients[i];
    const physio = physios[i % physios.length];
    const [condition, duration, mainGoal] = conditions[i % conditions.length];
    const pain = Math.max(2, 8 - (i % 6));
    const planProgress = 25 + ((i * 7) % 70);

    assessments.push({
      patient: patient._id,
      condition,
      duration,
      pain,
      surgery: condition.includes("Surgical") ? "Post operative rehabilitation" : "",
      notes: `Demo assessment for ${patient.firstName}. Initial clinical review and functional history recorded.`,
      mainGoal,
      status: i % 4 === 0 ? "Submitted" : i % 4 === 1 ? "Under Review" : "Reviewed",
      createdAt: dateValue(-(i % 45)),
      updatedAt: dateValue(-(i % 10)),
    });

    const currentPhase = (i % 4) + 1;
    const phases = [
      { no: 1, title: "Protection and Mobility", description: "Restore comfortable movement and establish safe daily activity.", status: currentPhase > 1 ? "Completed" : "Current", progress: currentPhase > 1 ? 100 : Math.min(planProgress, 100) },
      { no: 2, title: "Strength and Control", description: "Build strength and movement control for daily function.", status: currentPhase > 2 ? "Completed" : currentPhase === 2 ? "Current" : "Upcoming", progress: currentPhase > 2 ? 100 : currentPhase === 2 ? Math.min(planProgress, 100) : 0 },
      { no: 3, title: "Functional Recovery", description: "Progress toward confident functional movement.", status: currentPhase > 3 ? "Completed" : currentPhase === 3 ? "Current" : "Upcoming", progress: currentPhase > 3 ? 100 : currentPhase === 3 ? Math.min(planProgress, 100) : 0 },
      { no: 4, title: "Return to Life", description: "Prepare for normal activity, work, sport and independence.", status: currentPhase === 4 ? "Current" : "Upcoming", progress: currentPhase === 4 ? Math.min(planProgress, 100) : 0 },
    ];

    rehabPlans.push({
      patient: patient._id,
      physio: physio._id,
      title: `${condition} Recovery Plan`,
      currentPhase,
      phaseProgress: planProgress,
      phases,
      weeklyFocus: currentPhase === 1 ? "Mobility and symptom control" : "Strength, consistency and functional movement",
      status: i % 9 === 0 ? "Paused" : i % 7 === 0 ? "Completed" : "Active",
      nextReviewDate: dateValue(7 + (i % 14)),
      createdAt: dateValue(-(i % 60)),
      updatedAt: dateValue(-(i % 8)),
    });

    for (let p = 0; p < 3; p += 1) {
      progressRows.push({
        patient: patient._id,
        physio: physio._id,
        pain: Math.max(1, Math.min(10, pain - p)),
        movementStatus: p === 0 ? "Same" : p === 1 ? "Better" : "Better",
        exerciseCompletion: Math.min(100, 52 + ((i * 9 + p * 13) % 45)),
        notes: p === 2 ? "Demo progress entry showing improving consistency." : "Demo recovery check in.",
        recordedAt: dateValue(-(21 - p * 7) - (i % 5)),
        createdAt: dateValue(-(21 - p * 7) - (i % 5)),
        updatedAt: dateValue(-(21 - p * 7) - (i % 5)),
      });
    }

    const selectedExercises = [0, 1, 3, 6, 8].map((offset) => exercises[(i + offset) % exercises.length]);
    selectedExercises.forEach((exercise, exerciseIndex) => {
      assignments.push({
        patient: patient._id,
        physio: physio._id,
        exercise: exercise._id,
        frequency: exerciseIndex === 0 ? "Daily" : "5 days per week",
        sets: exerciseIndex === 4 ? 2 : 3,
        reps: exerciseIndex === 4 ? 10 : 12,
        duration: "10 to 15 minutes",
        instructions: "Complete with controlled movement. Stop and contact your physiotherapist if symptoms significantly worsen.",
        status: exerciseIndex === 4 && i % 3 === 0 ? "Completed" : "Active",
        assignedAt: dateValue(-(i % 20)),
        createdAt: dateValue(-(i % 20)),
        updatedAt: dateValue(-(i % 10)),
      });
    });

    const appointmentStatus = i % 8 === 0 ? "Requested" : i % 7 === 0 ? "Completed" : i % 10 === 0 ? "Cancelled" : "Confirmed";
    const paymentStatus = i % 6 === 0 ? "Pending" : i % 13 === 0 ? "Failed" : "Paid";

    consultations.push({
      patient: patient._id,
      physio: physio._id,
      careTeam: `${physio.firstName} ${physio.lastName}`,
      title: `${condition} Follow Up`,
      type: i % 4 === 0 ? "In-person" : "Video",
      date: dateString(i % 12),
      time: `${5 + (i % 4)}:${i % 2 === 0 ? "00" : "30"} PM`,
      status: appointmentStatus,
      paymentStatus,
      notes: "Demo appointment created for Admin operations testing.",
      createdAt: dateValue(-(i % 30)),
      updatedAt: dateValue(-(i % 7)),
    });

    payments.push({
      patient: patient._id,
      amount: [999, 1499, 1999, 2499][i % 4],
      currency: "INR",
      method: ["upi", "card", "later"][i % 3],
      status: paymentStatus,
      transactionId: `FITDEMO${String(i + 1).padStart(5, "0")}`,
      description: "FitMax demo consultation payment",
      paidAt: paymentStatus === "Paid" ? dateValue(-(i % 20)) : null,
      createdAt: dateValue(-(i % 35)),
      updatedAt: dateValue(-(i % 12)),
    });

    notifications.push({
      recipient: patient._id,
      sender: physio._id,
      type: i % 3 === 0 ? "Progress" : i % 3 === 1 ? "Consultation" : "Rehab",
      title: i % 3 === 0 ? "Progress updated" : i % 3 === 1 ? "Upcoming consultation" : "Rehab plan updated",
      message: i % 3 === 0 ? "Your physiotherapist reviewed your latest recovery progress." : i % 3 === 1 ? "Your next FitMax consultation is scheduled." : "Your rehabilitation plan has been updated by your care team.",
      link: i % 3 === 0 ? "/patient/progress" : i % 3 === 1 ? "/patient/consultations" : "/patient/rehab",
      read: i % 4 === 0,
      createdAt: dateValue(-(i % 14)),
      updatedAt: dateValue(-(i % 14)),
    });
  }

  const assessmentDocs = await Assessment.insertMany(assessments);
  const rehabDocs = await RehabPlan.insertMany(rehabPlans);
  const progressDocs = await Progress.insertMany(progressRows);
  const consultationDocs = await Consultation.insertMany(consultations);

  for (let i = 0; i < payments.length; i += 1) {
    payments[i].consultation = consultationDocs[i]._id;
  }
  const paymentDocs = await Payment.insertMany(payments);
  const assignmentDocs = await ExerciseAssignment.insertMany(assignments);
  await Notification.insertMany(notifications);

  console.log("\n==============================================");
  console.log("FitMax Admin demo data seeded successfully");
  console.log("==============================================");
  console.log(`Admin:             1`);
  console.log(`Physiotherapists:  ${physios.length}`);
  console.log(`Patients:          ${patients.length}`);
  console.log(`Exercises:         ${exercises.length}`);
  console.log(`Assessments:       ${assessmentDocs.length}`);
  console.log(`Rehab plans:       ${rehabDocs.length}`);
  console.log(`Exercise assigns:  ${assignmentDocs.length}`);
  console.log(`Progress records:  ${progressDocs.length}`);
  console.log(`Consultations:     ${consultationDocs.length}`);
  console.log(`Payments:          ${paymentDocs.length}`);
  console.log(`Notifications:     ${notifications.length}`);
  console.log("\nAdmin login");
  console.log("Email:    admin@fitmax.demo");
  console.log("Password: Fitmax@123");
  console.log("==============================================\n");

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("\nFitMax demo seed failed:", error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
