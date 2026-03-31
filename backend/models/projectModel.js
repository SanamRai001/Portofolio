import mongoose from 'mongoose'
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    name:{
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
    },
    techStacks:{
        type: [String]
    }
},{ timestamps:true});

const Project = mongoose.model("Project", projectSchema);

export default Project;