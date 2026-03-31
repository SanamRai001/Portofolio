import mongoose from 'mongoose'
import { type } from 'os';
const Schema = mongoose.Schema;

const controlSchema = new Schema({
    key:{
        type:String,
        required:true
    },
    title:{
        type:String
    },
    description:{
        type: String,
        required: true
    },
    details:{
        type: String
    }
});

const Control = mongoose.model("Control", controlSchema);

export default Control;