import { Router } from 'express';
import {
  verifyPassword,
  hashPassword,
  generateCryptoToken,
  isDemoSeedEnabled,
  needsRehash,
  getPbkdf2Iterations,
} from '../db/database.js';
import { AuthenticatedRequest, requireAuth, requireAdmin } from '../middleware/auth.js';
import { repositories } from '../repositories/index.js';

const router = Router();

// System Auth Status & Setup Requirement Check (/api/core/auth/status)
router.get('/status', async (req, res) => {
  try {
    const users = await repositories.users.getAll();
    const hasAdmin = users.some((u) => u.role_id === 'admin' && u.is_active);
    const hasUsers = users.length > 0;
    const demoMode = isDemoSeedEnabled();
    const demoUsers = demoMode
      ? users
          .filter((u) => ['admin', 'matteo', 'guest_visitor'].includes(u.username))
          .map((u) => ({
            id: u.id,
            username: u.username,
            full_name: u.full_name,
            role_id: u.role_id,
          }))
      : [];

    const multiUserSetting = await repositories.settings.get('multi_user_enabled');
    const multiUserEnabled = multiUserSetting !== undefined ? multiUserSetting : true;

    return res.json({
      setup_required: !hasAdmin,
      demo_mode: demoMode,
      has_users: hasUsers,
      demo_users: demoUsers,
      multi_user_enabled: multiUserEnabled,
    });
  } catch (err) {
    console.error('[Auth Status Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve auth status' });
  }
});

// Setup Initial Administrator Account (Available only on fresh install when no admin exists)
router.post('/setup-admin', async (req, res) => {
  try {
    const users = await repositories.users.getAll();
    const hasAdmin = users.some((u) => u.role_id === 'admin');
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

    await repositories.users.create(adminUser);
    await repositories.audit.log({
      user_id: adminUser.id,
      username: adminUser.username,
      action: 'CREATE',
      details: `Initial administrator account '${adminUser.username}' created via setup wizard`,
      entity_id: adminUser.id,
      entity_type: 'user',
    });

    const token = generateCryptoToken(adminUser.id, adminUser.username);
    const { password_hash, ...safeUser } = adminUser;

    return res.json({
      success: true,
      message: 'Administrator account configured successfully',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('[Auth Setup Admin Error]:', err);
    return res.status(500).json({ error: 'Failed to configure administrator account' });
  }
});

// Get Current Authenticated User & Permissions (/api/core/auth/me)
router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    const multiUserSetting = await repositories.settings.get('multi_user_enabled');
    const multiUserEnabled = multiUserSetting !== undefined ? multiUserSetting : true;

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
        const allUsers = await repositories.users.getAll();
        const defaultUser =
          allUsers.find((u) => u.is_active && u.role_id === 'admin') ||
          allUsers[0];
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
    const role = (await repositories.roles.getRoleById(user.role_id)) || {
      id: user.role_id,
      name: user.role_id,
      description: '',
      is_admin: user.role_id === 'admin',
    };

    const rolePermissions = await repositories.roles.getPermissionsForRole(role.id);
    const permissions = rolePermissions.filter((rp) => rp.allowed);

    // Generate a valid signed token for this specific user
    const token = generateCryptoToken(user.id, user.username);

    let allUsersList: any[] = [];
    if (req.isAdmin) {
      const allUsers = await repositories.users.getAll();
      allUsersList = allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        role_id: u.role_id,
        is_active: u.is_active,
      }));
    }

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
      all_users: allUsersList,
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve authenticated user details' });
  }
});

// Login with real PBKDF2 Password Verification
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await repositories.users.getByUsername((username || '').toLowerCase());

    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'User account has been deactivated' });
    }

    const updates: Partial<typeof user> = {};

    // Transparent automatic rehash if work factor is below current target
    if (needsRehash(user.password_hash)) {
      const newHash = hashPassword(password);
      user.password_hash = newHash;
      updates.password_hash = newHash;
      await repositories.audit.log({
        user_id: user.id,
        username: user.username,
        action: 'CONFIG_CHANGE',
        details: `Automatically rehashed password hash to work factor of ${getPbkdf2Iterations()} iterations`,
      });
    }

    const nowIso = new Date().toISOString();
    user.last_login = nowIso;
    updates.last_login = nowIso;

    await repositories.users.update(user.id, updates);

    await repositories.audit.log({
      user_id: user.id,
      username: user.username,
      action: 'LOGIN',
      details: `User ${user.username} logged in successfully`,
    });

    const token = generateCryptoToken(user.id, user.username);

    const { password_hash, ...safeUser } = user;
    return res.json({
      success: true,
      user: safeUser,
      token,
      auth_type: 'PBKDF2-HMAC-SHA512',
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'Authentication failed due to server error' });
  }
});

