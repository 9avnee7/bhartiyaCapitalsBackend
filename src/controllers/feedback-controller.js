const express=require('express');
const Feedback=require('../models/feedback');
const logger=require('../utils/logger');
const { validateCreateFeedback } = require('../utils/validation');
const { error } = require('winston');
// const {}=require('.')
//handler file 
//post feedback

const postFeedback=async(req,res)=>{
    logger.info('post feedback endpoint hit');

    try{
        const {error}=validateCreateFeedback(req.body);
        if(error){
            logger.warn("validation error",error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
              });

        }
        const {username,content,profilePic}=req.body;

        console.log(username,content);

        const newFeedback=await Feedback.create({
            username,
            content,
            profilePic
        })
        //the feedback will be validated using joy
        if(!newFeedback){
           return res.status(400).json({
            content:newFeedback,
            message:"error adding feedback"
           })
        }

        return res.status(200).json({
            sucess:true,
            message:"feedback added sucessfully"
        })

    }
    catch(e){
        return res.status(500).json({
            sucess:false,
            message:"internal server error",
            data:e.message
        })
    }
}


const getAllFeedback=async(req,res)=>{
    logger.info("Get All Feedback endpoint Hit");
    try{
        const allFeedbacks=await Feedback.find();
        if(!allFeedbacks){
            return res.status(400).json({
                message:"no feedback found"
            })
        }
        return res.status(200).json({
            success:true,
            data:allFeedbacks
        })
    }
    catch(e){
        return res.status(500).json({
            success:true,
            error:e,
            message:"Error fetching feedbacks"
        })
    }
}
const getOnlyValidFeedbacks=async(req,res)=>{
    logger.info("Get All Feedback endpoint Hit");
    try{
        const allValidFeedbacks=await Feedback.find({isValid:true});
        if(!allValidFeedbacks){
            return res.status(400).json({
                message:"no valid feedback found"
            })
        }
        return res.status(200).json({
            success:true,
            data:allValidFeedbacks
        })
    }
    catch(e){
        return res.status(500).json({
            success:true,
            error:e,
            message:"Error fetching valid feedbacks"
        })
    }
}

const updateFeedbackValidation=async(req,res)=>{
    logger.info("update feedback validation endpoint hit");
    try{
        const id=req.params.id;
        const updatedFeedback=await Feedback.findByIdAndUpdate(id,req.body);
        if(!updatedFeedback){
            return res.status(400).json({
                message:"no feedback found to mark valid"
            })
        }
        return res.status(200).json({
            success:true,
            data:updatedFeedback
        })
    }
    catch(e){
        return res.status(500).json({
            success:true,
            error:e,
            message:"Error marking feedbacks valid"
        })
    }
}



module.exports={postFeedback,getAllFeedback,getOnlyValidFeedbacks,updateFeedbackValidation};