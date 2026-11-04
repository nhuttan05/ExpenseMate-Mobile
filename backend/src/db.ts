import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from './config';

export const pool = new Pool({ connectionString: config.DATABASE_URL });

export const query = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> => pool.query<T>(text, values);

export const initializeDatabase = async (): Promise<void> => {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  await pool.query(schema);
};
