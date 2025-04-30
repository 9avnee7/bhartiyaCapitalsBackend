const logger=require('../utils/logger')
const jwt=require('jsonwebtoken')
const authenticateRequest=async(req,res,next)=>{
    logger.info("authentication middleware endpoint hit");
    try{
        const userId=req.headers["x-user-id"];
        logger.info("auth Error", userId);
        console.log('userId',userId)
        if(!userId){
            console.warn("Access attempt Failed");
            return res.status(401).json({
                sucess:false,
                message:"Unauthorized user"
            })
        }

        req.user={userId};
        next();
    }
    catch(e){
        logger.warn("Error authenticating",e);
        res.status(401).json({
            success:false,
            message:"Unauthorized user"
        })
    }

}

const verifyToken=(req,res,next)=>{
    logger.info("verify token endpoint hit");
    const token=req.headers.authorization?.split(" ")[1];
    if(!token) return res.status(401).json({message:"Unauthorized verify Token"});

    jwt.verify(token,process.env.JWT_SECURITY_KEY,(err,user)=>{
        if(err) return res.status(403).json({
            message:"invalid Token"
        })
    req.user=user
    })

    next();
    
}

module.exports={authenticateRequest,verifyToken};