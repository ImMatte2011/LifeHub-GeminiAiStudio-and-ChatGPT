import assert from 'assert';
import { db, getSecretKey, generateCryptoToken, verifyCryptoToken } from '../server/db/database.js';
import {
  authenticateRequest,
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from '../server/middleware/auth.js';

// Simple lightweight test runner
let passedTests = 0;
let failedTests = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
  }
}

// Mock Express Request / Response helpers
function createMockRequest(authHeader?: string): AuthenticatedRequest {
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  return {
    headers,
    header(name: string) {
      return headers[name.toLowerCase()];
    },
    get(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as AuthenticatedRequest;
}

function createMockResponse() {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    setHeader(key: string, val: string) {
      res.headers[key] = val;
      return res;
    },
  };
  return res;
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  LifeHub Authentication & User Isolation Test Suite');
  console.log('======================================================\n');

  // Register test users in database matching CoreUser interface
  db.users.set('user_alice', {
    id: 'user_alice',
    username: 'alice',
    email: 'alice@lifehub.local',
    password_hash: 'hash_alice',
    full_name: 'Alice Developer',
    role_id: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  db.users.set('user_bob', {
    id: 'user_bob',
    username: 'bob',
    email: 'bob@lifehub.local',
    password_hash: 'hash_bob',
    full_name: 'Bob Manager',
    role_id: 'editor',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  db.users.set('user_charlie', {
    id: 'user_charlie',
    username: 'charlie',
    email: 'charlie@lifehub.local',
    password_hash: 'hash_charlie',
    full_name: 'Charlie Test',
    role_id: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  db.users.set('user_regular', {
    id: 'user_regular',
    username: 'regular',
    email: 'reg@test.com',
    password_hash: 'hash_reg',
    full_name: 'Regular User',
    role_id: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  db.users.set('user_admin_test', {
    id: 'user_admin_test',
    username: 'admin_test',
    email: 'admin@test.com',
    password_hash: 'hash_admin',
    full_name: 'Admin User',
    role_id: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
  });

  // Ensure multi_user_enabled is true for test isolation verification
  if (!db.instanceConfig.settings) {
    db.instanceConfig.settings = {};
  }
  db.instanceConfig.settings.multi_user_enabled = true;

  // Test 1: Secure Secret Key Management
  await test('1. Server Secret Key is securely generated, persistent and high-entropy', () => {
    const secret = getSecretKey();
    assert.strictEqual(typeof secret, 'string', 'Secret key must be a string');
    assert.ok(secret.length >= 64, 'Secret key must have at least 64 hex characters (256+ bits entropy)');
    // Test that the secret is not the old insecure hardcoded default
    assert.notStrictEqual(secret, 'lifehub_default_insecure_development_secret_2026_x89f_core_v1', 'Must not use hardcoded secret');
  });

  // Test 2: Stateless Token Generation and Verification
  await test('2. Generates distinct cryptographic tokens for different users', () => {
    const tokenAlice = generateCryptoToken('user_alice', 'alice');
    const tokenBob = generateCryptoToken('user_bob', 'bob');

    assert.notStrictEqual(tokenAlice, tokenBob, 'Tokens for different users must be unique');

    const verifyAlice = verifyCryptoToken(tokenAlice);
    assert.ok(verifyAlice.valid, 'Alice token must verify successfully');
    assert.strictEqual(verifyAlice.payload?.sub, 'user_alice');
    assert.strictEqual(verifyAlice.payload?.user, 'alice');

    const verifyBob = verifyCryptoToken(tokenBob);
    assert.ok(verifyBob.valid, 'Bob token must verify successfully');
    assert.strictEqual(verifyBob.payload?.sub, 'user_bob');
    assert.strictEqual(verifyBob.payload?.user, 'bob');
  });

  // Test 3: Tampered Token Rejection
  await test('3. Rejects tampered tokens or tokens signed with different secret', () => {
    const validToken = generateCryptoToken('user_charlie', 'charlie');
    const parts = validToken.split('.');
    
    // Tamper with payload to elevate privileges or change user ID
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'user_admin', user: 'admin' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;

    const tamperedResult = verifyCryptoToken(tamperedToken);
    assert.strictEqual(tamperedResult.valid, false, 'Tampered token signature must be rejected');

    const forgedToken = 'invalid.signature.token';
    const forgedResult = verifyCryptoToken(forgedToken);
    assert.strictEqual(forgedResult.valid, false, 'Malformed token must be rejected');
  });

  // Test 4: Middleware Populates Request Context Statelessly
  await test('4. Authenticate middleware attaches user to request without mutating global state', async () => {
    const tokenAlice = generateCryptoToken('user_alice', 'alice');
    const reqAlice = createMockRequest(`Bearer ${tokenAlice}`);
    const resAlice = createMockResponse();

    let nextCalledAlice = false;
    authenticateRequest(reqAlice, resAlice, () => {
      nextCalledAlice = true;
    });

    assert.ok(nextCalledAlice, 'Next middleware should be called');
    assert.strictEqual(reqAlice.userId, 'user_alice', 'req.userId must be derived from token');
    assert.strictEqual(reqAlice.user?.email, 'alice@lifehub.local');
    assert.strictEqual(reqAlice.user?.full_name, 'Alice Developer');
    assert.strictEqual(reqAlice.userRole, 'user');
    assert.strictEqual(reqAlice.isAdmin, false);
  });

  // Test 5: Concurrent Requests Do NOT Contaminate or Share Session/Identity
  await test('5. Concurrent interleaved requests from multiple users maintain strict isolation', async () => {
    // Create 3 distinct users and register them
    const users = [
      { id: 'user_u1', username: 'u1', email: 'u1@test.com', full_name: 'User 1', role: 'user' },
      { id: 'user_u2', username: 'u2', email: 'u2@test.com', full_name: 'User 2', role: 'editor' },
      { id: 'user_u3', username: 'u3', email: 'u3@test.com', full_name: 'User 3 (Admin)', role: 'admin' },
    ];

    for (const u of users) {
      db.users.set(u.id, {
        id: u.id,
        username: u.username,
        email: u.email,
        password_hash: 'hash_' + u.id,
        full_name: u.full_name,
        role_id: u.role,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }

    const tokens = users.map((u) => generateCryptoToken(u.id, u.username));

    // Simulate 60 concurrent interleaved requests running asynchronously in parallel
    const requestPromises = Array.from({ length: 60 }, async (_, index) => {
      const userIndex = index % 3;
      const expectedUser = users[userIndex];
      const token = tokens[userIndex];

      const req = createMockRequest(`Bearer ${token}`);
      const res = createMockResponse();

      // Artificial random async delay to simulate network/IO concurrency interleaving
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 20));

      let nextDone = false;
      authenticateRequest(req, res, () => {
        nextDone = true;
      });

      assert.ok(nextDone, 'Next must be called');
      assert.strictEqual(req.userId, expectedUser.id, `Request ${index}: Expected userId ${expectedUser.id} but got ${req.userId}`);
      assert.strictEqual(req.user?.username, expectedUser.username, `Request ${index}: Expected username ${expectedUser.username} but got ${req.user?.username}`);
      assert.strictEqual(req.userRole, expectedUser.role, `Request ${index}: Expected userRole ${expectedUser.role} but got ${req.userRole}`);
      assert.strictEqual(req.isAdmin, expectedUser.role === 'admin', `Request ${index}: Admin flag mismatch`);
    });

    await Promise.all(requestPromises);
  });

  // Test 6: Route Guards (requireAuth & requireAdmin)
  await test('6. Route guards strictly enforce authentication and authorization rules', () => {
    // 6a. Unauthenticated request blocked by requireAuth
    const unauthReq = createMockRequest();
    const unauthRes = createMockResponse();
    let authNextCalled = false;
    
    authenticateRequest(unauthReq, unauthRes, () => {});
    requireAuth(unauthReq, unauthRes, () => { authNextCalled = true; });

    assert.strictEqual(authNextCalled, false, 'Unauthenticated request must not pass requireAuth');
    assert.strictEqual(unauthRes.statusCode, 401, 'Unauthenticated request must return 401');

    // 6b. Regular user blocked by requireAdmin
    const tokenUser = generateCryptoToken('user_regular', 'regular');
    const userReq = createMockRequest(`Bearer ${tokenUser}`);
    const userRes = createMockResponse();
    let adminNextCalled = false;

    authenticateRequest(userReq, userRes, () => {});
    requireAdmin(userReq, userRes, () => { adminNextCalled = true; });

    assert.strictEqual(adminNextCalled, false, 'Non-admin user must not pass requireAdmin');
    assert.strictEqual(userRes.statusCode, 403, 'Non-admin user must receive 403 Forbidden');

    // 6c. Admin user passes requireAdmin
    const tokenAdmin = generateCryptoToken('user_admin_test', 'admin_test');
    const adminReq = createMockRequest(`Bearer ${tokenAdmin}`);
    const adminRes = createMockResponse();
    let adminPassed = false;

    authenticateRequest(adminReq, adminRes, () => {});
    requireAdmin(adminReq, adminRes, () => { adminPassed = true; });

    assert.ok(adminPassed, 'Admin user must pass requireAdmin');
  });

  // Test 7: Entity Ownership and Audit Trail attribution
  await test('7. Entity creation and audit logging attributes directly to authenticated user', () => {
    const entityId = 'entity_test_' + Date.now();
    const testUserId = 'user_audited_99';
    
    // Register entity with explicit authenticated user ID
    const entity = db.registerEntity(entityId, 'test_item', 'Test Item Title', testUserId);
    assert.strictEqual(entity.created_by, testUserId, 'Entity creator must match authenticated request user ID');

    // Log audit under test user
    db.logAudit(testUserId, 'CREATE', 'Created test item', entityId, 'test_item');
    const latestAudit = db.auditLog[0];
    assert.strictEqual(latestAudit.user_id, testUserId, 'Audit log user_id must match authenticated user');
  });

  console.log('\n------------------------------------------------------');
  console.log(`  Tests Completed: ${passedTests + failedTests}`);
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
