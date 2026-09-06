const handleProfile = (req, res, db) => {
    db('users')
        .where('id', '=', req.userId)
        .select('id', 'name', 'email', 'entries', 'joined')
        .then(data => {
            if (data.length === 0) {
                return res.status(404).json('user not found');
            }
            res.json(data[0]);
        })
        .catch(error => {
            console.log(error);
            res.status(400).json('error getting user');
        });
};

module.exports = {
    handleProfile: handleProfile
};
