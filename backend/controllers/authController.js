import mongoose from 'mongoose'
import User from '../models/userModel.js'
import  jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { token } from 'morgan';

dotenv.config();

export const verifyUser = async (req, res)=>{
    console.log("auth", req.systemConfig.auth);
    if(req.systemConfig?.auth === true){
        console.log("verifying User!");
        const {email, password} = req.body;
        const users = await User.findOne({email: email});
        if(!users){
            console.log("No user found");
            return res.status(404).json({
                success: false,
                message: "No such user found"
            })
        }
        if (users.password !== password){
            console.log("Wrong credentails");
            return res.status(401).json({
                success: false,
                message: "Wrong credentials"
            })
        }
        const token = jwt.sign({email: email}, process.env.JWT_SECRETKEY, {expiresIn: '1h'});
        console.log("Sending tokens");
            res.json({
            success:  true,
            message: "User Loged in  successfully",
            token: token
            });
    }
    else{
        res.json({
            success:  true,
            message: "Auth disabled",
            });
    }
    
    
}

