import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import NodeCache from "node-cache";
import System from "../models/systemModel.js";

const projectCache = new NodeCache({stdTTL:100, checkperiod:120});


export const getProjects = async (req, res)=>{
    if(req.systemConfig?.db === false){
        return  res.json({
                success: false,
                message: "Database is Disabled.",
                data: null
            });
    }
    if(req.systemConfig?.cache ===true){
        if(projectCache.has("projects")){
            console.log("Fetching  data  from cache");
            return res.json({
                success: true,
                message: "Projects fetched successfully from Cache",
                data: projectCache.get("projects")
            });
        }
    }
    try{
        const projects =  await Project.find();
        if(req.systemConfig?.cache === true){
            projectCache.set("projects", projects);
            console.log("DB HIT");
        }
         res.json({
            success: true,
            message: "Projects  fetched successfully From DB",
            data: projects
        });
    }
    catch(error){
        res.json({
            success: false,
            message: "Projects fetching failed",
            data: null
        })
    }
};
