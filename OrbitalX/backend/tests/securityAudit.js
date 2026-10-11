// OrbitalX Automated Security & RBAC Audit Test Suite
// Phase 17: Testing + Security Review

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';

async function runSecurityAudit() {
  console.log('====================================================');
  console.log('🛡️ ORBITALX PHASE 17 SECURITY & TESTING AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} - ${details}`);
      failed++;
    }
  }

  // 1. UNAUTHENTICATED ACCESS TEST
  console.log('--- 1. Testing Unauthenticated Route Protections ---');
  try {
    const unauthTelemetry = await fetch(`${API_BASE}/telemetry/latest`);
    assert('Reject unauthenticated /api/telemetry/latest', unauthTelemetry.status === 401, `Got status ${unauthTelemetry.status}`);

    const unauthMissions = await fetch(`${API_BASE}/missions`);
    assert('Reject unauthenticated /api/missions', unauthMissions.status === 401, `Got status ${unauthMissions.status}`);

    const unauthSatellites = await fetch(`${API_BASE}/satellites`);
    assert('Reject unauthenticated /api/satellites', unauthSatellites.status === 401, `Got status ${unauthSatellites.status}`);

    const unauthUsers = await fetch(`${API_BASE}/users`);
    assert('Reject unauthenticated /api/users', unauthUsers.status === 401, `Got status ${unauthUsers.status}`);
  } catch (err) {
    assert('Unauthenticated access test exception', false, err.message);
  }

  // 2. FORGED / INVALID JWT TEST
  console.log('\n--- 2. Testing Forged & Invalid Token Handling ---');
  try {
    const fakeTokenHeaders = { Authorization: 'Bearer forged.token.payload' };
    const forgedReq = await fetch(`${API_BASE}/satellites`, { headers: fakeTokenHeaders });
    assert('Reject forged JWT signature', forgedReq.status === 401 || forgedReq.status === 403, `Got status ${forgedReq.status}`);

    const emptyBearer = await fetch(`${API_BASE}/satellites`, { headers: { Authorization: 'Bearer ' } });
    assert('Reject empty Bearer string', emptyBearer.status === 401, `Got status ${emptyBearer.status}`);
  } catch (err) {
    assert('Forged JWT test exception', false, err.message);
  }

  // 3. NOSQL INJECTION RESISTANCE TEST
  console.log('\n--- 3. Testing NoSQL Query Injection Resistance ---');
  try {
    // Attempt login bypass via MongoDB operator injection
    const injectionLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { "$gt": "" }, password: { "$gt": "" } })
    });
    const injData = await injectionLogin.json();
    assert('Block NoSQL $gt operator injection in login', !injData.success, `API allowed login: ${JSON.stringify(injData)}`);
  } catch (err) {
    assert('NoSQL test exception', false, err.message);
  }

  // 4. AUTHENTICATED ADMIN ACCESS & RBAC TEST
  console.log('\n--- 4. Testing Admin Authentication & RBAC ---');
  let adminToken = '';
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@orbitalx.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert('Admin login credentials valid', loginData.success === true && !!loginData.data?.token);
    adminToken = loginData.data?.token;

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Test access to admin-only user list
    const usersRes = await fetch(`${API_BASE}/users`, { headers: adminHeaders });
    const usersData = await usersRes.json();
    assert('Admin can access /api/users', usersRes.status === 200 && usersData.success === true);

    // Test access to telemetry statistics
    const statsRes = await fetch(`${API_BASE}/telemetry/stats`, { headers: adminHeaders });
    const statsData = await statsRes.json();
    assert('Admin can access /api/telemetry/stats', statsRes.status === 200 && statsData.success === true);

    // Test access to audit logs
    const auditRes = await fetch(`${API_BASE}/audit`, { headers: adminHeaders });
    const auditData = await auditRes.json();
    assert('Admin can access /api/audit', auditRes.status === 200 && auditData.success === true);
  } catch (err) {
    assert('Admin RBAC test exception', false, err.message);
  }

  // 5. INPUT SANITIZATION & RESOURCE VALIDATION
  console.log('\n--- 5. Testing Payload Validation & 404 Handlers ---');
  try {
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    
    // Non-existent resource lookup
    const invalidMission = await fetch(`${API_BASE}/missions/000000000000000000000000`, { headers: adminHeaders });
    assert('Return 404 for non-existent mission ID', invalidMission.status === 404, `Got status ${invalidMission.status}`);

    // Invalid route
    const badRoute = await fetch(`${API_BASE}/non_existent_endpoint_xyz`, { headers: adminHeaders });
    assert('Return 404 for invalid API route', badRoute.status === 404, `Got status ${badRoute.status}`);
  } catch (err) {
    assert('Sanitization test exception', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit();
