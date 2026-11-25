import rateLimit from "express-rate-limit"

const limiter = rateLimit({
        windowMs: 30 * 1000,
        standardHeaders: 'draft-7',
        limit: 20,
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too  many requests. Please wait  30 seconds",
            data: null
        }
    });

const rateLimitMiddleware = (req, res, next)=>{
    if(req.systemConfig?.rateLimit !== true){
        return next();
    }
    else{
    console.log("Too  many requests. Please wait  30 seconds");
    limiter(req, res, next);
    }
}

export  default rateLimitMiddleware;