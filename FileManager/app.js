const express = require('express');
const app = express();
const mongoose = require('mongoose');
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const upload = require('./config/multerconfig');
const path = require('path');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
})
.then(() => {
    console.log('Connected to MongoDB Atlas');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

app.set('view engine' , 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));

// Add secure cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
};







app.get('/' , (req,res)=>{
    res.render('index')
});

app.get('/test' , (req,res)=>{
    res.render('test');
})


app.get('/login', (req,res)=>{
    res.render('login');
})

app.get('/profile' , isLoggedIn , async(req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate('posts');
    res.render('profile' , {user})
})


app.get('/like/:id' , isLoggedIn , async(req,res)=>{
    let post = await postModel.findOne({_id: req.params.id}).populate('user');
    post.likes.push(req.user.userid);
    await post.save()
    res.redirect('/profile')
})

app.post('/test' , upload.single('image') , (req,res)=>{
console.log(req.file);
res.send("File uploaded successfully");

});

app.post('/register' , async (req,res)=>{
    let{email, password , username , age , name} = req.body;
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered!!");


    bcrypt.genSalt(10 , (err,salt)=>{
        bcrypt.hash(password , salt , async(err,hash)=>{
            let user = await userModel.create({
                username,
                name,
                password:hash,
                email:email,
                age
            });

            let token = jwt.sign({email:email , userid: user._id} , process.env.JWT_SECRET || 'secret')
            res.cookie('token' , token, cookieOptions);
            res.redirect('/profile');
        })
    })

})

app.post('/login' , async (req,res)=>{
    let {email , password} = req.body;
    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("What Ra!!")

    bcrypt.compare(password , user.password , function(err,result){
        if(result){
            let token = jwt.sign({email:email , userid: user._id} , process.env.JWT_SECRET || 'secret')
            res.cookie('token' , token, cookieOptions);
            res.redirect('/profile');
        } else {
            res.redirect('/login');
        }
    })


})

app.post('/post' ,isLoggedIn, async(req,res)=>{
      let user = await userModel.findOne({email: req.user.email});
      let {content} = req.body;
       let post = await postModel.create({
            user: user._id,
            content,

        })
    
        user.posts.push(post._id);
       await user.save();
       res.redirect('/profile')
    

})

app.get('/logout' , (req,res)=>{
    res.cookie('token', " ")
    res.redirect('/login');
})

function isLoggedIn (req,res,next){
    try {
        const token = req.cookies.token;
        if(!token || token.trim() === "") {
            return res.redirect('/login');
        }
        
        const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (!data || !data.email) {
            res.clearCookie('token');
            return res.redirect('/login');
        }
        
        req.user = data;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
