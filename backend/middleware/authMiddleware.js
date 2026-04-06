import dotenv from 'dotenv';
import jwt from  'jsonwebtoken'
dotenv.config();

const authenticate = (req, res, next) =>{
            console.log("auth middleware");

    if(req.systemConfig?.auth === true){
                    console.log(" true auth middleware");

        const  token   = req.headers['authorization']?.split(' ')[1];
        console.log("token: ",token)
        if(!token){
            return  res.status(401).json({
                success: false,
                message: "No token  found"
            });
        }
        jwt.verify(token, process.env.JWT_SECRETKEY, (err, user)=>{
            if(err){
                return  res.status(401).json({
                success: false,
                message: "Error while verifying"
                });
            }
            req.user = user;
            return next();
        });
    }else{
        next();
    }
};
export default  authenticate;