import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, users, notifications } from "@/lib/db/schema"
import { eq, sql, like, or, and, gte, lte } from "drizzle-orm"
import { CsvDownloadButton } from "@/components/csv-download"
import { exportWorkEntriesCsv } from "@/lib/actions/export"
import { Avatar } from "@/components/ui/avatar"
import { SearchBar } from "@/components/search-bar"
import { FilterBar } from "@/components/filter-bar"
import { WorkHoverCard } from "@/components/work-hover-card"
import { DeleteEntryButton } from "@/components/delete-entry-button"
import { listWorkTypes } from "@/lib/actions/work-types"
import { folderNotes } from "@/lib/db/schema"
import { FolderNoteEditor } from "@/components/folder-note-editor"
import DashboardShell from "@/components/dashboard-shell"

export default async function HirerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; payment?: string; status?: string; type?: string; from?: string; to?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "hirer") redirect("/login")

  const uid = Number(session.user.id)
  const sp = await searchParams
  const q = sp.q?.trim()
  const payment = sp.payment?.trim()
  const status = sp.status?.trim()
  const type = sp.type?.trim()
  const from = sp.from?.trim()
  const to = sp.to?.trim()

  const conditions: any[] = [eq(workEntries.hirerId, uid)]

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

  const [entries, workTypeList, notes] = await Promise.all([
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
        retoucherName: users.name,
        retoucherAvatar: users.avatarUrl,
      })
      .from(workEntries)
      .innerJoin(users, eq(workEntries.retoucherId, users.id))
      .where(and(...conditions))
      .orderBy(sql`${workEntries.createdAt} desc`)
      .all(),
    listWorkTypes(),
    await db.select().from(folderNotes).where(eq(folderNotes.userId, uid)).all(),
  ])

  const allTypes = workTypeList.map((t) => t.name)
  const noteMap = Object.fromEntries(notes.map((n) => [n.folder, n.content]))

  const folders = [...new Set(entries.map((e) => e.folder).filter(Boolean))] as string[]

  const unread = (await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, uid))
    .all()).filter((n) => !n.read)

  return (
    <DashboardShell>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Commissioned Work</h1>
        <CsvDownloadButton label="Download CSV" fetchCsv={exportWorkEntriesCsv} filename="commissioned-work.csv" />
      </div>

      {unread.length > 0 && <NotificationsSection notifications={unread} />}

      <SearchBar placeholder="Search by title, file, type, folder, retoucher..." />

      <FilterBar workTypes={allTypes} />

      {entries.length === 0 && (
        <p className="text-muted-foreground py-8 text-center">{q ? "No matches found." : "No work commissioned yet."}</p>
      )}

      {q ? (
        <HirerTable entries={entries} showPayment />
      ) : (
        <>
          {folders.map((folder) => {
            const folderEntries = entries.filter((e) => e.folder === folder)
            return <HirerFolderSection key={folder} folder={folder} entries={folderEntries} note={noteMap[folder] ?? null} />
          })}
          {entries.filter((e) => !e.folder).length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1">Uncategorized</h2>
              <HirerTable entries={entries.filter((e) => !e.folder)} showPayment />
            </section>
          )}
        </>
      )}


    </div>
    </DashboardShell>
  )
}

function NotificationsSection({ notifications: notes }: { notifications: any[] }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-blue-800">Notifications</h2>
        <MarkReadButton />
      </div>
      <ul className="space-y-1">
        {notes.map((n) => (
          <li key={n.id} className="text-sm text-blue-700">{n.message}</li>
        ))}
      </ul>
    </div>
  )
}

function MarkReadButton() {
  return (
    <form action="/api/auth/mark-notifications-read" method="POST">
      <button type="submit" className="text-xs text-blue-600 hover:text-blue-800 underline">Mark all as read</button>
    </form>
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

function HirerFolderSection({ folder, entries, note }: { folder: string; entries: any[]; note: string | null }) {
  const ps = folderPaymentStatus(entries)
  const total = entries.reduce((s: number, e: any) => s + e.price, 0)
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between border-b pb-1">
        <h2 className="text-lg font-semibold">{folder}</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">${total.toFixed(2)}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ps.cls}`}>{ps.label}</span>
        </div>
      </div>
      <FolderNoteEditor folder={folder} initialContent={note} />
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Preview</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">File</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Price</th>
              <th className="px-3 py-2 text-left font-medium">Retoucher</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: any) => (
              <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <WorkHoverCard imageSrc={entry.imagePath} editingType={entry.editingType} expectedDelivery={entry.expectedDelivery}>
                    <Thumb src={entry.imagePath} alt={entry.title} />
                  </WorkHoverCard>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/hirer/works/${entry.id}`} className="hover:underline font-medium">{entry.title}</Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{entry.originalFilename}</td>
                <td className="px-3 py-2">{entry.editingType}</td>
                <td className="px-3 py-2">${entry.price.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar url={entry.retoucherAvatar} name={entry.retoucherName} size="sm" />
                    <span className="text-sm">{entry.retoucherName}</span>
                  </div>
                </td>
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

function HirerTable({ entries, showPayment }: { entries: any[]; showPayment?: boolean }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Preview</th>
            <th className="px-3 py-2 text-left font-medium">Title</th>
            <th className="px-3 py-2 text-left font-medium">File</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-left font-medium">Price</th>
            <th className="px-3 py-2 text-left font-medium">Retoucher</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            {showPayment && <th className="px-3 py-2 text-left font-medium">Payment</th>}
            <th className="px-3 py-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-3 py-2">
                <WorkHoverCard imageSrc={entry.imagePath} editingType={entry.editingType} expectedDelivery={entry.expectedDelivery}>
                  <Thumb src={entry.imagePath} alt={entry.title} />
                </WorkHoverCard>
              </td>
              <td className="px-3 py-2">
                <Link href={`/hirer/works/${entry.id}`} className="hover:underline font-medium">{entry.title}</Link>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{entry.originalFilename}</td>
              <td className="px-3 py-2">{entry.editingType}</td>
              <td className="px-3 py-2">${entry.price.toFixed(2)}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Avatar url={entry.retoucherAvatar} name={entry.retoucherName} size="sm" />
                  <span className="text-sm">{entry.retoucherName}</span>
                </div>
              </td>
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
