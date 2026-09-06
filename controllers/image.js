
const handleImage = (req, res, db) => {

    const { entries, image_url } = req.body;
    const id = req.userId; // trust the token, not whatever the client claims

    if (!image_url || !Number.isInteger(entries) || entries <= 0 || entries > 50) {
        return res.status(400).json('invalid request');
    }

    // 1. Check if user already used this image in last 24 hours
    db('used_images')
        .where('user_id', '=', id)
        .where('image_url', '=', image_url)
        .where('counted_at', '>', db.raw("NOW() - INTERVAL '24 hours'"))
        .then(data => {
            // If image was used recently(24 hours), block them
            if (data.length > 0) {
                return res.status(400).json('Image already counted today');
            }
            
            // 2. If allowed, increment entries
            return db('users')
                .where('id', '=', id)
                .increment('entries', entries)
                .returning('entries')
                .then(data => {
                    // 3. Record this image usage
                    return db('used_images')
                        .insert({ user_id: id, image_url: image_url })
                        .onConflict(['user_id', 'image_url'])
                        .merge()
                        .then(() => {
                            res.json(data[0].entries);
                        });
                });
        })
        .catch(error => {
            console.log(error);
            res.status(400).json('Error');
        });

}


module.exports = {
    handleImage: handleImage
}