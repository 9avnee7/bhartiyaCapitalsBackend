const { required } = require('joi');
const argon2=require('argon2');
const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        // unique:true,
        required:true,
        trim:true
    },
    username:{
        type:String,
        unique:true,
        required:true,
        trim:true
    },
    user:{
        type:String,
        default:'user'
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:function(){
            return this.authProvider=='local'
        }   
    },
    userBio:{
        type:String
    },
    googleId:{
        type:String,


    },
    userEducation:{
        type:String
    },
    authProvider:{
        type:String,
        required:true,
        enum:['local','google']
    },
    profilePic:[
        {
            profileURL:String,
            publicId:String
        }
    ],
    isPremiumUser:{
        type:Boolean,
        default:false
    },
    platformDetails:[{
        platformName:String,
        platformUsername:String
    }],
    userLocation:{
        type:String
    },
    linkedlnURL:{
        type:String
    },
    githubURL:{
        type:String
    },
    xURL:{
        type:String
    },
    otherURL:{
        type:String
    }


},{timestamps:true});


userSchema.pre('save',async function(next){
    if(this.authProvider=='local' && this.isModified('password')){
        try{
            this.password=await argon2.hash(this.password);
        }
        catch(e){
            console.log(e);
            return next(e);
        }
        next();
    }
})

userSchema.methods.comparePassword=async function(candidatePassword){
    try{
        return await argon2.verify(this.password,candidatePassword);
    }
    catch(e){
        throw e;
    }
};

module.exports=mongoose.model('BhartiyaUser',userSchema);