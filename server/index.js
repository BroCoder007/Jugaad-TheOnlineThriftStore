const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Passport Setup
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID || 'place-holder',
    clientSecret: GOOGLE_CLIENT_SECRET || 'place-holder',
    callbackURL: "/auth/google/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Check if user exists, else create
        const sqlSelect = 'SELECT * FROM users WHERE email = ?';
        db.get(sqlSelect, [email], (err, row) => {
            if (err) return cb(err);
            if (!row) {
                // Create new user (password is null for SSO users)
                const sqlInsert = 'INSERT INTO users (name, email) VALUES (?,?)';
                db.run(sqlInsert, [name, email], function (err) {
                    if (err) return cb(err);
                    return cb(null, { id: this.lastID, name, email });
                });
            } else {
                return cb(null, row);
            }
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(session({ secret: 'session_secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '../public')));

// Database setup
const dbPath = path.resolve(__dirname, 'jugaad.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        price INTEGER,
        category TEXT,
        seller_id INTEGER,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(seller_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        bidder_id INTEGER,
        amount INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(bidder_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        sender_id INTEGER,
        receiver_id INTEGER,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(item_id) REFERENCES items(id),
        FOREIGN KEY(sender_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
    )`);
}

// Routes

// Auth
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?,?,?)';
        db.run(sql, [name, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already registered. Please login or use a different email.' });
                }
                return res.status(400).json({ error: err.message });
            }
            const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ id: this.lastID, name, email, token });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, row.password);
        if (isMatch) {
            const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ id: row.id, name: row.name, email: row.email, token });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

// Google Auth Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, generate JWT and redirect
        const user = req.user;
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        // Redirect to frontend with token
        res.redirect(`/?token=${token}&name=${encodeURIComponent(user.name)}&id=${user.id}`);
    });

// Items
app.get('/api/items', (req, res) => {
    const sql = `SELECT items.*, users.name as seller_name 
                 FROM items 
                 JOIN users ON items.seller_id = users.id 
                 ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/items', (req, res) => {
    const { title, description, price, category, seller_id, image } = req.body;
    const sql = 'INSERT INTO items (title, description, price, category, seller_id, image) VALUES (?,?,?,?,?,?)';
    db.run(sql, [title, description, price, category, seller_id, image], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// Chat Routes

// Get all conversations for a user (grouped by item and the other party)
app.get('/api/chats/:userId', (req, res) => {
    const userId = req.params.userId;
    // This complex query finds distinct conversations. 
    // It groups by item_id and the "other" person (sender or receiver who is NOT the current user).
    const sql = `
        SELECT DISTINCT 
            m.item_id, 
            i.title as item_title,
            CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
            u.name as other_user_name
        FROM messages m
        JOIN items i ON m.item_id = i.id
        JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
    `;
    db.all(sql, [userId, userId, userId, userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get messages between two users for a specific item
app.get('/api/messages', (req, res) => {
    const { itemId, userId1, userId2 } = req.query;
    const sql = `
        SELECT m.*, u.name as sender_name 
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.item_id = ? 
        AND ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
        ORDER BY m.created_at ASC
    `;
    db.all(sql, [itemId, userId1, userId2, userId2, userId1], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Send a message
app.post('/api/messages', (req, res) => {
    const { item_id, sender_id, receiver_id, content } = req.body;
    const sql = 'INSERT INTO messages (item_id, sender_id, receiver_id, content) VALUES (?,?,?,?)';
    db.run(sql, [item_id, sender_id, receiver_id, content], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
