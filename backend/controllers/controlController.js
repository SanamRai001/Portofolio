import Control from "../models/controlModel.js"

export const  controlController = async (req, res) =>{
    try{
        const controlDetails = await Control.find({});
        if(controlDetails.length === 0){
            console.log("No  controls  found");
            return res.json({
                success:false,
                message: "No data found!",
                data: []
            });
        }
        else{
            console.log("controls found!");
            return res.json({
                success: true,
                message: "Successfully data fetched!",
                data: controlDetails
            });
        }
    }
    catch(error){
        console.log("Error",error);
        return res.json({
            success:false,
            message: "Error while fetching data "
        });
    }
}

