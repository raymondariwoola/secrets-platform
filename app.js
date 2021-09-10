// all .js and .mjs files are interpreted as ES modules
import { } from 'dotenv/config';
import express from 'express'
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
// import encrypt from "mongoose-encryption" // Cipher encryption
// import md5 from "md5" // MD5 Hash Algorithm

const app = express();
// const secret = process.env.SECRET; // dotenv - store cipher key
const saltRounds = 10;

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    displayName: String,
    userName: String,
    password: String
});

// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] }); // encrypt database using mongoose-encryption plugin
const User = mongoose.model("User", userSchema);

function addNewUser(res, credential, _hash) {
    const newUser = new User({
        displayName: credential.displayName,
        userName: credential.userName,
        password: _hash
    });
    newUser.save(function (err) {
        if (!err) {
            res.redirect("/login");
        }
        else {
            console.log(err);
        }
    });
}


app.get("/", function (req, res) { // handles GET request for home route
    res.render('home');
});

app.get("/login", function (req, res) { // handles GET request for login route
    res.render('login');
});

app.get("/register", function (req, res) { // handles GET request for register route
    res.render('register');
});


app.post("/register", function (req, res) { // handles POST request for register route
    const userDetails = req.body;
    bcrypt.hash(userDetails.password, saltRounds, function (err, hash) { // Hash password using bcrypt algorithm
        User.findOne({ userName: userDetails.userName }, function (err, results) { // Check if user already exists in DB
            if (!err) {
                if (results) { // If user record exists then don't allow registration. Existing user
                    res.send("User already exists");
                }
                else {
                    addNewUser(res, userDetails, hash); // No record found hence add new user to database
                    console.log(hash);
                }
            }
            else {
                console.log(err);
            }
        });
    });
});


app.post("/login", function (req, res) { // handles POST request for login route
    const loginDetails = req.body;
    const userName = loginDetails.userName;
    const password = loginDetails.password;

    User.findOne({ userName: userName }, function (err, foundUser) { // Check if user exists in DB
        if (!err) {
            if (foundUser) { // If userName exists then check for
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) { // If password matches then load secrets page
                        res.render('secrets');
                    }
                    else { // password mismatch
                        res.send("Invalid password");
                    }
                });
            }
            else { // User does not exist in DB
                res.send("User not found");
            }
        }
        else {
            console.log(err);
        }
    });

});




app.listen(3000, function () {
    console.log('Server started on port 3000.');
});