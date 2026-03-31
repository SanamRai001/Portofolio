import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config()
const mongoURI = process.env.DB_URI;

const connectDB = async () =>{
    try{
        await mongoose.connect(mongoURI);
        console.log("Mongo Connected successfully!");
    }
    catch (error){
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default  connectDB;