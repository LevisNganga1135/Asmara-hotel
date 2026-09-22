// middleware/adminAuth.js
// Guards admin-only endpoints (e.g. staff registration) behind a shared
// secret key. The caller must supply the secret in the
// X-Registration-Secret request header.
//
// Set REGISTRATION_SECRET to a strong random value in your .env file.
// If the variable is missing the server will refuse ALL registration
// requests — safe by default.

module.exports = (req, res, next) => {
    const expectedSecret = process.env.REGISTRATION_SECRET;

    // If the env var is not configured at all, block registrations entirely.
    if (!expectedSecret) {
        console.warn('⚠️  REGISTRATION_SECRET is not set — staff registration is disabled.');
        return res.status(403).json({
            error: 'Staff registration is currently disabled. Set REGISTRATION_SECRET in your environment to enable it.'
        });
    }

    const providedSecret = req.headers['x-registration-secret'];

    if (!providedSecret || providedSecret !== expectedSecret) {
        console.warn('🔒 Unauthorized staff registration attempt blocked.');
        return res.status(403).json({
            error: 'Forbidden: Invalid or missing registration secret.'
        });
    }

    next();
};
