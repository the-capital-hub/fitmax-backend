const express=require("express");
const protect=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");
const User=require("../models/User");
const Assessment=require("../models/Assessment");
const RehabPlan=require("../models/RehabPlan");
const Consultation=require("../models/Consultation");
const router=express.Router();

router.get("/physio",protect,authorizeRoles("physio"),async(req,res)=>{
 try{
  const patientCount=await User.countDocuments({role:{$in:["patient","member"]},isActive:true});
  const activePlans=await RehabPlan.countDocuments({physio:req.user.userId,status:"Active"});
  const consultations=await Consultation.countDocuments({physio:req.user.userId,status:"Scheduled"});
  const assessments=await Assessment.countDocuments({status:{$in:["Submitted","Under Review"]}});
  res.json({success:true,stats:{activePatients:patientCount,activePlans,scheduledConsultations:consultations,pendingAssessments:assessments}});
 }catch(e){res.status(500).json({success:false,message:"Unable to fetch dashboard statistics"});}
});
module.exports=router;
