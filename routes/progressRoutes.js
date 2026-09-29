const express=require("express");
const protect=require("../middleware/authMiddleware");
const authorizeRoles=require("../middleware/roleMiddleware");
const Progress=require("../models/Progress");
const RehabPlan=require("../models/RehabPlan");
const createNotification=require("../utils/createNotification");
const router=express.Router();

router.post("/checkin",protect,authorizeRoles("patient"),async(req,res)=>{
  try{
    const {pain,movementStatus,exerciseCompletion,notes}=req.body;
    if(pain===undefined || Number(pain)<0 || Number(pain)>10) return res.status(400).json({success:false,message:"Pain must be between 0 and 10"});
    if(exerciseCompletion!==undefined && (Number(exerciseCompletion)<0 || Number(exerciseCompletion)>100)) return res.status(400).json({success:false,message:"Exercise completion must be between 0 and 100"});
    const plan=await RehabPlan.findOne({patient:req.user.userId}).sort({createdAt:-1});
    const progress=await Progress.create({patient:req.user.userId,physio:plan?.physio||null,pain:Number(pain),movementStatus:movementStatus||"Same",exerciseCompletion:Number(exerciseCompletion||0),notes:notes||""});
    if (plan?.physio) {
      await createNotification({ recipient: plan.physio, sender: req.user.userId, type: "Progress", title: "Patient progress updated", message: "A patient has submitted a new recovery check-in.", link: "/physio/progress" });
    }
    res.status(201).json({success:true,progress});
  }catch(e){res.status(500).json({success:false,message:"Unable to save progress"});}
});

router.get("/my",protect,authorizeRoles("patient"),async(req,res)=>{
  try{
    const progress=await Progress.find({patient:req.user.userId}).sort({recordedAt:1});
    res.json({success:true,progress});
  }catch(e){res.status(500).json({success:false,message:"Unable to fetch progress"});}
});

router.get("/patient/:patientId",protect,authorizeRoles("physio"),async(req,res)=>{
  try{
    const progress=await Progress.find({patient:req.params.patientId,physio:req.user.userId}).sort({recordedAt:-1});
    res.json({success:true,progress});
  }catch(e){res.status(500).json({success:false,message:"Unable to fetch patient progress"});}
});

module.exports=router;
