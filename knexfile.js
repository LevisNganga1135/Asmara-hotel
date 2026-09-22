// knexfile.js
// Knex migration configuration file supporting MySQL and PostgreSQL
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || '';
const isPg = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://') || process.env.DB_CLIENT === 'pg';
const dbClient = isPg ? 'pg' : (process.env.DB_CLIENT || 'mysql2');
const isPlaceholderUrl = dbUrl.includes('postgres:password@localhost') || dbUrl.includes('postgres:password@127.0.0.1');

function getConnectionConfig() {
  if (dbUrl && !isPlaceholderUrl) {
    return dbUrl;
  }

  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || (isPg ? '5432' : '3306'), 10),
    user: process.env.DB_USER || (isPg ? 'postgres' : 'root'),
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
    database: process.env.DB_NAME || 'hotel_db',
  };

  // multipleStatements is a MySQL-only option — the pg driver does not
  // recognise it and may throw on some versions. Only include it for mysql2.
  if (!isPg) {
    config.multipleStatements = true;
  }

  return config;
}

const sharedMigrationConfig = {
  directory: './db/migrations',
  tableName: 'knex_migrations'
};

module.exports = {
  development: {
    client: dbClient,
    connection: getConnectionConfig(),
    migrations: sharedMigrationConfig
  },
  test: {
    // Mirrors development — override DATABASE_URL or DB_* vars in CI as needed.
    client: dbClient,
    connection: getConnectionConfig(),
    migrations: sharedMigrationConfig
  },
  production: {
    client: dbClient,
    connection: process.env.DATABASE_URL || getConnectionConfig(),
    migrations: sharedMigrationConfig
  }
};



