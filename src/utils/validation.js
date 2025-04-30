const Joi=require('joi');
const logger=require('./logger');
const { profile } = require('winston');

const validateCreateFeedback=(data)=>{

    logger.info("Validating feedback data");
    const schema=Joi.object({
        content:Joi.string().max(200).min(5).required(),
        username:Joi.string().required(),
        profilePic:Joi.string()
    })
    return schema.validate(data);
}


const validateUser=(data)=>{

    logger.info("Validating registeration data");
    const schema=Joi.object({
        username:Joi.string().required(),
        email:Joi.string().email().required(),
        password:Joi.string().min(8).required()
        
    })
    return schema.validate(data);
}


const validateLogin=(data)=>{
    logger.info("Validating login data");
    const schema=Joi.object({
        email:Joi.string().email().required(),
        password:Joi.string().min(6).required()

    })
    return schema.validate(data);
}

module.exports={validateCreateFeedback,validateUser,validateLogin}