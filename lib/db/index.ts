import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import * as schema from "./schema"
import path from "path"

const isTurso = !!process.env.TURSO_DB_URL

const client = createClient(
  isTurso
    ? { url: process.env.TURSO_DB_URL!, authToken: process.env.TURSO_DB_AUTH_TOKEN }
    : { url: `file:${path.join(process.cwd(), "data", "sqlite.db")}` },
)

if (!isTurso) {
  client.execute("PRAGMA journal_mode = WAL")
  client.execute("PRAGMA foreign_keys = ON")
}

export const db = drizzle(client, { schema })
