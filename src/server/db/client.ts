import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../env";
import { createMockDb } from "./mock-client";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
  mockDb: ReturnType<typeof createMockDb> | undefined;
};

function getDbInstance() {
  // Default ke mock in-memory database jika APP_MOCK_DB=true atau jika belum didefinisikan secara eksplisit (prototipe mandiri)
  const isMock = process.env.APP_MOCK_DB !== "false";
  if (isMock) {
    if (!globalForDb.mockDb) {
      globalForDb.mockDb = createMockDb();
    }
    return globalForDb.mockDb;
  }

  const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
  if (env.NODE_ENV !== "production") {
    globalForDb.conn = conn;
  }
  return drizzle(conn, { schema });
}

export const db = getDbInstance() as ReturnType<typeof drizzle<typeof schema>>;
export type Database = typeof db;
