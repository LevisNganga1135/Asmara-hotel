// db/db.js
// Centralized MySQL & PostgreSQL connection pool management using Knex

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
    console.error(`❌ Error: Knex configuration not found for environment: ${environment}`);
    process.exit(1);
}

// Optimize connection pool limits and fast fail timeouts
const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10);
config.pool = {
    min: 0,
    max: connectionLimit,
    acquireTimeoutMillis: 4000,
    createTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
    ...config.pool
};

if (typeof config.connection === 'object' && config.connection !== null) {
    config.connection.connectionLimit = connectionLimit;
}

const db = knex(config);

// Test database connection on startup
db.raw('SELECT NOW() as now')
    .then((result) => {
        const time = Array.isArray(result) && Array.isArray(result[0]) ? result[0][0].now : (result.rows ? result.rows[0].now : 'connected');
        console.log(`✅ Connected to ${config.client} database via Knex successfully at: ${time}`);
    })
    .catch((err) => {
        console.warn('⚠️ Knex database connection failed (check your database server / credentials):', err.message);
    });

// Fallback compatibility method for raw query execution (emulating pg driver result)
db.query = async (text, params = []) => {
    const isPg = config.client === 'pg';
    const sql = isPg ? text : text.replace(/\$\d+/g, '?');
    const result = await db.raw(sql, params);
    
    if (isPg) {
        return { rows: result.rows || [], rowCount: result.rowCount || 0 };
    }
    
    const rows = result[0];
    if (Array.isArray(rows)) {
        return { rows, rowCount: rows.length };
    } else {
        return { rows: [], rowCount: rows.affectedRows || 0 };
    }
};

// Fallback connection pool helpers
db.connect = async () => {
    return {
        query: (text, params) => db.query(text, params),
        release: () => {}
    };
};

db.end = () => db.destroy();

module.exports = db;

