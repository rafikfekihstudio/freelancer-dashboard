import { v2 as cloudinary } from "cloudinary"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadImage(file: File): Promise<string | null> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Cloudinary upload when configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "freelancer-dashboard" },
        (err, result) => {
          if (err || !result) {
            console.warn("[UPLOAD] Cloudinary upload failed", err)
            return resolve(null)
          }
          resolve(result.secure_url)
        }
      )
      stream.end(buffer)
    })
  }

  // Local filesystem fallback for dev
  try {
    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${randomUUID()}.${ext}`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    return `/uploads/${filename}`
  } catch {
    console.warn("[UPLOAD] Skipped — filesystem is read-only")
    return null
  }
}
