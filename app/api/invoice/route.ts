import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries, users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { generateInvoicePdf } from "@/lib/generate-invoice"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get("folder")
  if (!folder) return new NextResponse("Missing folder", { status: 400 })

  const uid = Number(session.user.id)

  if (session.user.role === "retoucher") {
    const entries = await db
      .select({
        id: workEntries.id,
        title: workEntries.title,
        editingType: workEntries.editingType,
        price: workEntries.price,
        imagePath: workEntries.imagePath,
        hirerId: workEntries.hirerId,
        hirerName: users.name,
        hirerEmail: users.email,
      })
      .from(workEntries)
      .leftJoin(users, eq(workEntries.hirerId, users.id))
      .where(and(eq(workEntries.retoucherId, uid), eq(workEntries.folder, folder)))
      .all()

    if (entries.length === 0) return new NextResponse("Not found", { status: 404 })

    const total = entries.reduce((s, e) => s + e.price, 0)
    const hirerName = entries.find((e) => e.hirerName)?.hirerName ?? "—"
    const hirerEmail = entries.find((e) => e.hirerEmail)?.hirerEmail ?? ""

    const pdf = await generateInvoicePdf({
      folder,
      entries,
      total,
      partyLabel: "BILLED TO",
      partyName: hirerName,
      partyEmail: hirerEmail,
    })

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${encodeURIComponent(folder)}.pdf"`,
      },
    })
  }

  if (session.user.role === "hirer") {
    const entries = await db
      .select({
        id: workEntries.id,
        title: workEntries.title,
        editingType: workEntries.editingType,
        price: workEntries.price,
        imagePath: workEntries.imagePath,
        retoucherId: workEntries.retoucherId,
        retoucherName: users.name,
        retoucherEmail: users.email,
      })
      .from(workEntries)
      .innerJoin(users, eq(workEntries.retoucherId, users.id))
      .where(and(eq(workEntries.hirerId, uid), eq(workEntries.folder, folder)))
      .all()

    if (entries.length === 0) return new NextResponse("Not found", { status: 404 })

    const total = entries.reduce((s, e) => s + e.price, 0)
    const retoucherName = entries.find((e) => e.retoucherName)?.retoucherName ?? "—"
    const retoucherEmail = entries.find((e) => e.retoucherEmail)?.retoucherEmail ?? ""

    const pdf = await generateInvoicePdf({
      folder,
      entries,
      total,
      partyLabel: "BILLED TO",
      partyName: retoucherName,
      partyEmail: retoucherEmail,
    })

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${encodeURIComponent(folder)}.pdf"`,
      },
    })
  }

  return new NextResponse("Forbidden", { status: 403 })
}
