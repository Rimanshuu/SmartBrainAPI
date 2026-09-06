const jwt = require('jsonwebtoken');

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const handleRegister = (req, res, db, bcrypt) => {
    const {name, email, password } = req.body;
    
        if (!name || !email || !password) {
            return res.status(400).json({error: 'missing required fields'});
        }
    
        //hashing the password
        const hashed_password = bcrypt.hashSync(password, 10);
    
        db.transaction(trx => {
            return trx('users')
                .insert({ name, email, joined: new Date() })
                .returning('*')
                .then(user => {
                    return trx('login')
                        .insert({
                            user_id: user[0].id,
                            hash: hashed_password,
                        })
                        .then(() => user[0]);
                });
        })
        .then(user => {
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: ONE_WEEK_MS,
            });
            res.json(user);
        })
        .catch(error => {
            if (error.code === '23505') { //postgress unique key voilation error code
                return res.status(400).json({ error: 'email already exists'});
            }
            console.log(error);
            res.status(400).json({error: 'unable to register, try again'});
        })
}

module.exports = {
    handleRegister: handleRegister
}