import express from 'express'
import systemConfig from '../config/systemConfig.js';

const router = express.Router()

export const updateSystemConfig = (req, res) =>{
    const  toggles = req.body;
    Object.assign(systemConfig, toggles);
    console.log(toggles);
    console.log("Updated system config:", systemConfig);
    res.json({
        success: true,
        message: "System config updated",
        data: systemConfig
    });
};