import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, comments, users, payments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { StatusToggle } from "./status-toggle"
import { CommentSection } from "@/components/works/comment-section"
import { PaymentForm } from "@/components/works/payment-form"
import DashboardShell from "@/components/dashboard-shell"

export default async function RetoucherWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "retoucher") redirect("/login")

  const { id } = await params
  const entry = await db
    .select({
      id: workEntries.id,
      title: workEntries.title,
      originalFilename: workEntries.originalFilename,
      imagePath: workEntries.imagePath,
      editingType: workEntries.editingType,
      price: workEntries.price,
      expectedDelivery: workEntries.expectedDelivery,
      status: workEntries.status,
      paymentStatus: workEntries.paymentStatus,
      amountPaid: workEntries.amountPaid,
      privateNotes: workEntries.privateNotes,
      hirerId: workEntries.hirerId,
    })
    .from(workEntries)
    .where(eq(workEntries.id, Number(id)))
    .get()

  if (!entry) {
    return <DashboardShell><p className="text-muted-foreground">Work entry not found.</p></DashboardShell>
  }

  const hirer = entry.hirerId
    ? await db.select({ name: users.name }).from(users).where(eq(users.id, entry.hirerId)).get()
    : null

  const allComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userName: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.workEntryId, Number(id)))
    .all()

  const entryPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.workEntryId, Number(id)))
    .all()

  return (
    <DashboardShell>
      <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{entry.title}</h1>
        <Link
          href={`/retoucher/works/${entry.id}/edit`}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Edit
        </Link>
      </div>

      {entry.imagePath && (
        <img src={entry.imagePath} alt={entry.title} className="max-h-96 w-full rounded-lg object-cover" />
      )}

      {entry.privateNotes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800 text-xs mb-0.5">Private Note</p>
          <p className="text-amber-900">{entry.privateNotes}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">File</p>
          <p>{entry.originalFilename}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Editing Type</p>
          <p>{entry.editingType}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Price</p>
          <p>${entry.price.toFixed(2)}</p>
        </div>
        {hirer && (
          <div>
            <p className="text-sm text-muted-foreground">Hirer</p>
            <p>{hirer.name}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Expected Delivery</p>
          <p>{entry.expectedDelivery}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <StatusToggle entryId={entry.id} currentStatus={entry.status} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Payment</p>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            entry.paymentStatus === "paid" ? "bg-green-100 text-green-700"
            : entry.paymentStatus === "partial" ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-700"
          }`}>
            {entry.paymentStatus === "unpaid" ? "unpaid" : entry.paymentStatus} (${Number(entry.amountPaid ?? 0).toFixed(2)})
          </span>
        </div>
      </div>

      <section className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Payments Received</h2>
        {entryPayments.length === 0 && <p className="text-sm text-muted-foreground mb-4">No payments recorded.</p>}
        {entryPayments.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border p-3 mb-2">
            <div>
              <p className="text-sm font-medium">${p.amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{p.paidAt}</p>
            </div>
            {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
          </div>
        ))}
        <PaymentForm workEntryId={entry.id} price={entry.price} />
      </section>

      <CommentSection
        workEntryId={entry.id}
        comments={allComments}
        currentUserId={session.user.id}
      />
    </div>
    </DashboardShell>
  )
}
