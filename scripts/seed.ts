import bcrypt from "bcryptjs"
import { db } from "../lib/db"
import { users } from "../lib/db/schema"
import { eq } from "drizzle-orm"

async function seed() {
  const existing = await db.select().from(users).where(eq(users.email, "admin@dashboard.com")).get()

  if (existing) {
    console.log("Admin user already exists.")
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash("admin123", 10)

  await db.insert(users).values({
    email: "admin@dashboard.com",
    name: "Admin",
    password: hashedPassword,
    role: "admin",
  }).run()

  console.log("Seed complete. Admin login: admin@dashboard.com / admin123")
  process.exit(0)
}

seed()
