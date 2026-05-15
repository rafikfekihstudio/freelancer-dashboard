import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { workEntries, comments, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { CommentSection } from "@/components/works/comment-section"
import DashboardShell from "@/components/dashboard-shell"

export default async function HirerWorkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "hirer") redirect("/login")

  const { id } = await params
  const entry = await db
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
      retoucherName: users.name,
    })
    .from(workEntries)
    .innerJoin(users, eq(workEntries.retoucherId, users.id))
    .where(eq(workEntries.id, Number(id)))
    .get()

  if (!entry) {
    return <DashboardShell><p className="text-muted-foreground">Work entry not found.</p></DashboardShell>
  }

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

  return (
    <DashboardShell>
      <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">{entry.title}</h1>

      {entry.imagePath && (
        <img src={entry.imagePath} alt={entry.title} className="max-h-96 w-full rounded-lg object-cover" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Retoucher</p>
          <p>{entry.retoucherName}</p>
        </div>
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
        <div>
          <p className="text-sm text-muted-foreground">Expected Delivery</p>
          <p>{entry.expectedDelivery}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            entry.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>{entry.status}</span>
        </div>
      </div>

      <CommentSection workEntryId={entry.id} comments={allComments} currentUserId={session.user.id} />
    </div>
    </DashboardShell>
  )
}
