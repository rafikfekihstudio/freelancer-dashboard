import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { workEntries, users } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import { generateInvoicePdf } from "@/lib/generate-invoice"

type FolderPayload = {
  name: string
  thumbnail: string
  notes: string
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get("folder")
  const foldersJson = searchParams.get("folders")

  let folderPayloads: FolderPayload[] = []

  if (foldersJson) {
    try {
      folderPayloads = JSON.parse(foldersJson)
    } catch {
      return new NextResponse("Invalid folders param", { status: 400 })
    }
  } else if (folder) {
    folderPayloads = [{ name: folder, thumbnail: searchParams.get("image") ?? "", notes: "" }]
  }

  if (folderPayloads.length === 0) return new NextResponse("Missing folder(s)", { status: 400 })

  const folderNames = folderPayloads.map((f) => f.name)
  const clientName = searchParams.get("clientName") ?? ""
  const clientCompany = searchParams.get("clientCompany") ?? ""
  const clientEmail = searchParams.get("clientEmail") ?? ""
  const clientCountry = searchParams.get("clientCountry") ?? ""
  const invoiceRef = searchParams.get("ref") ?? ""
  const invoiceDate = searchParams.get("date") ?? ""
  const discount = Number(searchParams.get("discount")) || 0
  const showBankDetails = searchParams.get("showBank") !== "false"

  const uid = Number(session.user.id)
  const label = folderNames.length === 1 ? folderNames[0] : "combined"

  if (session.user.role === "retoucher") {
    const entries = await db
      .select({
        id: workEntries.id,
        title: workEntries.title,
        editingType: workEntries.editingType,
        price: workEntries.price,
        imagePath: workEntries.imagePath,
        folder: workEntries.folder,
        hirerName: users.name,
        hirerEmail: users.email,
      })
      .from(workEntries)
      .leftJoin(users, eq(workEntries.hirerId, users.id))
      .where(and(eq(workEntries.retoucherId, uid), inArray(workEntries.folder, folderNames)))
      .all()

    if (entries.length === 0) return new NextResponse("Not found", { status: 404 })

    const total = entries.reduce((s, e) => s + e.price, 0)

    // Merge per-folder thumbnail/notes into entries
    const folderMap = Object.fromEntries(folderPayloads.map((f) => [f.name, f]))
    const enrichedEntries = entries.map((e) => ({
      ...e,
      folderThumbnail: folderMap[e.folder ?? ""]?.thumbnail || e.imagePath,
      folderNotes: folderMap[e.folder ?? ""]?.notes || "",
    }))

    const pdf = await generateInvoicePdf({
      folder: label,
      entries: enrichedEntries,
      total,
      partyName: clientName || entries.find((e) => e.hirerName)?.hirerName || "—",
      partyCompany: clientCompany,
      partyEmail: clientEmail || entries.find((e) => e.hirerEmail)?.hirerEmail || "",
      partyCountry: clientCountry,
      invoiceRef,
      invoiceDate,
      selectedImage: "",
      discount,
      showBankDetails,
      folderPayloads,
    })

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${encodeURIComponent(label)}.pdf"`,
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
        folder: workEntries.folder,
        retoucherName: users.name,
        retoucherEmail: users.email,
      })
      .from(workEntries)
      .innerJoin(users, eq(workEntries.retoucherId, users.id))
      .where(and(eq(workEntries.hirerId, uid), inArray(workEntries.folder, folderNames)))
      .all()

    if (entries.length === 0) return new NextResponse("Not found", { status: 404 })

    const total = entries.reduce((s, e) => s + e.price, 0)

    const folderMap = Object.fromEntries(folderPayloads.map((f) => [f.name, f]))
    const enrichedEntries = entries.map((e) => ({
      ...e,
      folderThumbnail: folderMap[e.folder ?? ""]?.thumbnail || e.imagePath,
      folderNotes: folderMap[e.folder ?? ""]?.notes || "",
    }))

    const pdf = await generateInvoicePdf({
      folder: label,
      entries: enrichedEntries,
      total,
      partyName: clientName || entries.find((e) => e.retoucherName)?.retoucherName || "—",
      partyCompany: clientCompany,
      partyEmail: clientEmail || entries.find((e) => e.retoucherEmail)?.retoucherEmail || "",
      partyCountry: clientCountry,
      invoiceRef,
      invoiceDate,
      selectedImage: "",
      discount,
      showBankDetails,
      folderPayloads,
    })

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${encodeURIComponent(label)}.pdf"`,
      },
    })
  }

  return new NextResponse("Forbidden", { status: 403 })
}
