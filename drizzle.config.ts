import { defineConfig } from "drizzle-kit"

const isTurso = !!process.env.TURSO_DB_URL

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: isTurso ? process.env.TURSO_DB_URL! : "./data/sqlite.db",
  },
})
