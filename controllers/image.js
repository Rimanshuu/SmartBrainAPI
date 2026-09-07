const crypto = require('crypto');

// hash URLs before storing so we don't run into PostgreSQL index size limits
// very long URLs (like from Google Images) were causing btree index errors
// MD5 hash is always 32 chars, so we can safely index it
const hashUrl = (url) => {
    return crypto.createHash('md5').update(url).digest('hex');
};

const handleImage = (req, res, db) => {

    const { entries, image_url } = req.body;
    const id = req.userId; // trust the token, not whatever the client claims

    if (!image_url || !Number.isInteger(entries) || entries <= 0 || entries > 50) {
        return res.status(400).json('invalid request');
    }

    // hash the URL so we can safely store + index it without size issues
    const url_hash = hashUrl(image_url);

    // check if this user already detected this image in the last 24 hours
    // using url_hash instead of full URL to avoid index size issues
    db('used_images')
        .where('user_id', '=', id)
        .where('url_hash', '=', url_hash)
        .where('counted_at', '>', db.raw("NOW() - INTERVAL '24 hours'"))
        .then(data => {
            // if they already used it recently, tell them to wait til tomorrow
            if (data.length > 0) {
                return res.status(400).json('Image already counted today');
            }

            // cool, increment their count
            return db('users')
                .where('id', '=', id)
                .increment('entries', entries)
                .returning('entries')
                .then(data => {
                    // remember this image so we dont count it again today
                    // store both the full URL (for reference) + hash (for indexing)
                    return db('used_images')
                        .insert({ user_id: id, image_url: image_url, url_hash: url_hash })
                        .onConflict(['user_id', 'url_hash'])
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