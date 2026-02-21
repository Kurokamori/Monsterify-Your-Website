import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number, name: string): number => {
  if (value === undefined || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: "${value}"`);
  }

  return parsed;
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: "${value}"`);
};

// Auto-detect if SSL should be enabled based on DATABASE_URL or NODE_ENV
const shouldUseSSL = (): boolean => {
  // If DB_SSL is explicitly set, use that value
  if (process.env.DB_SSL !== undefined && process.env.DB_SSL !== '') {
    return parseBoolean(process.env.DB_SSL, false);
  }

  // If DATABASE_URL is provided, assume it's a cloud database that requires SSL
  if (process.env.DATABASE_URL) {
    return true;
  }

  // Otherwise, use SSL in production mode
  return (process.env.NODE_ENV ?? 'development') === 'production';
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseNumber(process.env.PORT, 4888, 'PORT'),

  DATABASE_URL: process.env.DATABASE_URL,

  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseNumber(process.env.DB_PORT, 5432, 'DB_PORT'),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,

  DB_SSL: shouldUseSSL(),
  DB_SSL_REJECT_UNAUTHORIZED: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),

  DB_POOL_MIN: parseNumber(process.env.DB_POOL_MIN, 2, 'DB_POOL_MIN'),
  DB_POOL_MAX: parseNumber(process.env.DB_POOL_MAX, 10, 'DB_POOL_MAX'),
  DB_IDLE_TIMEOUT_MS: parseNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000, 'DB_IDLE_TIMEOUT_MS'),
  DB_CONNECTION_TIMEOUT_MS: parseNumber(
    process.env.DB_CONNECTION_TIMEOUT_MS,
    10000,
    'DB_CONNECTION_TIMEOUT_MS'
  ),
};
