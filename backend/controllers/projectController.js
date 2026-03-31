import mongoose from "mongoose";
import Project from "../models/projectModel.js";

export const getProjects = async (req, res)=>{
    const projects =  await Project.find();
    res.json(projects);
};
