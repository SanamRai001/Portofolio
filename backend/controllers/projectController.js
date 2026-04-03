import mongoose from "mongoose";
import Project from "../models/projectModel.js";

export const getProjects = async (req, res)=>{
    try{
        if(req.systemConfig?.db === true){
            const projects =  await Project.find();
            console.log("SYSTEM CONFIG:", req.systemConfig);
            res.json({
                success: true,
                message: "Projects  fetched successfully",
                data: projects
            });
        }
        else{
            res.json({
                success: false,
                message: "Database is Disabled.",
                data: null
            });
        }
    }
    catch(error){
        res.json({
            success: false,
            message: "Projects fetching failed",
            data: null
        })
    }
};
