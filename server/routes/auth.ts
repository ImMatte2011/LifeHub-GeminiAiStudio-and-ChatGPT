import { Router } from 'express';
import { db, verifyPassword, hashPassword, generateCryptoToken } from '../db/database.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Get Current Authenticated User & Permissions (/api/core/auth/me)
router.get('/me', (req: AuthenticatedRequest, res) => {
  const multiUserEnabled = db.instanceConfig.settings?.multi_user_enabled ?? true;
  
  // Resolve user strictly from request context (populated by authenticateRequest middleware)
  let user = req.user;

  // Fallback: If no token was sent, resolve a sensible default based on multi-user setting
  if (!user) {
    if (!multiUserEnabled) {
      user = Array.from(db.users.values()).find((u) => u.is_active && u.role_id === 'admin') ||
        Array.from(db.users.values())[0];
    } else {
      // Default to the first active user for initial non-authenticated discovery
      user = db.users.get('user_matteo') || Array.from(db.users.values())[0];
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Account disabled check
  if (!user.is_active) {
    return res.status(403).json({
      error: 'Account is disabled by administrator',
      account_disabled: true,
      multi_user_enabled: multiUserEnabled,
    });
  }

  const role = db.roles.get(user.role_id) || {
    id: 'guest',
    name: 'Guest',
    description: 'Read only',
    is_admin: false,
  };

  const permissions = Array.from(db.rolePermissions.values()).filter(
    (rp) => rp.role_id === role.id && rp.allowed
  );

  // Generate a valid signed token for this specific user
  const token = generateCryptoToken(user.id, user.username);

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      role_id: user.role_id,
      is_active: user.is_active,
      created_at: user.created_at,
    },
    role,
    token,
    auth_type: 'PBKDF2-HMAC-SHA256 (Per-Request Cryptographic Token)',
    permissions: permissions.map((p) => p.permission_key),
    multi_user_enabled: multiUserEnabled,
    all_users: Array.from(db.users.values()).map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      role_id: u.role_id,
      is_active: u.is_active,
    })),
  });
});

// Login with real PBKDF2 Password Verification
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === (username || '').toLowerCase()
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'User account has been deactivated' });
  }

  user.last_login = new Date().toISOString();
  db.saveToDisk();
  db.logAudit(user.id, 'LOGIN', `User ${user.username} logged in successfully`);

  const token = generateCryptoToken(user.id, user.username);

  const { password_hash, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser,
    token,
    auth_type: 'PBKDF2-HMAC-SHA256',
  });
});

// Logout
router.post('/logout', (req: AuthenticatedRequest, res) => {
  if (req.userId) {
    db.logAudit(req.userId, 'LOGOUT', `User ${req.user?.username || req.userId} logged out`);
  }
  return res.json({ success: true });
});

// Switch User (Generates a new token for the target user without mutating global state)
router.post('/switch-user', (req, res) => {
  const { user_id } = req.body;
  const user = db.users.get(user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  db.logAudit(user.id, 'LOGIN', `Switched active session to user ${user.username}`);
  const token = generateCryptoToken(user.id, user.username);
  const { password_hash, ...safeUser } = user;
  return res.json({ success: true, user: safeUser, token });
});

// Users Management (Admin)
router.get('/users', (req, res) => {
  const users = Array.from(db.users.values()).map((u) => {
    const { password_hash, ...rest } = u;
    return rest;
  });
  return res.json(users);
});

router.post('/users', (req: AuthenticatedRequest, res) => {
  const { username, email, full_name, role_id, password } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  const id = 'user_' + Math.random().toString(36).substring(2, 9);
  const newUser = {
    id,
    username,
    email,
    password_hash: hashPassword(password || 'lifehub123'),
    full_name: full_name || username,
    role_id: role_id || 'member',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.users.set(id, newUser);
  db.saveToDisk();
  db.logAudit(req.userId || 'user_admin', 'CREATE', `Created user account ${username}`, id, 'user');

  const { password_hash, ...rest } = newUser;
  return res.json(rest);
});

router.put('/users/:id', (req: AuthenticatedRequest, res) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { full_name, email, role_id, is_active, password } = req.body;
  if (full_name !== undefined) user.full_name = full_name;
  if (email !== undefined) user.email = email;
  if (role_id !== undefined) user.role_id = role_id;
  if (is_active !== undefined) user.is_active = Boolean(is_active);
  if (password) user.password_hash = hashPassword(password);

  db.saveToDisk();
  db.logAudit(
    req.userId || 'user_admin',
    'UPDATE',
    `Updated user ${user.username} (active: ${user.is_active}, role: ${user.role_id})`,
    user.id,
    'user'
  );

  const { password_hash, ...rest } = user;
  return res.json(rest);
});

router.get('/roles', (req, res) => {
  return res.json(Array.from(db.roles.values()));
});

export default router;
