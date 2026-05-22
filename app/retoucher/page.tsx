import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, users } from "@/lib/db/schema"
import { eq, sql, like, or, and, gte, lte } from "drizzle-orm"
import { CsvDownloadButton } from "@/components/csv-download"
import { exportWorkEntriesCsv } from "@/lib/actions/export"
import { SearchBar } from "@/components/search-bar"
import { FilterBar } from "@/components/filter-bar"
import { WorkHoverCard } from "@/components/work-hover-card"
import { DeleteEntryButton } from "@/components/delete-entry-button"
import { listWorkTypes } from "@/lib/actions/work-types"
import { folderNotes } from "@/lib/db/schema"
import DashboardShell from "@/components/dashboard-shell"

export default async function RetoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; payment?: string; status?: string; type?: string; from?: string; to?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") redirect("/login")

  const uid = Number(session.user.id)
  const sp = await searchParams
  const q = sp.q?.trim()
  const payment = sp.payment?.trim()
  const status = sp.status?.trim()
  const type = sp.type?.trim()
  const from = sp.from?.trim()
  const to = sp.to?.trim()

  const conditions: any[] = [eq(workEntries.retoucherId, uid)]

  if (q) {
    const pattern = `%${q}%`
    conditions.push(
      or(
        like(workEntries.title, pattern),
        like(workEntries.originalFilename, pattern),
        like(workEntries.editingType, pattern),
        like(workEntries.folder, pattern),
        like(users.name, pattern),
      )
    )
  }
  if (payment) conditions.push(eq(workEntries.paymentStatus, payment as any))
  if (status) conditions.push(eq(workEntries.status, status as any))
  if (type) conditions.push(eq(workEntries.editingType, type))
  if (from) conditions.push(gte(workEntries.createdAt, from))
  if (to) conditions.push(lte(workEntries.createdAt, to + "T23:59:59"))

  const [entries, workTypeList, allNotes] = await Promise.all([
    await db
      .select({
        id: workEntries.id,
        title: workEntries.title,
        originalFilename: workEntries.originalFilename,
        imagePath: workEntries.imagePath,
        editingType: workEntries.editingType,
        price: workEntries.price,
        folder: workEntries.folder,
        expectedDelivery: workEntries.expectedDelivery,
        status: workEntries.status,
        paymentStatus: workEntries.paymentStatus,
        hirerName: users.name,
      })
      .from(workEntries)
      .leftJoin(users, eq(workEntries.hirerId, users.id))
      .where(and(...conditions))
      .orderBy(sql`${workEntries.createdAt} desc`)
      .all(),
    listWorkTypes(),
    await db.select().from(folderNotes).all(),
  ])

  const allTypes = workTypeList.map((t) => t.name)
  const noteMap = Object.fromEntries(allNotes.map((n) => [n.folder, n.content]))

  const totals = await db
    .select({
      billed: sql<number>`coalesce(sum(price), 0)`,
      paid: sql<number>`coalesce(sum(amount_paid), 0)`,
    })
    .from(workEntries)
    .where(eq(workEntries.retoucherId, uid))
    .get()

  const folders = [...new Set(entries.map((e) => e.folder).filter(Boolean))] as string[]

  return (
    <DashboardShell>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">My Work</h1>
        <div className="flex gap-2">
          <CsvDownloadButton label="Download CSV" fetchCsv={exportWorkEntriesCsv} filename="work-entries.csv" />
          <Link href="/retoucher/new" className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors">
            New Work Entry
          </Link>
        </div>
      </div>

      <SearchBar placeholder="Search by title, file, type, folder, hirer..." />

      <FilterBar workTypes={allTypes} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-lg font-bold">${Number(totals?.billed ?? 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Billed</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-lg font-bold">${Number(totals?.paid ?? 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Collected</p>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">{q ? "No matches found." : "No work entries yet."}</p>
      )}

      {q ? (
        <TableSection entries={entries} showPayment />
      ) : (
        <>
          {folders.map((folder) => {
            const folderEntries = entries.filter((e) => e.folder === folder)
            return <FolderSection key={folder} folder={folder} entries={folderEntries} note={noteMap[folder] ?? null} />
          })}
          {entries.filter((e) => !e.folder).length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1">Uncategorized</h2>
              <TableSection entries={entries.filter((e) => !e.folder)} showPayment />
            </section>
          )}
        </>
      )}


    </div>
    </DashboardShell>
  )
}

