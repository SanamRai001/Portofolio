import systemConfig from '../config/systemConfig.js'

function dbMiddleware(req, res, next){
    if(systemConfig.db){
        next();
    }
    else{
        return res.json({message:"Database toggle is off."});
    }
}

export default dbMiddleware;