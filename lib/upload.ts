import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

export async function uploadImage(file: File): Promise<string | null> {
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${randomUUID()}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)
    return `/uploads/${filename}`
  } catch {
    // Vercel serverless has read-only filesystem — skip upload
    console.warn("[UPLOAD] Skipped — filesystem is read-only")
    return null
  }
}
