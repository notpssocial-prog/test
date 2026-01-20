// In-memory storage for demo (replace with DB for production)
const userData = {};

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.redirect('/auth/google');
}

app.get('/founders', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    if (!userData[userId]) {
        userData[userId] = { tasks: [], workLog: [] };
    }
    const { tasks, workLog } = userData[userId];
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Founders Area | Founders Cloud</title>
        <link rel="stylesheet" href="/styles.css">
        <style>
        body { background: #000; color: #fff; font-family: 'Inter', sans-serif; }
        .founders-container { max-width: 600px; margin: 60px auto; background: #111; border-radius: 20px; box-shadow: 0 8px 40px #000a; padding: 2.5rem 2rem; }
        h1 { text-align: center; font-size: 2rem; margin-bottom: 2rem; }
        .section { margin-bottom: 2.5rem; }
        .tasks-list { list-style: none; padding: 0; }
        .tasks-list li { background: #222; margin-bottom: 10px; padding: 12px 18px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; }
        .task-completed { text-decoration: line-through; color: #aaa; }
        .add-task-form, .log-hours-form { display: flex; gap: 10px; margin-bottom: 1.2rem; }
        .add-task-form input, .log-hours-form input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #333; background: #181818; color: #fff; }
        .add-task-form button, .log-hours-form button { background: #fff; color: #000; border: none; border-radius: 8px; padding: 10px 18px; font-weight: 600; cursor: pointer; }
        .add-task-form button:hover, .log-hours-form button:hover { background: #000; color: #fff; border: 1px solid #fff; }
        .worklog-list { list-style: none; padding: 0; }
        .worklog-list li { background: #222; margin-bottom: 10px; padding: 12px 18px; border-radius: 10px; }
        .nav-link { color: #fff; text-decoration: underline; margin-bottom: 2rem; display: inline-block; }
        </style>
    </head>
    <body>
        <div class="founders-container">
            <a href="/profile" class="nav-link">← Back to Profile</a>
            <h1>Founders Area</h1>
            <div class="section">
                <h2>Today's Tasks</h2>
                <form class="add-task-form" method="POST" action="/add-task">
                    <input type="text" name="task" placeholder="Add a new task..." required>
                    <button type="submit">Add Task</button>
                </form>
                <ul class="tasks-list">
                    ${tasks.map((t, i) => `<li><span class="${t.done ? 'task-completed' : ''}">${t.text}</span> <form style="display:inline" method="POST" action="/toggle-task"><input type="hidden" name="index" value="${i}"><button type="submit">${t.done ? 'Undo' : 'Done'}</button></form></li>`).join('')}
                </ul>
            </div>
            <div class="section">
                <h2>Log Work Hours</h2>
                <form class="log-hours-form" method="POST" action="/log-hours">
                    <input type="number" name="hours" min="0" step="0.1" placeholder="Hours worked today" required>
                    <button type="submit">Log Hours</button>
                </form>
                <ul class="worklog-list">
                    ${workLog.map((w, i) => `<li>Day ${i+1}: <strong>${w} hours</strong></li>`).join('')}
                </ul>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.post('/add-task', express.urlencoded({ extended: true }), ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    if (!userData[userId]) userData[userId] = { tasks: [], workLog: [] };
    userData[userId].tasks.push({ text: req.body.task, done: false });
    res.redirect('/founders');
});

app.post('/toggle-task', express.urlencoded({ extended: true }), ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    const idx = parseInt(req.body.index);
    if (!userData[userId]) userData[userId] = { tasks: [], workLog: [] };
    if (userData[userId].tasks[idx]) userData[userId].tasks[idx].done = !userData[userId].tasks[idx].done;
    res.redirect('/founders');
});

app.post('/log-hours', express.urlencoded({ extended: true }), ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    if (!userData[userId]) userData[userId] = { tasks: [], workLog: [] };
    userData[userId].workLog.push(Number(req.body.hours));
    res.redirect('/founders');
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
        .profile-container { max-width: 420px; margin: 60px auto; background: #111; border-radius: 20px; box-shadow: 0 8px 40px #000a; padding: 2.5rem 2rem; text-align: center; }
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

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/healthz', (req, res) => res.send('OK'));

app.listen(PORT, () => {
    console.log(`🚀 Founders Cloud running at http://localhost:${PORT}`);
});
