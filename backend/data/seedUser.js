import mongoose from 'mongoose'
import userModel from '../models/userModel.js'
import connectDB from '../config/db.js';

connectDB();
const data = [
  {
    id: 1,
    email: "superadmin@portfolio.dev",
    password: "superadmin123",
    role: "super_admin",
    is_active: true
  },
  {
    id: 2,
    email: "admin@portfolio.dev",
    password: "admin123",
    role: "admin",
    is_active: true
  },
  {
    id: 3,
    email: "viewer@portfolio.dev",
    password: "viewer123",
    role: "viewer",
    is_active: true
  }
];

const seed = async()=>{
    try{
        await userModel.insertMany(data);
        console.log("User seeded successfully");
        mongoose.connection.close();
    }
    catch(e){
        console.error(e.message);
        process.exit(1);
    }
}

seed();