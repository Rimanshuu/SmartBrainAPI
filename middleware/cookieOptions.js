const isProduction = process.env.NODE_ENV === 'production';

// in production the frontend (vercel) and API (render) are on different sites,
// so the cookie must be SameSite=None + Secure or the browser won't send it on fetch
const cookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

module.exports = { cookieOptions, ONE_WEEK_MS };
