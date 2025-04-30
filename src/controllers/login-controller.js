
const logger=require('../utils/logger');
const User=require('../models/user');
const { validateUser ,validateLogin} = require('../utils/validation');
const {generateToken}=require('../utils/generateToken')
const jwt=require('jsonwebtoken');
const { profile } = require('winston');
const { uploadToCloudinary, deleteMediaFromCloudinary } = require('../utils/cloudinary');

// const { platformDetails } = require('../../../../frontend/src/components/platformApi/api');

const registerUser=async(req,res)=>{
    logger.info('register user endpoint hit');
    try{
        const {username,email,password,name}=req.body;
        const isValid=validateUser({username,email,password});

        if(isValid.error){
            return res.status(400).json({
                success:false,
                message:isValid.error.details[0].message
            });
        }
        const userExist=await User.findOne({$or:[{email},{username}]});

        if(userExist){
            return res.status(409).json({
                success:false,
                message:'User already Exist'
            });
        }
        const newUser=new User({
            name,
            username,
            email,
            password,
            authProvider:'local'
        })

        await newUser.save();
        res.setHeader('x-user-id',`${newUser._id}`);

        const {accessToken,refreshToken}=await generateToken(newUser);

        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite:'None',
            maxAge:7*24*60*60*1000

        })

        res.cookie('xUserId',newUser._id,{
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production", 
            sameSite: "None", 
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.status(200).json({
            sucess:true,
            message:"user registered Successfully",
            data:{refreshToken,
            accessToken},
            userInfo:newUser
        })
    
    }
    catch(e){
        logger.error("Internal server error on registering the user",e);
        return res.status(500).json({
            success:false,
            message:"Internal server error on registering"
        })
    }
}

const handleEditProfile = async (req, res) => {
    try {
        const xUserId = req.cookies?.xUserId;
        if (!xUserId) {
            return res.status(401).json({ message: "Unauthorized: User not logged in" });
        }

        let userDetails;
        try {
            userDetails = JSON.parse(req.body.userDetails);
        } catch (error) {
            return res.status(400).json({ message: "Invalid JSON format in userDetails" });
        }

        const { name, userBio, userEducation, userLocation, linkedlnURL, githubURL, xURL, otherURL } = userDetails;
        
        console.log("User ID:", xUserId);
        console.log("Received Data:", userDetails);

        let profilePic = null;
        let publicId=null;
        console.log("reached lv 1")
        if (req.file) {
            try {
                console.log("reached lv 2.1")
                const cloudinaryResult = await uploadToCloudinary(req.file);
                logger.info(`Cloudinary upload successful - ${cloudinaryResult.public_id} and ${cloudinaryResult.secure_url}`);
                profilePic = cloudinaryResult.secure_url;
                publicId=cloudinaryResult.public_id;
                console.log("reached lv 2.2")

                //deleting old profile?
                const beforeUpdating=await User.findById(xUserId);
                console.log('old user',beforeUpdating)
                if(beforeUpdating?.profilePic.length>0){
                        const destroyResult=await deleteMediaFromCloudinary(beforeUpdating?.profilePic[0].publicId);
                        console.log(`${beforeUpdating?.profilePic?.publicId} it is`)
        }
            } catch (uploadError) {
                console.log("reached lv 3")
                console.error("Cloudinary upload failed:", uploadError);
                return res.status(500).json({ message: "Error uploading profile picture" });
            }
        }
        console.log("reached lv 4")

        const updateData = { name, userBio, userEducation, userLocation, linkedlnURL, githubURL, xURL, otherURL };
        if (profilePic) updateData.profilePic = {profileURL:profilePic,publicId};

        
        const updatedUser = await User.findByIdAndUpdate(xUserId, { $set: updateData }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "User data updated successfully",
            updatedData: updatedUser,
        });

    } catch (e) {
        console.error("Error in handleEditProfile:", e);
        return res.status(500).json({ message: "Internal server error while editing the profile" });
    }
};
const updateUserInfo = async (req, res) => {
    console.log('Update user endpoint hit');

    const { username, dataToUpdate } = req.body;
    console.log('User ID from cookies:', req.cookies.xUserId);

    try {
        const id = req.cookies.xUserId;
        console.log(dataToUpdate)
        const user = await User.findOne({ username }).lean();
        console.log("adter find one",user)

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("user is here",user)
        const platformExists = user.platformDetails.some(
            (data) => data.platformName === dataToUpdate.platformname
        );

        let updatedPlatformDetails;

        if (platformExists) {
            console.log("Platform exists, updating existing entry...");
        
            updatedPlatformDetails = user.platformDetails.map((data) => {
                if (data.platformName.toLowerCase() === dataToUpdate.platformname.toLowerCase()) {
                    console.log("data",data);
                    return { ...data, platformUsername: dataToUpdate.username }; // ✅ Update platform username
                }
                return data;
            });
        
        }else {
            updatedPlatformDetails = [
                ...user.platformDetails,
                {
                    platformName: dataToUpdate.platformname,
                    platformUsername: dataToUpdate.username
                }
            ];
        }

        console.log('Updated platform details:', updatedPlatformDetails);

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: { platformDetails: updatedPlatformDetails } },
            { new: true }
        );

        // console.log('Updated user:', updatedUser);

        res.status(200).json({
            // message: "User platform details updated successfully",
            userData: updatedUser
        });

    } catch (e) {
        console.error("Error occurred while updating the user:", e);
        res.status(500).json({
            message: "Unknown error occurred",
            error: e.message
        });
    }
};

