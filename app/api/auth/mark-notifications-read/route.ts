import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.redirect(new URL("/login", req.url))

  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, Number(session.user.id)))
    .run()

  return NextResponse.redirect(new URL("/hirer", req.url))
}
