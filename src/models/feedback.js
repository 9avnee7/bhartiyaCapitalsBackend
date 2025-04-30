const { bool, boolean } = require('joi');
const mongoose=require('mongoose');


const feedBackSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
        
    },
    content:{
        type:String,
        required:true
    },
    profilePic:{
        type:String,
    },
    isValid:{
        type:Boolean,
        default:false
    }
})


module.exports=mongoose.model('BhartiyaFeedback',feedBackSchema);
