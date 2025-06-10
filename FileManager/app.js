const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const upload = require('./config/multerconfig');
const path = require('path');




app.set('view engine' , 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')));







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

            let token = jwt.sign({email:email , userid: user._id} , 'secret')
            res.cookie('token' , token);
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

            let token = jwt.sign({email:email , userid: user._id} , 'secret')
            res.cookie('token' , token);
            res.status(200).redirect('/profile');

        } 
        // RESTful practices – In APIs, different status codes convey different meanings (e.g., 200 = OK, 404 = Not Found, 401 = Unauthorized).
        else res.redirect('/');
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
    const token = req.cookies.token;
    if(!token || token.trim() === "") return res.redirect('/login');
    else{
        let data= jwt.verify(req.cookies.token , 'secret');
        req.user =data;
    }
    next();
}


app.listen(3000);