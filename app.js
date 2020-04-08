const _ = require("lodash");
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

// users
const users = [
    {
        id: 1,
        name: "jonathanmh",
        password: "%2yx4",
    },
    {
        id: 2,
        name: "test",
        password: "test",
    },
];

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(passport.initialize());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = "tasmanianDevil";

const strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log("payload received", jwt_payload);
    // usually this would be a database call:
    const user = users[_.findIndex(users, { id: jwt_payload.id })];
    if (user) {
        next(null, user);
    } else {
        next(null, false);
    }
});

passport.use(strategy);

//Static
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res, next) {
    res.render("index");
});

app.post("/login", function (req, res) {
    const { name, password } = req.body;

    if (name && password) {
        // usually this would be a database call:
        const user = users[_.findIndex(users, { name: name })];
        console.log(user);
        if (!user) {
            res.status(401).json({
                message: "no such user found",
            });
        }

        if (user.password === password) {
            // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
            const payload = { id: user.id };
            const token = jwt.sign(payload, jwtOptions.secretOrKey);
            res.json({ message: "ok", token: token });
        } else {
            res.status(401).json({
                message: "passwords did not match",
            });
        }
    }
});

app.get("/secret", passport.authenticate("jwt", { session: false }), function (
    req,
    res
) {
    res.json("Success! You can not see this without a token");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
