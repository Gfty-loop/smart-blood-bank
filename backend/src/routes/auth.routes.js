import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Your account has been deactivated. Contact an administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  logAudit(user.user_id, 'USER_LOGIN', 'User', user.user_id, `User ${user.email} signed in.`);

  return res.json({
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.get('SELECT user_id, name, email, role, is_active FROM users WHERE user_id = ?', [req.user.user_id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

router.post('/logout', authenticateToken, (req, res) => {
  logAudit(req.user.user_id, 'USER_LOGOUT', 'User', req.user.user_id, `User ${req.user.email} signed out.`);
  res.json({ message: 'Logged out successfully.' });
});

export default router;
