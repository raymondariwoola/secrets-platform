// all .js and .mjs files are interpreted as ES modules
import { } from 'dotenv/config';
import express from 'express'
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
// import bcrypt from "bcrypt"
// import encrypt from "mongoose-encryption" // Cipher encryption
// import md5 from "md5" // MD5 Hash Algorithm
import session from 'express-session'
import passport from 'passport'
import passportLocalMongoose from "passport-local-mongoose"


const app = express();
// const secret = process.env.SECRET; // dotenv - store cipher key
// const saltRounds = 10;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded({ extended: false }));



// Important to be placed here. After above and before below functions
app.use(session({
    secret: "Our little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) { // handles GET request for home route
    res.render('home');
});

app.get("/login", function (req, res) { // handles GET request for login route
    res.render('login');
});

app.get("/register", function (req, res) { // handles GET request for register route
    res.render('register');
});

app.get("/secrets", function (req, res) { // handles GET request for secrets route
    if (req.isAuthenticated()) { //! if user is already authenticated then they should have access to the page
        res.render("secrets");
    } else { //! if user is not already authenticated, then they should be routed to the login page
        res.redirect("/login");
    }
});

app.get("/logout", function (req, res) { // handles GET request for Log out route
    req.logout();
    res.redirect("/");
});


app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.send(err);
            // res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});




app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});




app.listen(3000, function () {
    console.log('Server started on port 3000.');
});