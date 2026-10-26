// sets the user's count back to 0 and forgets which images they've counted,
// so after a reset every photo can be counted again
const handleReset = (req, res, db) => {
    const id = req.userId; // trust the token, not whatever the client claims

    db.transaction(trx => {
        return trx('users')
            .where('id', '=', id)
            .update({ entries: 0 })
            .returning('entries')
            .then(data => {
                if (data.length === 0) {
                    throw new Error('user not found');
                }
                return trx('used_images')
                    .where('user_id', '=', id)
                    .del()
                    .then(() => data[0].entries);
            });
    })
    .then(entries => res.json(entries))
    .catch(error => {
        console.log(error);
        res.status(400).json('unable to reset count');
    });
};

module.exports = {
    handleReset: handleReset
};
