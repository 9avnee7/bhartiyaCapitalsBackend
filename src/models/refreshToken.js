const mongoose=require('mongoose');
const User=require('./user');
const { required } = require('joi');
const refreshTokenSchema=new mongoose.Schema({
    token:{
        type:String,
        required:true,
        unique:true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    expiresAt:{
        type:Date,
        required:true
    }

},{timestamps:true})

//to delete the field after 0 seconds of expiresAt
refreshTokenSchema.index({expiresAt:1},{expiresAfterSeconds:0});



module.exports=mongoose.model('BhartiyaRefreshToken',refreshTokenSchema)
