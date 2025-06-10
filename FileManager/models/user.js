const mongoose = require('mongoose');

// Use the environment variable for MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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
