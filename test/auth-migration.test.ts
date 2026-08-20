import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express, { Express } from 'express';
import authRouter from '../server/routes/auth.js';
import { authenticateRequest } from '../server/middleware/auth.js';
import { repositories, RepositoryManager, IUserRepository, IRoleRepository, IAuditRepository, ISettingsRepository } from '../server/repositories/index.js';
import { hashPassword, generateCryptoToken, verifyPassword, MIN_PBKDF2_ITERATIONS } from '../server/db/database.js';
import { CoreUser, CoreRole, CoreRolePermission, CoreAuditLog, CoreSetting } from '../server/db/types.js';

console.log('======================================================');
console.log('  LifeHub Core Auth Repository Migration Test Suite');
console.log('======================================================\n');

// ----------------------------------------------------------------------------------
// Test 1: Static Code Inspection of server/routes/auth.ts
// ----------------------------------------------------------------------------------
{
  const authSourcePath = path.join(process.cwd(), 'server', 'routes', 'auth.ts');
  const authSource = fs.readFileSync(authSourcePath, 'utf-8');

  // Verify no forbidden direct db accesses
  const forbiddenPatterns = [
    { pattern: /\bdb\.users\b/, desc: 'db.users' },
    { pattern: /\bdb\.roles\b/, desc: 'db.roles' },
    { pattern: /\bdb\.rolePermissions\b/, desc: 'db.rolePermissions' },
    { pattern: /\bdb\.logAudit\b/, desc: 'db.logAudit' },
    { pattern: /\bdb\.saveToDisk\b/, desc: 'db.saveToDisk' },
    { pattern: /\bdb\.instanceConfig\b/, desc: 'db.instanceConfig' },
    { pattern: /import\s+.*?\bdb\b.*?from\s+['"]\.\.\/db\/database(\.js)?['"]/, desc: 'direct db import' },
  ];

  for (const { pattern, desc } of forbiddenPatterns) {
    assert.equal(
      pattern.test(authSource),
      false,
      `server/routes/auth.ts must NOT contain direct access to ${desc}`
    );
  }

  // Verify repositories is imported and used
  assert.ok(
    authSource.includes('repositories.users'),
    'server/routes/auth.ts must use repositories.users'
  );
  assert.ok(
    authSource.includes('repositories.roles'),
    'server/routes/auth.ts must use repositories.roles'
  );
  assert.ok(
    authSource.includes('repositories.audit'),
    'server/routes/auth.ts must use repositories.audit'
  );
  assert.ok(
    authSource.includes('repositories.settings'),
    'server/routes/auth.ts must use repositories.settings'
  );

  console.log('  ✓ 1. Static check: 0 direct references to db.users, db.roles, db.rolePermissions, db.logAudit, db.saveToDisk in auth.ts');
}

// ----------------------------------------------------------------------------------
// Mock HTTP Runner Helper
// ----------------------------------------------------------------------------------
interface MockResponseResult {
  status: number;
  headers: Record<string, string>;
  body: any;
}

async function simulateRequest(
  app: Express,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options: {
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<MockResponseResult> {
  return new Promise((resolve) => {
    const req: any = {
      method,
      url,
      originalUrl: url,
      baseUrl: '',
      path: url.split('?')[0],
      headers: { ...(options.headers || {}) },
      body: options.body || {},
      query: {},
      params: {},
      get(header: string) {
        return this.headers[header.toLowerCase()];
      },
      header(header: string) {
        return this.headers[header.toLowerCase()];
      },
    };

    const res: any = {
      statusCode: 200,
      headers: {},
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      setHeader(name: string, value: string) {
        this.headers[name.toLowerCase()] = value;
        return this;
      },
      json(data: any) {
        this.body = data;
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
        return this;
      },
      send(data: any) {
        this.body = data;
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
        return this;
      },
      end() {
        resolve({
          status: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
    };

    app(req, res, () => {
      resolve({
        status: res.statusCode,
        headers: res.headers,
        body: res.body,
      });
    });
  });
}

function buildTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(authenticateRequest);
  app.use('/api/core/auth', authRouter);
  return app;
}

// ----------------------------------------------------------------------------------
// Test 2: Full Auth Flow via Repository (Memory Driver)
// ----------------------------------------------------------------------------------
async function runMemoryDriverFlowTests() {
  const app = buildTestApp();

  // 2a. Status endpoint
  const statusRes = await simulateRequest(app, 'GET', '/api/core/auth/status');
  assert.equal(statusRes.status, 200);
  assert.equal(typeof statusRes.body.setup_required, 'boolean');
  assert.equal(typeof statusRes.body.multi_user_enabled, 'boolean');
  console.log('  ✓ 2a. GET /api/core/auth/status returns valid status from repositories');

  // 2b. Setup Admin (or Login if admin already seeded)
  // Let's create a dedicated test user via repositories.users
  const rawPass = 'StrongPass123_Testing!';
  const testUser: CoreUser = {
    id: 'user_repo_test_' + Date.now(),
    username: 'repo_tester',
    email: 'tester@repo.local',
    password_hash: hashPassword(rawPass),
    full_name: 'Repo Tester',
    role_id: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  await repositories.users.create(testUser);

  // 2c. POST /login with correct password
  const loginRes = await simulateRequest(app, 'POST', '/api/core/auth/login', {
    body: {
      username: 'repo_tester',
      password: rawPass,
    },
  });
  assert.equal(loginRes.status, 200, 'Login must succeed with 200 OK');
  assert.ok(loginRes.body.token, 'Login must return token');
  assert.equal(loginRes.body.user.username, 'repo_tester');
  assert.equal(loginRes.body.user.password_hash, undefined, 'Password hash must never be returned');
  const token = loginRes.body.token;
  console.log('  ✓ 2b. POST /api/core/auth/login verifies credentials and issues token via repositories.users');

  // 2d. POST /login with wrong password
  const wrongLoginRes = await simulateRequest(app, 'POST', '/api/core/auth/login', {
    body: {
      username: 'repo_tester',
      password: 'WrongPassword!',
    },
  });
  assert.equal(wrongLoginRes.status, 401, 'Login with wrong password must return 401');
  console.log('  ✓ 2c. POST /api/core/auth/login rejects invalid passwords');

  // 2e. GET /me with Bearer token
  const meRes = await simulateRequest(app, 'GET', '/api/core/auth/me', {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(meRes.status, 200, 'GET /me must return 200 with valid token');
  assert.equal(meRes.body.user.username, 'repo_tester');
  assert.ok(Array.isArray(meRes.body.permissions), 'Permissions must be returned');
  assert.ok(Array.isArray(meRes.body.all_users), 'Admin must receive all_users list');
  console.log('  ✓ 2d. GET /api/core/auth/me retrieves user, role, permissions via repositories');

  // 2f. GET /users (Admin Only)
  const usersRes = await simulateRequest(app, 'GET', '/api/core/auth/users', {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(usersRes.status, 200);
  assert.ok(Array.isArray(usersRes.body));
  const foundUser = usersRes.body.find((u: any) => u.username === 'repo_tester');
  assert.ok(foundUser, 'Created user must appear in users list');
  console.log('  ✓ 2e. GET /api/core/auth/users lists all accounts via repositories.users.getAll()');

  // 2g. POST /users (Create New User)
  const newUsername = 'new_member_' + Math.random().toString(36).substring(2, 6);
  const createUserRes = await simulateRequest(app, 'POST', '/api/core/auth/users', {
    headers: { authorization: `Bearer ${token}` },
    body: {
      username: newUsername,
      email: `${newUsername}@test.local`,
      full_name: 'New Member',
      role_id: 'member',
      password: 'MemberPass123!',
    },
  });
  assert.equal(createUserRes.status, 200);
  assert.equal(createUserRes.body.username, newUsername);
  const createdId = createUserRes.body.id;
  console.log('  ✓ 2f. POST /api/core/auth/users persists new account via repositories.users.create()');

  // 2h. PUT /users/:id (Update User)
  const updateUserRes = await simulateRequest(app, 'PUT', `/api/core/auth/users/${createdId}`, {
    headers: { authorization: `Bearer ${token}` },
    body: {
      full_name: 'Updated Member Name',
      is_active: false,
    },
  });
  assert.equal(updateUserRes.status, 200);
  assert.equal(updateUserRes.body.full_name, 'Updated Member Name');
  assert.equal(updateUserRes.body.is_active, false);
  console.log('  ✓ 2g. PUT /api/core/auth/users/:id updates account via repositories.users.update()');

  // 2i. DELETE /users/:id
  const deleteUserRes = await simulateRequest(app, 'DELETE', `/api/core/auth/users/${createdId}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(deleteUserRes.status, 200);
  assert.equal(deleteUserRes.body.success, true);
  console.log('  ✓ 2h. DELETE /api/core/auth/users/:id removes account via repositories.users.delete()');

  // 2j. GET /roles
  const rolesRes = await simulateRequest(app, 'GET', '/api/core/auth/roles', {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(rolesRes.status, 200);
  assert.ok(Array.isArray(rolesRes.body));
  assert.ok(rolesRes.body.some((r: any) => r.id === 'admin'));
  console.log('  ✓ 2i. GET /api/core/auth/roles retrieves system roles via repositories.roles.getAllRoles()');

  // 2k. POST /logout
  const logoutRes = await simulateRequest(app, 'POST', '/api/core/auth/logout', {
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(logoutRes.status, 200);
  assert.equal(logoutRes.body.success, true);
  console.log('  ✓ 2j. POST /api/core/auth/logout records audit event via repositories.audit.log()');
}

// ----------------------------------------------------------------------------------
// Test 3: Verification with Custom/Mock Repository (Strict Zero db Dependency)
// ----------------------------------------------------------------------------------
async function runRepositoryIsolationTests() {
  // Create an isolated mock user repository to prove auth routes interact solely with repositories
  const customStore = new Map<string, CoreUser>();
  const auditLogsLogged: CoreAuditLog[] = [];

  const mockUserRepo: IUserRepository = {
    async getById(id: string) {
      return customStore.get(id) || null;
    },
    async getByUsername(username: string) {
      for (const u of customStore.values()) {
        if (u.username.toLowerCase() === username.toLowerCase()) return u;
      }
      return null;
    },
    async getByEmail(email: string) {
      for (const u of customStore.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      return null;
    },
    async getAll() {
      return Array.from(customStore.values());
    },
    async create(user: CoreUser) {
      customStore.set(user.id, user);
      return user;
    },
    async update(id: string, updates: Partial<CoreUser>) {
      const user = customStore.get(id);
      if (!user) return null;
      Object.assign(user, updates);
      return user;
    },
    async delete(id: string) {
      return customStore.delete(id);
    },
  };

  const mockAuditRepo: IAuditRepository = {
    async log(entry) {
      const item: CoreAuditLog = {
        ...entry,
        id: 'audit_mock_' + Date.now(),
        timestamp: new Date().toISOString(),
      };
      auditLogsLogged.push(item);
      return item;
    },
    async getAll() {
      return auditLogsLogged;
    },
    async getByEntity(entityId: string) {
      return auditLogsLogged.filter((a) => a.entity_id === entityId);
    },
    async getByUser(userId: string) {
      return auditLogsLogged.filter((a) => a.user_id === userId);
    },
  };

  // Swap repositories temporarily
  const originalUserRepo = repositories.users;
  const originalAuditRepo = repositories.audit;
  repositories.users = mockUserRepo;
  repositories.audit = mockAuditRepo;

  try {
    const app = buildTestApp();

    // Register a user strictly in mockUserRepo (NOT in db.users)
    const customPass = 'CustomRepoPass_2026!';
    const isolatedUser: CoreUser = {
      id: 'user_isolated_99',
      username: 'isolated_user',
      email: 'isolated@custom.mock',
      password_hash: hashPassword(customPass),
      full_name: 'Isolated User',
      role_id: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    await repositories.users.create(isolatedUser);

    // Verify login finds the user exclusively through mockUserRepo
    const loginRes = await simulateRequest(app, 'POST', '/api/core/auth/login', {
      body: {
        username: 'isolated_user',
        password: customPass,
      },
    });

    assert.equal(loginRes.status, 200, 'Login must succeed using custom repository');
    assert.equal(loginRes.body.user.username, 'isolated_user');
    assert.ok(loginRes.body.token);

    // Verify audit log was recorded through mockAuditRepo
    assert.ok(
      auditLogsLogged.some((l) => l.action === 'LOGIN' && l.username === 'isolated_user'),
      'Audit log must be registered in mock audit repository'
    );

    // Verify user update on login (last_login updated in mockUserRepo)
    const updatedUser = await mockUserRepo.getById('user_isolated_99');
    assert.ok(updatedUser?.last_login, 'last_login must be updated in custom repository');

    console.log('  ✓ 3. Isolated Repository Test: Auth routes operate 100% through the repository layer with ZERO dependency on in-memory db tables');
  } finally {
    // Restore original repos
    repositories.users = originalUserRepo;
    repositories.audit = originalAuditRepo;
  }
}

async function main() {
  repositories.setDriver('memory');
  await runMemoryDriverFlowTests();
  await runRepositoryIsolationTests();
  console.log('\n------------------------------------------------------');
  console.log('  All Core Auth Migration Tests Passed Successfully');
  console.log('------------------------------------------------------\n');
}

main().catch((err) => {
  console.error('Core Auth Migration Test Failed:', err);
  process.exit(1);
});
