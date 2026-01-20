// Founders Area route
app.get('/founders', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.redirect('/auth/google');
    }
    const user = req.user;
    const name = user.displayName || user.name?.givenName || 'Founder';
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Founders Area | Founders Cloud</title>
        <link rel="stylesheet" href="/styles.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; }
        .nav { width: 100%; background: #181818; padding: 1.2rem 0; display: flex; justify-content: center; gap: 2.5rem; margin-bottom: 2.5rem; box-shadow: 0 2px 16px #0004; }
        .nav-link { color: #fff; text-decoration: none; font-size: 1.1rem; font-weight: 600; opacity: 0.7; padding-bottom: 2px; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .nav-link.active, .nav-link:hover { opacity: 1; border-bottom: 2px solid #fff; }
        .founders-container { max-width: 600px; margin: 0 auto; background: #111; border-radius: 20px; box-shadow: 0 8px 40px #000a; padding: 2.5rem 2rem; text-align: center; }
        .founders-title { font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; }
        .founders-desc { color: #aaa; font-size: 1.1rem; margin-bottom: 2rem; }
        .back-btn { color: #fff; background: #000; border: 1px solid #fff; border-radius: 8px; padding: 0.7rem 2.2rem; font-size: 1.1rem; font-weight: 600; text-decoration: none; transition: background 0.2s, color 0.2s; }
        .back-btn:hover { background: #fff; color: #000; }
        </style>
    </head>
    <body>
        <nav class="nav">
            <a href="/profile" class="nav-link">Profile</a>
            <a href="/founders" class="nav-link active">Founders Area</a>
            <a href="/logout" class="nav-link">Logout</a>
        </nav>
        <div class="founders-container">
            <div class="founders-title">Welcome to the Founders Area</div>
            <div class="founders-desc">Hello, ${name}!<br>Here you can access exclusive resources, productivity tools, and connect with other founders.</div>
            <a href="/profile" class="back-btn">Back to Profile</a>
        </div>
    </body>
    </html>
    `);
});

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/healthz', (req, res) => res.send('OK'));

// Log uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection:', err);
});

// All routes below app initialization
// In-memory storage for demo (replace with DB for production)
const userData = {};

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.redirect('/auth/google');
}

// Session setup (MemoryStore, not for production scale)
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
    const user = req.user;
    const name = user.displayName || user.name?.givenName || 'Founder';
    const email = user.emails && user.emails[0] ? user.emails[0].value : '';
    const avatar = user.photos && user.photos[0] ? user.photos[0].value : '';
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile | Founders Cloud</title>
        <link rel="stylesheet" href="/styles.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; }
        .nav { width: 100%; background: #181818; padding: 1.2rem 0; display: flex; justify-content: center; gap: 2.5rem; margin-bottom: 2.5rem; box-shadow: 0 2px 16px #0004; }
        .nav-link { color: #fff; text-decoration: none; font-size: 1.1rem; font-weight: 600; opacity: 0.7; padding-bottom: 2px; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .nav-link.active, .nav-link:hover { opacity: 1; border-bottom: 2px solid #fff; }
        .profile-container { max-width: 420px; margin: 0 auto; background: #111; border-radius: 20px; box-shadow: 0 8px 40px #000a; padding: 2.5rem 2rem; text-align: center; }
        .profile-avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; margin-bottom: 1rem; background: #222; }
        .profile-name { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; }
        .profile-email { color: #aaa; font-size: 1rem; margin-bottom: 1.5rem; }
        .upload-label { display: inline-block; margin-bottom: 1.5rem; cursor: pointer; color: #fff; background: #222; border-radius: 8px; padding: 0.5rem 1.2rem; border: 1px solid #333; transition: background 0.2s; }
        .upload-label:hover { background: #333; }
        .profile-actions { margin-top: 2rem; }
        .logout-btn { color: #fff; background: #000; border: 1px solid #fff; border-radius: 8px; padding: 0.7rem 2.2rem; font-size: 1.1rem; font-weight: 600; text-decoration: none; transition: background 0.2s, color 0.2s; }
        .logout-btn:hover { background: #fff; color: #000; }
        .dashboard { margin-top: 2.5rem; background: #181818; border-radius: 16px; padding: 1.5rem 1rem; }
        .dashboard-title { font-size: 1.3rem; font-weight: 600; margin-bottom: 1.2rem; }
        .dashboard-stats { display: flex; justify-content: space-between; gap: 1rem; }
        .stat-card { flex: 1; background: #222; border-radius: 12px; padding: 1rem 0.5rem; text-align: center; }
        .stat-label { color: #aaa; font-size: 0.9rem; margin-bottom: 0.2rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        </style>
    </head>
    <body>
        <nav class="nav">
            <a href="/profile" class="nav-link active">Profile</a>
            <a href="/founders" class="nav-link">Founders Area</a>
            <a href="/logout" class="nav-link">Logout</a>
        </nav>
        <div class="profile-container">
            <img src="${avatar}" class="profile-avatar" id="profile-pic" alt="Profile Picture">
            <form id="upload-form" enctype="multipart/form-data" method="POST" action="/upload-avatar" style="margin-bottom:0;">
                <label class="upload-label">
                    <i class="fas fa-camera"></i> Change Photo
                    <input type="file" name="avatar" accept="image/*" style="display:none" onchange="this.form.submit()">
                </label>
            </form>
            <div class="profile-name">${name}</div>
            <div class="profile-email">${email}</div>
            <div class="profile-actions">
                <a href="/logout" class="logout-btn">Logout</a>
            </div>
            <div class="dashboard">
                <div class="dashboard-title">Productivity Dashboard</div>
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-label">Tasks Completed</div>
                        <div class="stat-value">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Goals</div>
                        <div class="stat-value">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Streak</div>
                        <div class="stat-value">1</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `);
});

// ...existing code...

// Start server (must be last)
app.listen(PORT, () => {
    console.log(`🚀 Founders Cloud running at http://localhost:${PORT}`);
});

