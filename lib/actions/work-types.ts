"use server"

import { db } from "@/lib/db"
import { workTypes } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function ensureWorkType(name: string) {
  const nameTrimmed = name.trim()
  if (!nameTrimmed) return
  const existing = await db.select().from(workTypes).where(eq(workTypes.name, nameTrimmed)).get()
  if (!existing) {
    await db.insert(workTypes).values({ name: nameTrimmed }).run()
  }
}

export async function listWorkTypes(): Promise<{ id: number; name: string }[]> {
  return await db.select({ id: workTypes.id, name: workTypes.name }).from(workTypes).orderBy(workTypes.name).all()
}

export async function distinctEditingTypes(): Promise<string[]> {
  const rows = await db.all<{ editing_type: string }>("SELECT DISTINCT editing_type FROM work_entries ORDER BY editing_type")
  return rows.map((r) => r.editing_type)
}
