const User = require('../models/user.js');


module.exports.renderSignupForm = (req,res) => {
    res.render("listings/signup.ejs")
}

module.exports.signup = async(req,res) => {
    try{
        const {username,email,password} = req.body;
        const newUser = {
            username,
            email
        }
        const result = await User.register(newUser,password); //data is save in db 
        req.login(result,(err) => {                          //direct login no need to login again 
            if(err){
                next(err);
            }
            req.flash('success','Welcome to Wonder Stay !')
            res.redirect('/listings');
        })
    }
    catch(err){
        req.flash('error',err.message)
        res.redirect('/signup')
    }
}

module.exports.renderLoginForm = (req,res) => {
    res.render('listings/login.ejs')
}

module.exports.login = async(req,res) =>{
    req.flash('success','Welcome back to Wonder Stay !')
    const redirectUrl = res.locals.redirectUrl ?? '/listings';
    res.redirect(redirectUrl);
}

module.exports.logout = (req,res,next) => {
    req.logOut((err) => {
        if(err){
            return next(err);
        }
        req.flash('success','Logout successfully')
        res.redirect('/listings');
    })
}