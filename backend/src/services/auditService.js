import { db } from '../db/database.js';

export function logAudit(userId, action, entity, entityId, details) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    db.run(
      'INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, entity, String(entityId || ''), detailsStr]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
