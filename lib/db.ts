import { config } from 'dotenv';
import { Pool } from 'pg';

// Load env vars before creating pool
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;

