import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { databaseConfig } from '../config/database';
import type { SqlQuery } from './sql';

type QueryInput = string | SqlQuery;
type QueryParams = readonly unknown[];

const pool = new Pool(databaseConfig);

pool.on('error', (error: Error) => {
  console.error('Unexpected database client error', error);
});

const normalizeQuery = (query: QueryInput, params?: QueryParams): SqlQuery => {
  if (typeof query === 'string') {
    return { text: query, values: params ? [...params] : [] };
  }

  if (params && params.length > 0) {
    throw new Error('Cannot pass parameters with a SqlQuery object.');
  }

  return query;
};

const query = async <T extends QueryResultRow>(
  queryInput: QueryInput,
  params?: QueryParams
): Promise<QueryResult<T>> => {
  const { text, values } = normalizeQuery(queryInput, params);
  return pool.query<T>(text, values);
};

const one = async <T extends QueryResultRow>(queryInput: QueryInput, params?: QueryParams): Promise<T> => {
  const result = await query<T>(queryInput, params);
  if (result.rows.length === 0) {
    throw new Error('Expected one row, found none.');
  }
  const row = result.rows[0];
  if (!row) {
    throw new Error('Expected one row, found none.');
  }
  return row;
};

const maybeOne = async <T extends QueryResultRow>(queryInput: QueryInput, params?: QueryParams): Promise<T | null> => {
  const result = await query<T>(queryInput, params);
  return result.rows[0] ?? null;
};

const many = async <T extends QueryResultRow>(queryInput: QueryInput, params?: QueryParams): Promise<T[]> => {
  const result = await query<T>(queryInput, params);
  return result.rows;
};

const withClient = async <T>(handler: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();
  try {
    return await handler(client);
  } finally {
    client.release();
  }
};

const transaction = async <T>(handler: (client: PoolClient) => Promise<T>): Promise<T> => {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const result = await handler(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  });
};

const close = async (): Promise<void> => {
  await pool.end();
};

export const db = {
  query,
  one,
  maybeOne,
  many,
  withClient,
  transaction,
  close,
  pool,
};

export type { PoolClient };
