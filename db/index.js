import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { rncLocus, rncLocusMembers } from '../models/schema.js';

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

export const db = drizzle(pool, {
  rncLocus,
  rncLocusMembers,
});
