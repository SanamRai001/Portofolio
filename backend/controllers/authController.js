import mongoose from 'mongoose'
import User from '../models/userModel.js'

export const verifyUser = async (req, res)=>{
    console.log("verifying User!");
    const {email, password} = req.body;
    const users = await User.find({email: email});
    if(users){

    }
    else{
        res.status(404).json({message:"User not  found!"});
    }
    console.log(users);
    console.log(email, password);
    res.json({message:"done"});
}