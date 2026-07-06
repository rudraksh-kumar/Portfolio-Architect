import jwt from 'jsonwebtoken';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        console.error('JWT Verification Error:', error);
        return res.status(401).json({ error: 'Authentication failed. Token is invalid or expired.' });
    }
};
