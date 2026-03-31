import mongoose  from 'mongoose'
const Schema  = mongoose.Schema;

const userSchema  = new Schema({
    id:{
        type: Number,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        required: true,
    },
    is_active:{
        type: Boolean
    },
}, {timestamps:true});

const User = mongoose.model("User", userSchema);

export default  User;