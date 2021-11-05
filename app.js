// all .js and .mjs files are interpreted as ES modules
import { } from "dotenv/config";
import express from "express"
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
import session from "express-session"
import passport from "passport"
import passportLocalMongoose from "passport-local-mongoose"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import findOrCreate from "mongoose-findorcreate"


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

const userPosts = new mongoose.Schema({
    userID: String,
    postContent: String
});

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    googleId: String,
    displayName: String,
    familyName: String,
    givenName: String,
    profilePhoto: String,
    posts: [userPosts],
    followers: [],
    following: []
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});


passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {

        const userProfileInfo = {
            displayName: profile.displayName,
            profilePhoto: profile.photos[0].value,
            familyName: profile.name.familyName,
            givenName: profile.name.givenName
        }

        User.findOrCreate({ googleId: profile.id }, userProfileInfo, function (err, user) {
            console.log(user);
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) { // handles GET request for home route
    res.render('home');
});


app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);


app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect to secrets page.
        res.redirect('/secrets');
    });


app.get("/login", function (req, res) { // handles GET request for login route
    res.render('login');
});


app.get("/register", function (req, res) { // handles GET request for register route
    res.render('register');
});


app.get("/secrets", function (req, res) { // handles GET request for secrets route
    if (req.isAuthenticated()) { //! if user is already authenticated then they should have access to the page
        User.findById(req.user._id, function (err, foundUser) {
            if (!err) {
                res.render("secrets", { profilePhoto: req.user.profilePhoto, displayName: req.user.displayName, posts: foundUser.posts });
            }
            else {
                console.log(err);
            }
        });
    } else { //! if user is not already authenticated, then they should be routed to the login page
        res.redirect("/login");
    }
});


app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
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
            console.log(user);
            // res.send(err);
            res.redirect("/register");
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



app.post("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        const submitSecretContent = req.body.secret;
        const currentUserID = req.user.id;
        const newPost = {
            userID: currentUserID,
            postContent: submitSecretContent
        }
        const newFollowers = "mrRay";
        const newFollowing = "MzRayOfficial";

        User.findById(currentUserID, function (err, foundUser) {
            if (!err) {
                foundUser.posts.push(newPost);
                foundUser.save(function () {
                    res.redirect('/secrets');
                });
            }
            else {
                console.log(err);
            }
        });
    } else {
        res.redirect("/login");
    }
});


app.listen(3000, function () {
    console.log('Server started on port 3000.');
});


/* //TODO
* Follow people
* Check followers list
* Check following list
* Edit/Update/delete posts
* login with with facebook account
* login with twitter account
* Set desired Display name @someone
* Add validation to forms and Posts (Client-Side and Server-Side validation)
* Redesign the User interface
* Option to change profile picture
*/