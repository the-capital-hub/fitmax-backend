const express=require("express");
const protect=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");
const Consultation=require("../models/Consultation");
const createNotification=require("../utils/createNotification");
const User=require("../models/User");
const router=express.Router();

router.get("/my",protect,authorizeRoles("patient"),async(req,res)=>{
 try{
  const consultations=await Consultation.find({patient:req.user.userId}).populate("physio","firstName lastName email").sort({date:1});
  res.json({success:true,consultations});
 }catch(e){res.status(500).json({success:false,message:"Unable to fetch consultations"});}
});

router.get("/physio",protect,authorizeRoles("physio"),async(req,res)=>{
 try{
  const consultations=await Consultation.find({physio:req.user.userId}).populate("patient","firstName lastName email").sort({date:1});
  res.json({success:true,consultations});
 }catch(e){res.status(500).json({success:false,message:"Unable to fetch consultations"});}
});

router.post("/",protect,authorizeRoles("physio"),async(req,res)=>{
 try{
  const {patient,title,date,time,type,status,notes}=req.body;
  if(!patient||!title||!date) return res.status(400).json({success:false,message:"Patient, title and date are required"});
  const patientUser=await User.findOne({_id:patient,role:{$in:["patient","member"]},isActive:true}).select("_id");
  if(!patientUser) return res.status(404).json({success:false,message:"Patient not found"});
  const consultation=await Consultation.create({patient,physio:req.user.userId,title,date,time,type:type||"Video",status:status||"Scheduled",notes:notes||""});
  await createNotification({ recipient: patient, sender: req.user.userId, type: "Consultation", title: "Consultation scheduled", message: `${title} is scheduled for ${new Date(date).toLocaleDateString()}${time ? ` at ${time}` : ""}.`, link: "/patient/consultations" });
  res.status(201).json({success:true,consultation});
 }catch(e){res.status(400).json({success:false,message:e.message||"Unable to create consultation"});}
});

router.patch("/:id",protect,authorizeRoles("physio"),async(req,res)=>{
 try{
  const consultation=await Consultation.findOne({_id:req.params.id,physio:req.user.userId});
  if(!consultation) return res.status(404).json({success:false,message:"Consultation not found"});
  ["title","date","time","type","status","notes"].forEach(k=>{if(req.body[k]!==undefined)consultation[k]=req.body[k]});
  const wasStatus=consultation.status;
  await consultation.save();
  if (req.body.status && req.body.status !== wasStatus) {
    await createNotification({ recipient: consultation.patient, sender: req.user.userId, type: "Consultation", title: `Consultation ${req.body.status.toLowerCase()}`, message: `${consultation.title} is now ${req.body.status.toLowerCase()}.`, link: "/patient/consultations" });
  }
  res.json({success:true,consultation});
 }catch(e){res.status(500).json({success:false,message:"Unable to update consultation"});}
});
module.exports=router;
