const jwt = require('jsonwebtoken');    

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const handleSignIn = (req, res, db, bcrypt, authLimiter) => {
    const { email, password } = req.body;
    
        if(!email || !password) {
            return res.status(400).json('mssing required fields');
        }
    
        db('login')
            .join('users', 'login.user_id', '=', 'users.id')
            .where('users.email', '=', email)
            .select('login.hash', 'users.*')
            .then(data => {
                if (data.length === 0) {
                    return res.status(400).json('wrong credentials');
                }
    
                const isValid = bcrypt.compareSync(password, data[0].hash);
    
                if (isValid) {
                    // strip the hash before sending user data back
                    const { hash, ...user } = data[0];
                    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
                    res.cookie('token', token, {
                        httpOnly: true,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: ONE_WEEK_MS,
                    });

                    authLimiter.resetKey(req.ip);
                    res.json(user);
                } else {
                    res.status(400).json('wrong credentials');
                }
            })
            .catch(error => {
                console.log(error);
                res.status(400).json('unable to sign in');
            });
}

module.exports = {
    handleSignIn: handleSignIn
}