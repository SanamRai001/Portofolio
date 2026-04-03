import System from "../models/systemModel.js";


async function dbMiddleware(req, res, next){
    try{
        const systemConfig = await System.findOne();
        if(!systemConfig){
            return res.status(500).json({
                success:false,
                message: "System config missing"
            });
        }
        req.systemConfig = systemConfig;
        next();
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Error fetching config"
        });
    }
}

export default dbMiddleware;