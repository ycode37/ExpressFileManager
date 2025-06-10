const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: String,
    name:String,
    age:Number,
    email:String,
    password:String,
    posts: [{type: mongoose.Schema.Types.ObjectId , ref:"post"}],
    profilepic: {
        type: String,
        default: "default.png"
    }
})

module.exports = mongoose.model('user' , userSchema);
