mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
    console.log('Connection URI:', process.env.MONGODB_URI); 
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

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
