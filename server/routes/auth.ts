import { Router } from 'express';
import {
  db,
  verifyPassword,
  hashPassword,
  generateCryptoToken,
  isDemoSeedEnabled,
  needsRehash,
  getPbkdf2Iterations,
} from '../db/database.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// System Auth Status & Setup Requirement Check (/api/core/auth/status)
router.get('/status', (req, res) => {
  const hasAdmin = Array.from(db.users.values()).some((u) => u.role_id === 'admin' && u.is_active);
  const hasUsers = db.users.size > 0;
  const demoMode = isDemoSeedEnabled();
  const demoUsers = demoMode
    ? Array.from(db.users.values())
        .filter((u) => ['admin', 'matteo', 'guest_visitor'].includes(u.username))
        .map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          role_id: u.role_id,
        }))
    : [];

  return res.json({
    setup_required: !hasAdmin,
    demo_mode: demoMode,
    has_users: hasUsers,
    demo_users: demoUsers,
    multi_user_enabled: db.instanceConfig.settings?.multi_user_enabled ?? true,
  });
});

// Setup Initial Administrator Account (Available only on fresh install when no admin exists)
router.post('/setup-admin', (req, res) => {
  const hasAdmin = Array.from(db.users.values()).some((u) => u.role_id === 'admin');
  if (hasAdmin) {
    return res.status(403).json({
      error: 'Setup has already been completed. An administrator account already exists.',
      code: 'SETUP_ALREADY_COMPLETED',
    });
  }

  const { username, password, email, full_name } = req.body;
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Administrator password must be at least 8 characters long' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  const adminUser = {
    id: 'user_admin',
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password_hash: hashPassword(password),
    full_name: (full_name && full_name.trim()) || username.trim(),
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role_id: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };

  db.users.set(adminUser.id, adminUser);
  db.saveToDisk();
  db.logAudit(adminUser.id, 'CREATE', `Initial administrator account '${adminUser.username}' created via setup wizard`, adminUser.id, 'user');

  const token = generateCryptoToken(adminUser.id, adminUser.username);
  const { password_hash, ...safeUser } = adminUser;

  return res.json({
    success: true,
    message: 'Administrator account configured successfully',
    user: safeUser,
    token,
  });
});

// Get Current Authenticated User & Permissions (/api/core/auth/me)
router.get('/me', (req: AuthenticatedRequest, res) => {
  const multiUserEnabled = db.instanceConfig.settings?.multi_user_enabled ?? true;

  if (multiUserEnabled) {
    if (!req.user || !req.userId) {
      return res.status(401).json({
        error: 'Authentication required. No valid session token provided.',
        code: 'AUTH_REQUIRED',
      });
    }
    if (!req.user.is_active) {
      return res.status(403).json({
        error: 'Account is disabled by administrator',
        code: 'ACCOUNT_DISABLED',
        account_disabled: true,
        multi_user_enabled: true,
      });
    }
  } else {
    // Single-user fallback
    if (!req.user) {
      const defaultUser =
        Array.from(db.users.values()).find((u) => u.is_active && u.role_id === 'admin') ||
        Array.from(db.users.values())[0];
      if (defaultUser) {
        req.user = defaultUser;
        req.userId = defaultUser.id;
        req.userRole = defaultUser.role_id;
        req.isAdmin = true;
      }
    }
    if (!req.user) {
      return res.status(401).json({ error: 'No user configured', code: 'AUTH_REQUIRED' });
    }
    if (!req.user.is_active) {
      return res.status(403).json({
        error: 'Account is disabled by administrator',
        code: 'ACCOUNT_DISABLED',
        account_disabled: true,
        multi_user_enabled: false,
      });
    }
  }

  const user = req.user;
  const role = db.roles.get(user.role_id) || {
    id: user.role_id,
    name: user.role_id,
    description: '',
    is_admin: user.role_id === 'admin',
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
    all_users: req.isAdmin
      ? Array.from(db.users.values()).map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          role_id: u.role_id,
          is_active: u.is_active,
        }))
      : [],
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

  // Transparent automatic rehash if work factor is below current target
  if (needsRehash(user.password_hash)) {
    user.password_hash = hashPassword(password);
    db.logAudit(
      user.id,
      'CONFIG_CHANGE',
      `Automatically rehashed password hash to work factor of ${getPbkdf2Iterations()} iterations`
    );
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
    auth_type: 'PBKDF2-HMAC-SHA512',
  });
});

// Logout
router.post('/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.userId) {
    db.logAudit(req.userId, 'LOGOUT', `User ${req.user?.username || req.userId} logged out`);
  }
  return res.json({ success: true });
});

// Switch User (Admin Impersonation / Multi-User Switching - requires admin privileges)
router.post('/switch-user', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  const user = db.users.get(user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (!user.is_active) {
    return res.status(403).json({ error: 'Target user account is disabled' });
  }
  db.logAudit(
    req.userId || user.id,
    'LOGIN',
    `Admin ${req.user?.username || req.userId} switched active session to user ${user.username}`
  );
  const token = generateCryptoToken(user.id, user.username);
  const { password_hash, ...safeUser } = user;
  return res.json({ success: true, user: safeUser, token });
});

// Users Management (Admin)
router.get('/users', requireAdmin, (req: AuthenticatedRequest, res) => {
  const users = Array.from(db.users.values()).map((u) => {
    const { password_hash, ...rest } = u;
    return rest;
  });
  return res.json(users);
});

router.post('/users', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { username, email, full_name, role_id, password } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'A password with a minimum of 6 characters is required' });
  }

  const id = 'user_' + Math.random().toString(36).substring(2, 9);
  const newUser = {
    id,
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password_hash: hashPassword(password),
    full_name: (full_name && full_name.trim()) || username.trim(),
    role_id: role_id || 'member',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.users.set(id, newUser);
  db.saveToDisk();
  db.logAudit(req.userId || 'user_admin', 'CREATE', `Created user account ${newUser.username}`, id, 'user');

  const { password_hash, ...rest } = newUser;
  return res.json(rest);
});

// Seed Demo Data On-Demand (Admin Only)
router.post('/seed-demo', requireAdmin, (req: AuthenticatedRequest, res) => {
  const result = db.seedDemoDataOnDemand();
  db.logAudit(req.userId || 'user_admin', 'CONFIG_CHANGE', 'Explicitly populated demo user accounts and sample entities');
  return res.json({
    success: true,
    message: 'Demo dataset populated successfully',
    ...result,
  });
});

router.put('/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
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

router.delete('/users/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.id === req.userId) {
    return res.status(400).json({ error: 'Cannot delete current authenticated user' });
  }

  db.users.delete(req.params.id);
  db.saveToDisk();
  db.logAudit(
    req.userId || 'user_admin',
    'DELETE',
    `Deleted user account ${user.username}`,
    user.id,
    'user'
  );

  return res.json({ success: true });
});

router.get('/roles', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json(Array.from(db.roles.values()));
});

export default router;