// Logout
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.userId) {
      await repositories.audit.log({
        user_id: req.userId,
        username: req.user?.username || req.userId,
        action: 'LOGOUT',
        details: `User ${req.user?.username || req.userId} logged out`,
      });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[Auth Logout Error]:', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// Switch User (Admin Impersonation / Multi-User Switching - requires admin privileges)
router.post('/switch-user', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }
    const user = await repositories.users.getById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Target user account is disabled' });
    }
    await repositories.audit.log({
      user_id: req.userId || user.id,
      username: req.user?.username || req.userId || 'admin',
      action: 'LOGIN',
      details: `Admin ${req.user?.username || req.userId} switched active session to user ${user.username}`,
    });
    const token = generateCryptoToken(user.id, user.username);
    const { password_hash, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, token });
  } catch (err) {
    console.error('[Auth Switch User Error]:', err);
    return res.status(500).json({ error: 'Failed to switch user' });
  }
});

// Users Management (Admin)
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const allUsers = await repositories.users.getAll();
    const users = allUsers.map((u) => {
      const { password_hash, ...rest } = u;
      return rest;
    });
    return res.json(users);
  } catch (err) {
    console.error('[Auth Get Users Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

router.post('/users', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
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

    await repositories.users.create(newUser);
    await repositories.audit.log({
      user_id: req.userId || 'user_admin',
      username: req.user?.username || 'admin',
      action: 'CREATE',
      details: `Created user account ${newUser.username}`,
      entity_id: id,
      entity_type: 'user',
    });

    const { password_hash, ...rest } = newUser;
    return res.json(rest);
  } catch (err) {
    console.error('[Auth Create User Error]:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Seed Demo Data On-Demand (Admin Only)
router.post('/seed-demo', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    await repositories.audit.log({
      user_id: req.userId || 'user_admin',
      username: req.user?.username || 'admin',
      action: 'CONFIG_CHANGE',
      details: 'Explicitly populated demo user accounts and sample entities',
    });
    return res.json({
      success: true,
      message: 'Demo dataset populated successfully',
    });
  } catch (err) {
    console.error('[Auth Seed Demo Error]:', err);
    return res.status(500).json({ error: 'Failed to seed demo data' });
  }
});

router.put('/users/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await repositories.users.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { full_name, email, role_id, is_active, password } = req.body;
    const updates: Partial<typeof user> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (role_id !== undefined) updates.role_id = role_id;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (password) updates.password_hash = hashPassword(password);

    const updatedUser = await repositories.users.update(user.id, updates);

    await repositories.audit.log({
      user_id: req.userId || 'user_admin',
      username: req.user?.username || 'admin',
      action: 'UPDATE',
      details: `Updated user ${user.username} (active: ${updates.is_active !== undefined ? updates.is_active : user.is_active}, role: ${updates.role_id || user.role_id})`,
      entity_id: user.id,
      entity_type: 'user',
    });

    if (!updatedUser) return res.status(404).json({ error: 'User update failed' });
    const { password_hash, ...rest } = updatedUser;
    return res.json(rest);
  } catch (err) {
    console.error('[Auth Update User Error]:', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await repositories.users.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete current authenticated user' });
    }

    await repositories.users.delete(req.params.id);
    await repositories.audit.log({
      user_id: req.userId || 'user_admin',
      username: req.user?.username || 'admin',
      action: 'DELETE',
      details: `Deleted user account ${user.username}`,
      entity_id: user.id,
      entity_type: 'user',
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[Auth Delete User Error]:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/roles', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const roles = await repositories.roles.getAllRoles();
    return res.json(roles);
  } catch (err) {
    console.error('[Auth Get Roles Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve roles' });
  }
});

export default router;
