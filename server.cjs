const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors')

const app = express();


const database = {
    users: [
        {
            id: '123',
            name: 'John',
            email: 'john@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Sally',
            email: 'sally@gmail.com',
            password: 'bananas',
            entries: 0,
            joined: new Date()
        }
    ],

    login: [
        {
            id: '123',
            hash: '$2b$10$ns1eC9Vma/juuPH0rDJmhOutbe4.TVGtM8SiGNwsV7izekAnuMTTW',
            email: 'john@gmail.com'
        },
        {
            id: '125',
            hash: '$2b$10$TgAMa6oKMefLiwhGQbY3JO.qmg3JHrV2/g8vxI9OoWGgnVOCsDMQ2',
            email: 'ann@gmail.com'
        },
    ]
}

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json(database.users);
})

//signin
app.post('/signin', (req, res) => {

    //console.log('BODY:', req.body);
    const { email, password } = req.body;

    const loginRecord = database.login.find(entry => entry.email === email);

    if (!loginRecord) {
        return res.status(400).json("Email or Password entered is incorrect");
    }

    const isValid = bcrypt.compareSync(password, loginRecord.hash);

    if (isValid) {
        const user = database.users.find(user => user.email === email);
        return res.json(user);
    } else {
        return res.status(400).json("Email or Password entered is incorrect");
    };
});

//register
app.post('/register', (req, res) => {

    const { name, email, password } = req.body;
    const newUser = {
        id: database.users.length + 123, //static for now
        name: name,
        email: email,
        entries: 0,
        joined: new Date()
    };
    database.users.push(newUser);

    // generate hash
    const user_hash = bcrypt.hashSync(`${password}`, 10);
    console.log("user_hash")
    // add hash to DB
    database.login.push({
        id: database.users.length + 123, // static again for now
        hash: user_hash,
        email: email
    });

    return res.json(newUser);
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    const user = database.users.find(user => user.id === id);

    if (user) {
        res.json(user);
    } else {
        res.status(400).json("User NOT Found");
    }
});

app.put('/image', (req, res) => {
    const { id, entries } = req.body;
    const user = database.users.find(user => user.id === id);

    if (user) {
        user.entries += entries;
        res.json(user.entries);
    } else {
        res.status(400).json("User NOT Found!");
    }
})

app.listen(3000, () => {
    console.log('App is running on port 3000.')
});