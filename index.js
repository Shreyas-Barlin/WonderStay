const express = require('express');
const app = express();
const port = 5001;
const mongoose = require('mongoose');
const MONGOOSE_URL = 'mongodb://127.0.0.1:27017/wanderlust'
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const listingRouter = require("./routes/listing.js");
const userRouter = require("./routes/user.js");
const reviewRouter = require("./routes/review.js");
const categoryRouter = require("./routes/category.js");
const session = require('express-session');
const flash = require('connect-flash');
const User = require('./models/user.js')
const passport = require('passport');
const LocalStrategy = require('passport-local');


const sessionOptions = {
    secret:'SecretCode',
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+ 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
    }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.engine('ejs', ejsMate); //boilerplate k lia

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next) => {
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');
    res.locals.CurrentUser = req.user;
    next();
})




main()
    .then(() => {
        console.log("Connection successful");
    })
    .catch(err => console.log(err))

async function main() {
    await mongoose.connect(MONGOOSE_URL);
}

app.get('/', (req, res) => {
    res.send("working");
})




app.use("/listings",listingRouter);
app.use("/listings/:id/review",reviewRouter);
app.use("/",userRouter);
app.use("/category/:cateoption",categoryRouter);



app.all("*", (req, res, next) => {
    throw new ExpressError(404, "Page not Found");
})

//Error Handler
app.use((err, req, res, next) => {
    const { status = 500, message = "Error Occured.TryAgain!" } = err;
    res.status(status).render("listings/error.ejs", { message });
})

app.listen(port, () => {
    console.log("Listening");
})



