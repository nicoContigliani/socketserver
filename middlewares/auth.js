const jwt = require('jsonwebtoken');
const config = process.env;

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1] || 
                req.cookies?.token || 
                req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, config.TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      details: err.message 
    });
  }
};

module.exports = verifyToken;