import { CommentForm } from "./comment-form"

type Comment = { id: number; content: string; createdAt: string | null; userName: string }

export function CommentSection({ workEntryId, comments, currentUserId }: {
  workEntryId: number
  comments: Comment[]
  currentUserId: string
}) {
  return (
    <div className="space-y-4 border-t pt-6">
      <h2 className="text-xl font-semibold">Comments</h2>
      <div className="space-y-3">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{comment.userName}</span>
              <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        ))}
      </div>
      <CommentForm workEntryId={workEntryId} />
    </div>
  )
}
