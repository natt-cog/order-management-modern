import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/ordermgmt";
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };
const sql = globalForDb.sql ?? postgres(url, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
