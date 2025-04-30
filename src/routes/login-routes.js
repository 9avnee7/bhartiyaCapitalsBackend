const { registerUser, logInUser,handleLogOut,handleRefreshToken, fetchUserData,handleEditProfile, handleGoogleLogin, updateUserInfo} = require('../controllers/login-controller');
const logger=require('../utils/logger');
const passport=require('passport');
// const {verifyToken}=require('../middleware/authMiddleware')
const jwt=require('jsonwebtoken');

const express=require('express');
const { generateToken } = require('../utils/generateToken');
const { verifyToken, authenticateRequest } = require('../middleware/authMiddleware');
const router=express.Router();
const multer=require('multer');
const storage=multer.memoryStorage();
const upload=multer({storage})



router.post('/registerUser',registerUser);
router.post('/loginuser',logInUser);
router.post('/updateUserPlatformDetails',updateUserInfo);
router.post('/editprofile',upload.single('image'),handleEditProfile);

router.post('/googlelogin',handleGoogleLogin)

router.post('/refresh',handleRefreshToken)


router.post("/logout", handleLogOut);

router.get('/fetchuserdata',authenticateRequest,fetchUserData)





module.exports=router