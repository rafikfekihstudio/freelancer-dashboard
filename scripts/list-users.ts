import { db } from "../lib/db"
import { users } from "../lib/db/schema"

const all = await db.select().from(users).all()
for (const u of all) {
  console.log(`${u.id}\t${u.email}\t${u.name}\t${u.role}`)
}
