const jwt = require('jsonwebtoken');

// Middleware 1: Check if user is logged in
exports.authenticate = (req, res, next) => {
  try {
    // Get token from header (format: "Bearer TOKEN_HERE")
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to the request object
    req.user = decoded;
    
    next(); // Continue to the next function
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware 2: Check if user has the right role
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};