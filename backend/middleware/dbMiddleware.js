import System from "../models/systemModel";


async function dbMiddleware(req, res, next){
    try{
        const systemConfig = await System.findOne();
        if(systemConfig.db && systemConfig){
            next();
        }
        else{
            return res.json({message:"Database toggle is off."});
        }
    }
    catch(error){
        return res.status(500).json({message: "Error fetching config"});
    }
}

export default dbMiddleware;