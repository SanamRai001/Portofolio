import mongoose from "mongoose";
import Project from "../models/projectModel.js";

export const getProjects = async (req, res)=>{
    try{
        const projects =  await Project.find();
        res.json({
            success: true,
            message: "Projects  fetched successfully",
            data: projects
        });
    }
    catch(error){
        res.json({
            success: false,
            message: "Projects fetching failed"
        })
    }
};
