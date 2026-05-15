import bcrypt from "bcryptjs"
import { db } from "../lib/db"
import { users, workEntries, payments, comments } from "../lib/db/schema"
import { eq } from "drizzle-orm"

async function demoSeed() {
  const existing = await db.select().from(users).where(eq(users.email, "admin@dashboard.com")).get()
  if (existing) {
    console.log("Database already has data. Skipping demo seed.")
    process.exit(0)
  }

  const hash = await bcrypt.hash("password123", 10)
  const adminHash = await bcrypt.hash("admin123", 10)

  await db.insert(users).values({ email: "admin@dashboard.com", name: "Admin", password: adminHash, role: "admin" }).run()
  await db.insert(users).values({ email: "jane@retoucher.com", name: "Jane Retoucher", password: hash, role: "retoucher", avatarUrl: null }).run()
  await db.insert(users).values({ email: "mike@retoucher.com", name: "Mike Retoucher", password: hash, role: "retoucher", avatarUrl: null }).run()
  await db.insert(users).values({ email: "alice@agency.com", name: "Alice Creative Agency", password: hash, role: "hirer" }).run()
  await db.insert(users).values({ email: "bob@studio.com", name: "Bob Photography Studio", password: hash, role: "hirer" }).run()

  const jane = await db.select().from(users).where(eq(users.email, "jane@retoucher.com")).get()!
  const mike = await db.select().from(users).where(eq(users.email, "mike@retoucher.com")).get()!
  const alice = await db.select().from(users).where(eq(users.email, "alice@agency.com")).get()!
  const bob = await db.select().from(users).where(eq(users.email, "bob@studio.com")).get()!

  const today = new Date()

  const entries = [
    { retoucher: jane, hirer: alice, title: "Product Shot Retouch", file: "product_01.tif", type: "Color Grading", price: 45, folder: "Alice Agency — Spring Catalog", delivery: offset(today, 3), status: "completed" as const, payment: "paid" as const, paid: true, note: "Client wants warmer tone next time" },
    { retoucher: jane, hirer: alice, title: "Model Portrait Cleanup", file: "portrait_02.tif", type: "Skin Retouching", price: 60, folder: "Alice Agency — Spring Catalog", delivery: offset(today, 3), status: "completed" as const, payment: "paid" as const, paid: true, note: null },
    { retoucher: jane, hirer: alice, title: "Background Replacement", file: "bg_03.tif", type: "Compositing", price: 35, folder: "Alice Agency — Spring Catalog", delivery: offset(today, 3), status: "completed" as const, payment: "paid" as const, paid: true, note: null },
    { retoucher: jane, hirer: bob, title: "Wedding Album Set", file: "wedding_01.raw", type: "Color Grading", price: 120, folder: "Bob Studio — June Weddings", delivery: offset(today, 10), status: "in-progress" as const, payment: "partial" as const, paid: false, note: "Waiting for RAW files from client" },
    { retoucher: jane, hirer: bob, title: "Bridal Portrait", file: "bridal_02.raw", type: "Skin Retouching", price: 50, folder: "Bob Studio — June Weddings", delivery: offset(today, 10), status: "completed" as const, payment: "paid" as const, paid: true, note: null },
    { retoucher: jane, hirer: bob, title: "Ceremony Wide Shot", file: "ceremony_03.raw", type: "Color Grading", price: 40, folder: "Bob Studio — June Weddings", delivery: offset(today, 10), status: "in-progress" as const, payment: "unpaid" as const, paid: false, note: "Deliver by Friday" },
    { retoucher: mike, hirer: alice, title: "E-commerce Batch", file: "ecom_01.dng", type: "Clipping Path", price: 25, folder: "Alice Agency — Ecom Batch", delivery: offset(today, 5), status: "in-progress" as const, payment: "unpaid" as const, paid: false, note: "Ask about batch discount" },
    { retoucher: mike, hirer: alice, title: "Ghost Mannequin", file: "ecom_02.dng", type: "Clipping Path", price: 30, folder: "Alice Agency — Ecom Batch", delivery: offset(today, 5), status: "in-progress" as const, payment: "unpaid" as const, paid: false, note: null },
    { retoucher: mike, hirer: alice, title: "Shadow Creation", file: "ecom_03.dng", type: "Drop Shadow", price: 20, folder: "Alice Agency — Ecom Batch", delivery: offset(today, 5), status: "completed" as const, payment: "paid" as const, paid: true, note: null },
    { retoucher: jane, hirer: null, title: "Personal Portfolio Piece", file: "art_01.tif", type: "Creative Retouching", price: 100, folder: null, delivery: offset(today, 14), status: "in-progress" as const, payment: "unpaid" as const, paid: false, note: null },
  ]

  for (const e of entries) {
    const result = await db.insert(workEntries).values({
      retoucherId: e.retoucher!.id,
      hirerId: e.hirer?.id ?? null,
      title: e.title,
      originalFilename: e.file,
      editingType: e.type,
      price: e.price,
      folder: e.folder,
      privateNotes: e.note,
      expectedDelivery: e.delivery,
      status: e.status,
      paymentStatus: e.payment,
      amountPaid: e.payment === "paid" ? e.price : e.payment === "partial" ? Math.round(e.price * 0.5) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning({ id: workEntries.id }).get()
  }

  for (const e of entries) {
    const entry = await db.select().from(workEntries).where(eq(workEntries.title, e.title)).get()
    if (!entry) continue

    if (e.payment === "paid") {
      await db.insert(payments).values({ workEntryId: entry.id, amount: e.price, paidAt: offset(today, -5), notes: "Full payment received" }).run()
    } else if (e.payment === "partial") {
      await db.insert(payments).values({ workEntryId: entry.id, amount: Math.round(e.price * 0.5), paidAt: offset(today, -2), notes: "50% deposit" }).run()
    }

    if (e.hirer && e.status === "completed") {
      await db.insert(comments).values({ workEntryId: entry.id, userId: e.hirer.id, content: "Looks great! Please proceed with the next batch." }).run()
    }
  }

  console.log("Demo data seeded!")
  console.log("All passwords (except admin): password123")
  console.log("  Retoucher: jane@retoucher.com")
  console.log("  Retoucher: mike@retoucher.com")
  console.log("  Hirer:     alice@agency.com")
  console.log("  Hirer:     bob@studio.com")
  console.log("  Admin:     admin@dashboard.com / admin123")
  process.exit(0)
}

function offset(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

demoSeed()
