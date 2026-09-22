// tests/setup.js
// Runs before every test file (via jest.config.js setupFiles).
// Sets NODE_ENV=test so that:
//   - knexfile.js uses the 'test' config block
//   - server.js and middleware skip production-only guards
//   - JWT fail-fast checks are bypassed cleanly when using a test secret

process.env.NODE_ENV = 'test';

// Set a safe test JWT secret so the fail-fast check in auth middleware passes.
// Override in individual test files if needed.
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test_jwt_secret_do_not_use_in_production_32chars!';
}

// Set a safe registration secret for tests that exercise the register endpoint.
if (!process.env.REGISTRATION_SECRET) {
    process.env.REGISTRATION_SECRET = 'test_registration_secret';
}
