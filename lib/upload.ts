import { writeFile } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split(".").pop() || "jpg"
  const filename = `${randomUUID()}.${ext}`
  const filepath = path.join(process.cwd(), "public", "uploads", filename)

  await writeFile(filepath, buffer)
  return `/uploads/${filename}`
}
