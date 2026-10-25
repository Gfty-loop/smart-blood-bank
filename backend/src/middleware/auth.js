import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sbbms_super_secret_jwt_key_2026';

export function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = decoded;
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrative privileges required for this action.' });
  }
  next();
}

export function requireStaffOrAdmin(req, res, next) {
  if (!req.user || !['admin', 'staff', 'technician'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Staff or admin privileges required.' });
  }
  next();
}
