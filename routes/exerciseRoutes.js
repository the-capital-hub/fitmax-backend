const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const Exercise = require("../models/Exercise");
const ExerciseAssignment = require("../models/ExerciseAssignment");
const createNotification = require("../utils/createNotification");
const User = require("../models/User");

const router = express.Router();

router.get("/library", protect, authorizeRoles("physio"), async (req,res)=>{
  try {
    let exercises=await Exercise.find({active:true}).sort({createdAt:-1});
    if (exercises.length === 0) {
      const defaults = [
        { title:"Heel Slides", category:"Mobility", bodyArea:"Knee", difficulty:"Beginner", instructions:"Slide the heel toward the body slowly, then return with control.", sets:2, reps:12 },
        { title:"Knee Extension", category:"Strength", bodyArea:"Knee", difficulty:"Beginner", instructions:"Straighten the knee with controlled movement and return slowly.", sets:3, reps:10 },
        { title:"Sit to Stand", category:"Control", bodyArea:"Lower body", difficulty:"Beginner", instructions:"Stand from a stable chair with controlled knee and hip alignment.", sets:2, reps:8 },
        { title:"Supported Balance", category:"Balance", bodyArea:"Lower body", difficulty:"Beginner", instructions:"Hold a stable support and maintain comfortable single-leg balance.", sets:3, reps:1, duration:"30 seconds" },
        { title:"Glute Bridge", category:"Strength", bodyArea:"Hip", difficulty:"Beginner", instructions:"Lift the hips while keeping the trunk controlled, then lower slowly.", sets:3, reps:10 },
        { title:"Wall Shoulder Slides", category:"Mobility", bodyArea:"Shoulder", difficulty:"Beginner", instructions:"Slide both arms upward against the wall within a comfortable range.", sets:2, reps:10 }
      ];
      await Exercise.insertMany(defaults);
      exercises=await Exercise.find({active:true}).sort({createdAt:-1});
    }
    res.json({success:true, exercises});
  } catch(e){ res.status(500).json({success:false,message:"Server error while fetching exercise library"}); }
});

router.post("/library", protect, authorizeRoles("physio"), async (req,res)=>{
  try {
    const exercise=await Exercise.create(req.body);
    res.status(201).json({success:true,exercise});
  } catch(e){ res.status(400).json({success:false,message:e.message||"Unable to create exercise"}); }
});

router.get("/my", protect, authorizeRoles("patient"), async (req,res)=>{
  try {
    const assignments=await ExerciseAssignment.find({patient:req.user.userId,status:"Active"})
      .populate("exercise").populate("physio","firstName lastName").sort({createdAt:-1});
    res.json({success:true,assignments});
  } catch(e){ res.status(500).json({success:false,message:"Server error while fetching assigned exercises"}); }
});

router.get("/patient/:patientId", protect, authorizeRoles("physio"), async (req,res)=>{
  try {
    const assignments=await ExerciseAssignment.find({patient:req.params.patientId,physio:req.user.userId})
      .populate("exercise").sort({createdAt:-1});
    res.json({success:true,assignments});
  } catch(e){ res.status(500).json({success:false,message:"Server error while fetching patient exercises"}); }
});

router.post("/assign", protect, authorizeRoles("physio"), async (req,res)=>{
  try {
    const {patient,exercise,frequency,sets,reps,duration,instructions}=req.body;
    if(!patient || !exercise) return res.status(400).json({success:false,message:"Patient and exercise are required"});
    const patientUser = await User.findOne({ _id: patient, role: { $in: ["patient", "member"] }, isActive: true }).select("_id");
    if (!patientUser) return res.status(404).json({ success:false, message:"Patient not found" });
    const exerciseRecord = await Exercise.findOne({ _id: exercise, active: true }).select("_id");
    if (!exerciseRecord) return res.status(404).json({ success:false, message:"Exercise not found or inactive" });
    const assignment=await ExerciseAssignment.create({
      patient,physio:req.user.userId,exercise,frequency:frequency||"Daily",
      sets:sets||3,reps:reps||10,duration:duration||"",instructions:instructions||""
    });
    const populated=await assignment.populate("exercise");
    await createNotification({ recipient: patient, sender: req.user.userId, type: "Exercise", title: "New exercise assigned", message: `${populated.exercise?.title || "A new exercise"} has been added to your rehab program.`, link: "/patient/exercises" });
    res.status(201).json({success:true,assignment:populated});
  } catch(e){ res.status(400).json({success:false,message:e.message||"Unable to assign exercise"}); }
});

router.patch("/assignments/:assignmentId", protect, async (req,res)=>{
  try {
    const allowedStatuses=["Active","Paused","Completed"];
    if (!allowedStatuses.includes(req.body.status)) return res.status(400).json({success:false,message:"Invalid assignment status"});
    const query={_id:req.params.assignmentId};
    if(req.user.role==="physio") query.physio=req.user.userId;
    else query.patient=req.user.userId;
    const assignment=await ExerciseAssignment.findOneAndUpdate(query,{status:req.body.status},{new:true}).populate("exercise");
    if(!assignment) return res.status(404).json({success:false,message:"Exercise assignment not found"});
    res.json({success:true,assignment});
  } catch(e){ res.status(500).json({success:false,message:"Unable to update exercise assignment"}); }
});

module.exports=router;
