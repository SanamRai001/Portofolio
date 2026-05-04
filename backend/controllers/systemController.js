import systemConfig from '../config/systemConfig.js';
import System from '../models/systemModel.js';

export const updateSystemConfig = async (req, res) =>{
    const  toggles = req.body;
    try{
        const insertResult = await System.findOneAndUpdate(
        {},
        { $set: toggles },
        { upsert: true, new: true }
        );
        console.log("System toggle is inserted.");
        res.json({
        success: true,
        message: "System config updated",
        data: insertResult
        });
    }
    catch(error){
        console.error("Error", error);
        res.json({
        success: false,
        message: "Update failed",
        });
    }

    
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

