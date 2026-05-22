import { v2 as cloudinary } from "cloudinary"
import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { randomUUID } from "crypto"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_DIM = 1920

export async function uploadImage(file: File): Promise<string | null> {
  const bytes = await file.arrayBuffer()
  let buffer = Buffer.from(bytes)

  // Convert any image (TIFF, PNG, WebP, etc.) to JPEG and resize
  let processed: Buffer
  try {
    processed = await sharp(buffer)
      .rotate()
      .jpeg({ quality: 85, mozjpeg: true })
      .resize({ withoutEnlargement: true, fit: "inside", width: MAX_DIM, height: MAX_DIM })
      .toBuffer()
  } catch (err) {
    console.warn("[UPLOAD] Image processing failed, uploading raw", err)
    processed = buffer
  }

  // Cloudinary upload when configured
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "freelancer-dashboard", format: "jpg" },
        (err, result) => {
          if (err || !result) {
            console.warn("[UPLOAD] Cloudinary upload failed", err)
            return resolve(null)
          }
          resolve(result.secure_url)
        }
      )
      stream.end(processed)
    })
  }

  // Local filesystem fallback for dev
  try {
    const filename = `${randomUUID()}.jpg`
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, processed)
    return `/uploads/${filename}`
  } catch {
    console.warn("[UPLOAD] Skipped — filesystem is read-only")
    return null
  }
}
