import express from 'express'
import systemConfig from '../config/systemConfig.js';
import System from '../models/systemModel.js';
import mongoose from 'mongoose';

export const updateSystemConfig = async (req, res) =>{
    const  toggles = req.body;
    Object.assign(systemConfig, toggles);
    console.log(toggles);
    console.log("Updated system config:", systemConfig);
    try{
        const insertResult = System.updateOne({}, systemConfig, {upsert: true});
        console.log("System toggle is inserted.");
    }
    catch(error){
        console.error("Error", error);
    }

    res.json({
        success: true,
        message: "System config updated",
        data: systemConfig
    });
};
export const readSystemConfig = async (req, res) =>{
    try{
        const read = await System.findOne();
        res.json({
            success: true,
            message: "System config fetched",
            data: read
        });
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "System config failed",
        })
    }
};

