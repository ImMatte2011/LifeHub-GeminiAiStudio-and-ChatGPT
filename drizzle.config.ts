import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const sqlHost = process.env.SQL_HOST || process.env.POSTGRES_HOST || '127.0.0.1';
const sqlPort = parseInt(process.env.SQL_PORT || process.env.POSTGRES_PORT || '5432', 10);
const sqlDbName = process.env.SQL_DB_NAME || process.env.POSTGRES_DB || 'lifehub_primary';
const user = process.env.SQL_USER || process.env.SQL_ADMIN_USER || process.env.POSTGRES_USER || 'lifehub';
const password = process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD || 'lifehub_secret_pass';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    host: sqlHost,
    port: sqlPort,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
