const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors')
const knex = require('knex')
const cookieParser = require('cookie-parser');
require('dotenv').config();

//importing endpoints from controllers
const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');
const requireAuth = require('./middleware/requireAuth');

const db = knex ({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: process.env.PG_PASSWORD,
    database: 'smart-brain',
  },
});


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.get('/', (req, res) => {
    res.json('app is running');
})

//signin
app.post('/signin', (req, res) => {signin.handleSignIn(req, res, db, bcrypt)});

//register
app.post('/register', (req, res) => {register.handleRegister(req, res, db, bcrypt)});

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

app.listen(3000, () => {
    console.log('App is running on port 3000.')
});