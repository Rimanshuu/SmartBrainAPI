const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors')
const knex = require('knex')
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

//importing endpoints from controllers
const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');
const detect = require('./controllers/detect');
const requireAuth = require('./middleware/requireAuth');

const db = knex ({
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: process.env.PG_PASSWORD,
    database: 'smart-brain',
  },
});


const app = express();

// rate limit auth endpoints to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 requests per window
    message: 'too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = ['http://localhost:5173', 'https://smart-brain-beryl.vercel.app'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.get('/', (req, res) => {
    res.json('app is running');
})

//signin (rate limited to prevent brute force)
app.post('/signin', authLimiter, (req, res) => {signin.handleSignIn(req, res, db, bcrypt, authLimiter)});

//register (rate limited to prevent brute force)
app.post('/register', authLimiter, (req, res) => {register.handleRegister(req, res, db, bcrypt, authLimiter)});

//logout
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json('logged out');
});

//profile (of the currently authenticated user)
//new syntax for route-specific middleware: app.METHOD(path, [middleware1, middleware2, ...], handler)
app.get('/profile', requireAuth, (req, res) => {profile.handleProfile(req, res, db)});

//image count
app.put('/image', requireAuth, (req, res) => {image.handleImage(req, res, db)});

//detect objects in image
app.post('/detect', requireAuth, (req, res) => {detect.handleDetect(req, res, db)});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}.`)
});