function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="h-10 w-10 rounded bg-muted" />
  return <img src={src} alt={alt} className="h-10 w-10 rounded object-cover" />
}

function folderPaymentStatus(entries: any[]): { label: string; cls: string } {
  const allPaid = entries.every((e: any) => e.paymentStatus === "paid")
  const anyPaid = entries.some((e: any) => e.paymentStatus === "paid" || e.paymentStatus === "partial")
  if (allPaid) return { label: "paid", cls: "bg-green-100 text-green-700" }
  if (anyPaid) return { label: "partial", cls: "bg-blue-100 text-blue-700" }
  return { label: "unpaid", cls: "bg-gray-100 text-gray-700" }
}

function FolderSection({ folder, entries, note }: { folder: string; entries: any[]; note: string | null }) {
  const ps = folderPaymentStatus(entries)
  const total = entries.reduce((s: number, e: any) => s + e.price, 0)
  const hirerName = entries.find((e: any) => e.hirerName)?.hirerName ?? null
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{folder}</h2>
            <Link href={`/retoucher/new?folder=${encodeURIComponent(folder)}`} className="text-muted-foreground hover:text-foreground text-lg leading-none" title="Add to this folder">+</Link>
          </div>
          {hirerName && <p className="text-xs text-muted-foreground">Retouching for {hirerName}</p>}
          {note && <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 mt-1">{note}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">${total.toFixed(2)}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ps.cls}`}>{ps.label}</span>
        </div>
      </div>
      <div className="border rounded-lg overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Preview</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">File</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Price</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: any) => (
              <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <WorkHoverCard imageSrc={entry.imagePath} editingType={entry.editingType} expectedDelivery={entry.expectedDelivery} hirerName={entry.hirerName}>
                    <Thumb src={entry.imagePath} alt={entry.title} />
                  </WorkHoverCard>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/retoucher/works/${entry.id}`} className="hover:underline font-medium">{entry.title}</Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{entry.originalFilename}</td>
                <td className="px-3 py-2">{entry.editingType}</td>
                <td className="px-3 py-2">${entry.price.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{entry.status}</span>
                </td>
                <td className="px-3 py-2"><DeleteEntryButton entryId={entry.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TableSection({ entries, showPayment }: { entries: any[]; showPayment?: boolean }) {
  return (
    <div className="border rounded-lg overflow-visible">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Preview</th>
            <th className="px-3 py-2 text-left font-medium">Title</th>
            <th className="px-3 py-2 text-left font-medium">File</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">Price</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            {showPayment && <th className="px-3 py-2 text-left font-medium">Payment</th>}
            <th className="px-3 py-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <WorkHoverCard imageSrc={entry.imagePath} editingType={entry.editingType} expectedDelivery={entry.expectedDelivery} hirerName={entry.hirerName}>
                  <Thumb src={entry.imagePath} alt={entry.title} />
                </WorkHoverCard>
              </td>
              <td className="px-3 py-2">
                <Link href={`/retoucher/works/${entry.id}`} className="hover:underline font-medium">{entry.title}</Link>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{entry.originalFilename}</td>
              <td className="px-3 py-2">{entry.editingType}</td>
              <td className="px-3 py-2">${entry.price.toFixed(2)}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{entry.status}</span>
              </td>
              {showPayment && (
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${entry.paymentStatus === "paid" ? "bg-green-100 text-green-700" : entry.paymentStatus === "partial" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{entry.paymentStatus}</span>
                </td>
              )}
              <td className="px-3 py-2"><DeleteEntryButton entryId={entry.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
