// jest.config.js
// Jest configuration for the Asmara Hotel API test suite.
//
// Key settings:
//  - testEnvironment: 'node'  — no browser globals (avoids JSDOM overhead)
//  - NODE_ENV=test            — tells knexfile to use the 'test' config and
//                               lets other code gate on the test environment
//  - testMatch               — only runs files under the /tests directory
//  - collectCoverageFrom     — coverage reported for all controller, service,
//                               middleware, and route files

'use strict';

/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',

    // Force NODE_ENV=test so Knex picks the right config entry and modules
    // that check NODE_ENV don't apply production-only restrictions.
    testEnvironmentOptions: {},
    globalSetup: undefined,

    // Set environment variables before each test file is loaded
    // (equivalent to prepending NODE_ENV=test to the jest command)
    setupFiles: ['<rootDir>/tests/setup.js'],

    // Only pick up files inside the tests/ directory
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
        '<rootDir>/tests/**/*.spec.js'
    ],

    // Coverage: include all backend source files, exclude migrations and seeds
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middleware/**/*.js',
        'routes/**/*.js',
        'constants/**/*.js',
        '!**/node_modules/**',
        '!db/migrations/**',
        '!db/seed*.js',
        '!db/init-db.js'
    ],

    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Show individual test results
    verbose: true,

    // Time out individual tests after 15 s (useful for DB tests)
    testTimeout: 15000
};
