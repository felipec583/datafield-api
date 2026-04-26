import pg from "pg";
import { DB_CONFIG } from "./consts.js";
export const pool = new pg.Pool({
  ...DB_CONFIG,
  ssl: { rejectUnauthorized: true },
});
