import { upsertFolderNoteAction } from "@/lib/actions/works"
import { redirect } from "next/navigation"

export async function POST(request: Request) {
  const formData = await request.formData()
  await upsertFolderNoteAction(formData)
  const ref = request.headers.get("referer") || "/hirer"
  redirect(ref)
}
