require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const app = express();

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: false
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// Profile route (protected)
app.get('/profile', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.redirect('/auth/google');
    }
    res.send(`<h1>Profile</h1><pre>${JSON.stringify(req.user, null, 2)}</pre><a href="/logout">Logout</a>`);
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/healthz', (req, res) => res.send('OK'));

app.listen(PORT, () => {
    console.log(`🚀 Founders Cloud running at http://localhost:${PORT}`);
});
