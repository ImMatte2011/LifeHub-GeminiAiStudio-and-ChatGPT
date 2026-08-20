import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.js';

// Add global connection pool caching to persist across hot-reloads in development
declare global {
  // eslint-disable-next-line no-var
  var _postgresPool: Pool | undefined;
}

export function getPoolConfig(): PoolConfig {
  if (process.env.SQL_HOST) {
    const host = process.env.SQL_HOST;
    const port = parseInt(process.env.SQL_PORT || process.env.POSTGRES_PORT || '5432', 10);
    const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || process.env.POSTGRES_USER || 'ai_studio_app_user';
    const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD || '';
    const database = process.env.SQL_DB_NAME || process.env.POSTGRES_DB || 'cloud_sql_development_database';

    return {
      host,
      port,
      user,
      password,
      database,
      max: 10,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' && process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('@postgres:')) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 10000,
    };
  }

  const host = process.env.POSTGRES_HOST || '127.0.0.1';
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
  const user = process.env.POSTGRES_USER || 'lifehub';
  const password = process.env.POSTGRES_PASSWORD || 'lifehub_secret_pass';
  const database = process.env.POSTGRES_DB || 'lifehub_primary';

  return {
    host,
    port,
    user,
    password,
    database,
    max: 10,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' && process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
}

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const config = getPoolConfig();
    global._postgresPool = new Pool(config);

    // Prevent unhandled pool-level errors on idle clients
    global._postgresPool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Warning] Idle client connection issue:', err.message);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the singleton pool instance
export const pool = createPool();

// Initialize Drizzle ORM client with schema
export const db = drizzle(pool, { schema });

// Helper to safely test PostgreSQL connectivity without throwing uncaught exceptions
export async function checkPostgresConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT version()');
      return { connected: true, version: res.rows[0]?.version };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Unable to connect to PostgreSQL' };
  }
}

export { schema };
