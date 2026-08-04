import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries } from "@/lib/db/schema"
import { uploadImage } from "@/lib/upload"
import { ensureWorkType } from "@/lib/actions/work-types"
import { createNotification } from "@/lib/actions/notifications"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "retoucher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const title = formData.get("title") as string
    const originalFilename = formData.get("originalFilename") as string
    const editingType = formData.get("editingType") as string
    const price = Number(formData.get("price"))
    const expectedDelivery = formData.get("expectedDelivery") as string
    const hirerId = formData.get("hirerId") ? Number(formData.get("hirerId")) : null
    const folder = formData.get("folder") as string | null
    const privateNotes = formData.get("privateNotes") as string | null
    const imageFile = formData.get("image") as File | null

    if (!title || !originalFilename || !editingType || isNaN(price) || !expectedDelivery) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    await ensureWorkType(editingType)

    let imagePath: string | null = null
    if (imageFile && imageFile.size > 0) {
      imagePath = await uploadImage(imageFile)
    }

    const values: any = {
      title,
      originalFilename,
      editingType,
      price,
      expectedDelivery,
      retoucherId: Number(session.user.id),
      imagePath,
    }
    if (hirerId) values.hirerId = hirerId
    if (folder) values.folder = folder
    if (privateNotes) values.privateNotes = privateNotes

    await db.insert(workEntries).values(values).run()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[bulk-entry]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