const handleGoogleLogin=async(req,res)=>{
    logger.info('google login endpoint hit');
    try{
        const {name,username,email,googleId,profilePic,authProvider}=req.body;
        console.log("req.body",req.body);

        //check for the existence of user
        console.log(req.body);
        const userExist=await User.findOne({$or:[{username},{email}]});

        if(userExist){
            console.log("User exist already loggin in......")
            
            const {accessToken,refreshToken}=await generateToken(userExist);
            // console.log("accessToken",accessToken," ",refreshToken)
            res.cookie('refreshToken',refreshToken,{
                httpOnly:true,
                secure:process.env.NODE_ENV === "production",
                sameSite:'None',
                maxAge:7*24*60*60*1000
            })
            res.cookie('xUserId',userExist._id,{
                httpOnly:true,
                secure:process.env.NODE_ENV === "production",
                sameSite:'None',
                maxAge:7*24*60*60*1000
            })
            return res.status(200).json({
                message:"user info",
                data:userExist,
                token:{refreshToken,accessToken}
                
            })}

        console.log('new user registering in and logging in')

        const userInfo={
            name,
            username,
            email,
            googleId,
            profilePic,
            authProvider,
        }

        const newUser=new User(userInfo);
        await newUser.save();
        const {accessToken,refreshToken}=await generateToken(newUser);
        res.setHeader('x-user-id',`${newUser._id}`);
        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite:'None',
            maxAge:7*24*60*60*1000
        })
        res.cookie('xUserId',newUser._id,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite:'None',
            maxAge:7*24*60*60*1000
        })

        return res.status(200).json({
            message:"user registered and logging him/her in",
            data:newUser,
            token:{accessToken,refreshToken} 
        })

    }
    catch(e){
        console.log(`error occured ${e}`);
    }
}

