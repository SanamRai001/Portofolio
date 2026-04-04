import rateLimit from "express-rate-limit"
import System from "../models/systemModel.js";

const limiter = rateLimit({
        windowMs: 30 * 1000,
        standardHeaders: 'draft-7',
        limit: 5,
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too  many requests. Please wait  30 seconds",
            data: null
        }
    });

const rateLimitMiddleware = async(req, res, next)=>{
    const systemConfig = await System.findOne({});
    if(systemConfig?.rateLimit === false){
        return next();
    }
    else{
    console.log("Too  many requests. Please wait  30 seconds");
    limiter(req, res, next);
    }
}

export  default rateLimitMiddleware;