const jwt = require('jsonwebtoken');

// Evaluate the JWT secret once at module load — fail fast rather than
// silently falling back to a known-public placeholder string.
const DEFAULT_SECRET = 'super_secret_jwt_key_change_me_in_production';
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === DEFAULT_SECRET) {
    throw new Error(
        'JWT_SECRET is not set or is still the default placeholder. ' +
        'Set a strong, unique value in your .env file.'
    );
}

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; // Save decoded user details (e.g. username) to req.user
        next();
    } catch (err) {
        console.warn('⚠️ JWT verification failed:', err.message);
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token session.' });
    }
};
