import PDFDocument from "pdfkit"

type InvoiceEntry = {
  title: string
  editingType: string
  price: number
  imagePath?: string | null
}

export async function generateInvoicePdf({
  folder,
  entries,
  total,
  partyName,
  partyCompany,
  partyEmail,
  partyCountry,
  invoiceRef,
  selectedImage,
  discount,
}: {
  folder: string
  entries: InvoiceEntry[]
  total: number
  partyName: string
  partyCompany: string
  partyEmail: string
  partyCountry: string
  invoiceRef: string
  selectedImage: string
  discount: number
}): Promise<ArrayBuffer> {
  // Fetch the selected thumbnail image
  let thumbnailBuffer: Buffer | null = null
  if (selectedImage) {
    try {
      const res = await fetch(selectedImage)
      if (res.ok) {
        const ab = await res.arrayBuffer()
        thumbnailBuffer = Buffer.from(ab)
      }
    } catch {}
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => {
      const buf = Buffer.concat(chunks)
      resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
    })
    doc.on("error", reject)

    const pageW = doc.page.width
    const margin = 50
    const now = new Date()
    const invoiceDate = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`
    const ref = invoiceRef || `RF${String(now.getMonth() + 1).padStart(2, "0")}${now.getFullYear()}`

    // ── Header ──
    let y = 50

    // Left: Studio info
    doc.fontSize(20).font("Helvetica-Bold").text("Rafic Fekih Studio", margin, y)
    y += 28
    doc.fontSize(9).font("Helvetica").fillColor("#666666")
    doc.text("me@raficfekihstudio.com", margin, y)
    y += 13
    doc.text("+216 22 279 135", margin, y)
    y += 13
    doc.text("Sousse, Tunisia", margin, y)

    // Right: Invoice title + reference
    doc.fontSize(32).font("Helvetica-Bold").fillColor("#222222")
    doc.text("Invoice", pageW - margin - 200, 50, { width: 200, align: "right" })
    doc.fontSize(10).font("Helvetica").fillColor("#666666")
    doc.text(`#${ref}`, pageW - margin - 200, 88, { width: 200, align: "right" })

    y = 150

    // ── Billed To ──
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    doc.text("BILLED TO", margin, y)
    y += 16
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#222222")
    const displayName = partyCompany ? `${partyName} - ${partyCompany}` : partyName
    y = doc.text(displayName, margin, y, { width: 180 }).y + 4
    if (partyEmail) {
      doc.fontSize(9).font("Helvetica").fillColor("#444444")
      y = doc.text(partyEmail, margin, y, { width: 180 }).y + 4
    }
    if (partyCountry) {
      doc.fontSize(9).font("Helvetica").fillColor("#444444")
      y = doc.text(partyCountry, margin, y, { width: 180 }).y + 4
    }

    // ── Invoice Date ──
    const dateX = margin + 200
    const rightY = 50
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    doc.text("INVOICE DATE", dateX, rightY)
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#222222")
    doc.text(invoiceDate, dateX, rightY + 14)

    const finalTotal = total - discount

    // ── Amount Due ──
    const amountX = pageW - margin - 120
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    doc.text("AMOUNT DUE", amountX, rightY, { width: 120, align: "right" })
    const boxY = rightY + 14
    const boxW = 120
    const boxH = 28
    doc.save()
    doc.roundedRect(amountX, boxY, boxW, boxH, 4).fill("#2ECC71")
    doc.restore()
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#FFFFFF")
    doc.text(`$${finalTotal.toFixed(0)}`, amountX, boxY + 5, { width: boxW, align: "center" })

    // ── Service type ──
    y = Math.max(y, boxY + boxH + 10)
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#222222")
    doc.text("Photo Retouching", margin, y)
    y += 25

    // ── Table header ──
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    const thumbW = 60
    const thumbH = 40
    const thumbGap = 8
    const colNum = margin + thumbW + thumbGap
    const colTitle = margin + thumbW + thumbGap + 20
    const colSubtotal = pageW - margin - 80
    doc.text("#", colNum, y)
    doc.text("TITLE / DESCRIPTION", colTitle, y)
    doc.text("SUBTOTAL", colSubtotal, y, { width: 80, align: "right" })
    y += 16
    doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#DDDDDD").lineWidth(0.5).stroke()
    y += 8

    // ── Table rows: group by editingType ──
    const groups: Record<string, { entries: InvoiceEntry[]; subtotal: number }> = {}
    for (const entry of entries) {
      const key = entry.editingType
      if (!groups[key]) groups[key] = { entries: [], subtotal: 0 }
      groups[key].entries.push(entry)
      groups[key].subtotal += entry.price
    }

    const groupKeys = Object.keys(groups)
    for (let i = 0; i < groupKeys.length; i++) {
      const key = groupKeys[i]
      const group = groups[key]
      const count = group.entries.length
      const rate = count > 0 ? group.subtotal / count : 0
      const rowY = y

      // Thumbnail
      if (thumbnailBuffer) {
        try {
          doc.image(thumbnailBuffer, margin, rowY, { width: thumbW, height: thumbH })
        } catch {}
      } else {
        doc.save()
        doc.rect(margin, rowY, thumbW, thumbH).fill("#E5E7EB")
        doc.restore()
      }

      // Row number
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#222222")
      doc.text(String(i + 1), colNum, rowY)

      // Title: "N x images"
      doc.font("Helvetica-Bold").text(`${count} x images`, colTitle, rowY)
      y += 14

      // Description: editing type
      doc.fontSize(9).font("Helvetica").fillColor("#555555")
      doc.text(key, colTitle, rowY + 14)
      y += 14

      // Rate x count
      doc.fontSize(9).font("Helvetica").fillColor("#444444")
      doc.text(`$${rate.toFixed(0)}*${count}`, colSubtotal, rowY, { width: 80, align: "right" })

      // Subtotal
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#222222")
      doc.text(`$${group.subtotal.toFixed(0)}`, colSubtotal, rowY + 14, { width: 80, align: "right" })

      y += 20

      // Separator line between rows
      if (i < groupKeys.length - 1) {
        doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#EEEEEE").lineWidth(0.5).stroke()
        y += 8
      }
    }

    // ── Total line ──
    y += 5
    doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#DDDDDD").lineWidth(0.5).stroke()
    y += 10

    doc.fontSize(14).font("Helvetica-Bold").fillColor("#222222")
    doc.text("Total", margin, y)
    doc.text(`$${finalTotal.toFixed(2)}`, colSubtotal, y, { width: 80, align: "right" })
    y += 24

    // ── Thank you ──
    doc.fontSize(10).font("Helvetica").fillColor("#444444")
    doc.text("Thank you for your collaboration", margin, y)
    y += 30

    // ── Bank details ──
    doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#DDDDDD").lineWidth(0.5).stroke()
    y += 12

    const bankCol1 = margin
    const bankCol2 = margin + 120
    const bankCol3 = margin + 310
    const bankCol4 = margin + 400

    doc.fontSize(7).font("Helvetica-Bold").fillColor("#888888")
    doc.text("ACCOUNT NAME", bankCol1, y)
    doc.text("Bank name", bankCol2, y)
    doc.text("Swift code", bankCol3, y)
    doc.text("Account # (IBAN)", bankCol4, y)
    y += 12

    doc.fontSize(8).font("Helvetica").fillColor("#444444")
    doc.text("Rafik fekih", bankCol1, y, { width: 110 })
    doc.text("Banque de Tunisie et des Emirats", bankCol2, y, { width: 180 })
    doc.text("BTEXTNTTXXX", bankCol3, y, { width: 80 })
    doc.text("TN59 24 031 201 7432 512201 60", bankCol4, y, { width: 145 })

    doc.end()
  })
}
