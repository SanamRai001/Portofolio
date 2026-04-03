import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import NodeCache from "node-cache";
import System from "../models/systemModel.js";

// take systemconfig from database
// check database toggle is true or false
// if  true
// then check cache if true
// check  cache if  yes return cachce
// else fetch from db 
// if cache then store in cache
// return response

const systemConfig = await System.findOne({});
if(systemConfig?.db){
    if(systemConfig?.cache){
        const projectCache = new NodeCache({stdTTL:100, checkperiod:120});
        if(projectCache.has(key)){
            return json({
                success: true,
                message: "Projects fetched successfully from Cache",
                data: value
            });
        }
        else{
            const projects =  await Project.find();
            const value  =  projectCache.get("projects");
        }
    }
}


export const getProjects = async (req, res)=>{
    try{
       
        if(req.systemConfig?.db === true){
            const projects =  await Project.find();
            res.json({
                success: true,
                message: "Projects  fetched successfully From DB",
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
