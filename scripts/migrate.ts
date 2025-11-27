import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import pool from '../lib/db';

config();

async function runMigrations() {
  console.log('Running migrations...');
  const migrationFile = join(__dirname, '../migrations/001_initial_schema.sql');
  const sql = readFileSync(migrationFile, 'utf8');

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('Migrations completed successfully.');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