const logInUser = async (req, res) => {
    logger.info("login user endpoint hit");
    try {
        const { email, password } = req.body;
        const { error, value } = validateLogin({ email, password });

        if (error) {
            logger.warn("User data not Valid");
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const findUser = await User.findOne({ email });

        if (!findUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isValidPassword = await findUser.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                message: "Unauthorized request password is not valid"
            });
        }

        // Generate tokens using the authenticated user (findUser)
        const { accessToken, refreshToken } = await generateToken(findUser);
        
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Prevents XSS attacks
            secure: process.env.NODE_ENV === "production", // Set true for production
            sameSite: "None", // Allows sending cookies across domains
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.cookie('xUserId',findUser._id,{
            httpOnly: true, // Prevents XSS attacks
            secure: process.env.NODE_ENV === "production", // Set true for production
            sameSite: "None", // Allows sending cookies across domains
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

   
        
        console.log("Set-Cookie Header:", res.getHeaders()["set-cookie"]);
        // console.log(res.cookie);

        res.setHeader('x-user-id',`${findUser._id}`);//setting header

        console.log('x-user-id', res.getHeaders()["x-user-id"]);


        
        res.json({
            data:{
            accessToken,
            refreshToken,
            userId: findUser._id, } 
        });
    } catch (e) {
        logger.error("Internal Server Error", e);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


const handleLogOut=async(req,res)=>{
    logger.info("logout endpoint hit");
    try{
        
        res.clearCookie("refreshToken");
        res.clearCookie('xUserId');
        return res.status(200).json({ message: "Logged out successfully" });
    }
    catch(e){
        return res.status(500).json({
            message:"Error Occured in logging out",
            error:e
        })
    }
        
}

// const handleRefreshToken=(req,res)=>{
//     console.log(" new ",req.cookies);
//     logger.info("handle refresh token endpoint hit");
//     try{

//     const refreshToken=req.cookies.refreshToken;
//     // console.log(refreshToken)
//     if(!refreshToken) return res.status(403).json({
//         message:"refresh Token Required"
//     })

//     // verify refresh token
//     jwt.verify(refreshToken,process.env.JWT_SECURITY_KEY,(err,user)=>{
//         if(err) return res.status(403).json({
//             message:"invalid refresh token"
//         })
//         const {newAccessToken,newRefreshToken}=generateToken(user);
//         console.log("newAcessToken:",newAccessToken)
//         console.log(newAccessToken)
//         return res.status(200).json({
//             accessToken:newAccessToken,
//             userId:req.cookies.xUserId
//         });
//     })
// }
// catch(e){
//     return res.status(500).json({
//         message:`Error Occured in handling refresh token ${e}`,
//         error:e
//     })
// }}


const handleRefreshToken = async (req, res) => {
    console.log("New Request Cookies:", req.cookies);
    logger.info("Handle refresh token endpoint hit");

    try {
        const refreshToken = req.cookies.refreshToken;
        const userId=req.cookies.xUserId;
        if (!refreshToken) {
            return res.status(403).json({ message: "Refresh Token Required" });
        }

        // Verify refresh token
        jwt.verify(refreshToken, process.env.JWT_SECURITY_KEY, async (err, user) => {
            if (err) {
                console.error("JWT Verification Error:", err);
                return res.status(403).json({ message: "Invalid Refresh Token" });
            }

          
            const { accessToken, refreshToken: newRefreshToken } = await generateToken(user);

            console.log("New Access Token Generated:", accessToken);

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "None",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                accessToken,
                userId:userId
            });
        });
    } catch (error) {
        logger.error(`Error in handling refresh token: ${error.message}`);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const fetchUserData=async(req,res)=>{
    logger.info('fetch user endpoint hit')
    
    try{
       
        const user_id=req.user?.userId;
        console.log("user-id",user_id);
        const userData=await User.findById(user_id);
        // console.log(userData)

        if(!userData){
            return res.status(401).json({
                message: "Unauthorized request userId is not valid"
            });
        }

       return res.status(200).json({
           userData:userData
        })


    }
    catch(e){

        return res.status(500).json({
            message:`Error Occured in handling fetching user  data ${e}`,
            error:e
        })
    }
}

module.exports={logInUser,registerUser,handleLogOut,handleRefreshToken,fetchUserData,handleGoogleLogin,updateUserInfo
    ,handleEditProfile
};
