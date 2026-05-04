import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import NodeCache from "node-cache";

const projectCache = new NodeCache({stdTTL:100, checkperiod:120});

const pagination = (projects, pageNumber, limit) =>{
    const start = (pageNumber-1)*limit;
    const end = start + limit;
    return projects.slice(start, end); 
}

export const getProjects = async (req, res)=>{
    const pageNumber = req.systemConfig?.pagination
  ? parseInt(req.query.pageNumber) || 1
  : 1;

const limit = req.systemConfig?.pagination
  ? parseInt(req.query.limit) || 3
  : 3;
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
            let cacheProject = projectCache.get("projects");
            if(req.systemConfig?.pagination === true){
                cacheProject = pagination(cacheProject, pageNumber, limit);
            }
            return res.json({
                success: true,
                message: "Projects fetched successfully from Cache",
                data: cacheProject
            });
        }
    }
    try{
        let projects =  await Project.find();
        if(req.systemConfig?.cache === true){
            projectCache.set("projects", projects);
            console.log("DB HIT");
        }
        if(req.systemConfig?.pagination === true){
            projects = pagination(projects, pageNumber,limit);
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
