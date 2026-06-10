import { bulkAssignFolderHirerAction } from "@/lib/actions/works"
import { redirect } from "next/navigation"

export async function POST(request: Request) {
  const formData = await request.formData()
  await bulkAssignFolderHirerAction(formData)
  const ref = request.headers.get("referer") || "/retoucher"
  redirect(ref)
}
