import PDFDocument from "pdfkit"

type InvoiceEntry = {
  title: string
  editingType: string
  price: number
  imagePath?: string | null
}

export function generateInvoicePdf({
  folder,
  entries,
  total,
  partyLabel,
  partyName,
  partyEmail,
}: {
  folder: string
  entries: InvoiceEntry[]
  total: number
  partyLabel: string
  partyName: string
  partyEmail: string
}): Promise<ArrayBuffer> {
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
    const contentW = pageW - margin * 2
    const now = new Date()
    const invoiceDate = `${String(now.getDate()).padStart(2, "0")}.${String(now.getMonth() + 1).padStart(2, "0")}.${now.getFullYear()}`
    const invoiceNumber = `#${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${folder.replace(/\s+/g, "").slice(0, 8).toUpperCase()}`

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

    // Right: Invoice title + number
    doc.fontSize(32).font("Helvetica-Bold").fillColor("#222222")
    doc.text("Invoice", pageW - margin - 200, 50, { width: 200, align: "right" })
    doc.fontSize(10).font("Helvetica").fillColor("#666666")
    doc.text(invoiceNumber, pageW - margin - 200, 88, { width: 200, align: "right" })

    y = 150

    // ── Billed To ──
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    doc.text(partyLabel, margin, y)
    y += 16
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#222222")
    doc.text(partyName, margin, y)
    y += 16
    if (partyEmail) {
      doc.fontSize(9).font("Helvetica").fillColor("#444444")
      doc.text(partyEmail, margin, y)
      y += 13
    }

    // ── Invoice Date ──
    const dateX = margin + 200
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    doc.text("INVOICE DATE", dateX, 150)
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#222222")
    doc.text(invoiceDate, dateX, 164)

    // ── Amount Due ──
    const amountX = pageW - margin - 120
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    doc.text("AMOUNT DUE", amountX, 150, { width: 120, align: "right" })
    y = 168
    // Green box
    const boxW = 120
    const boxH = 28
    doc.save()
    doc.roundedRect(amountX, y, boxW, boxH, 4).fill("#2ECC71")
    doc.restore()
    doc.fontSize(16).font("Helvetica-Bold").fillColor("#FFFFFF")
    doc.text(`$${total.toFixed(0)}`, amountX, y + 5, { width: boxW, align: "center" })

    y = 215

    // ── Service type ──
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#222222")
    doc.text("Photo Retouching", margin, y)
    y += 25

    // ── Table header ──
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#888888")
    const colNum = margin
    const colTitle = margin + 30
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

      // Row number
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#222222")
      doc.text(String(i + 1), colNum, y)

      // Title: "N x images"
      doc.font("Helvetica-Bold").text(`${count} x images`, colTitle, y)
      y += 14

      // Description: editing type
      doc.fontSize(9).font("Helvetica").fillColor("#555555")
      doc.text(key, colTitle, y)
      y += 14

      // Rate x count
      doc.fontSize(9).font("Helvetica").fillColor("#444444")
      doc.text(`$${rate.toFixed(0)}*${count}`, colSubtotal, y - 28, { width: 80, align: "right" })

      // Subtotal
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#222222")
      doc.text(`$${group.subtotal.toFixed(0)}`, colSubtotal, y - 14, { width: 80, align: "right" })

      y += 12

      // Separator line between rows
      if (i < groupKeys.length - 1) {
        doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#EEEEEE").lineWidth(0.5).stroke()
        y += 8
      }
    }

    // ── Total line ──
    y += 8
    doc.moveTo(colSubtotal, y).lineTo(pageW - margin, y).strokeColor("#DDDDDD").lineWidth(0.5).stroke()
    y += 8

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#222222")
    doc.text("TOTAL", colSubtotal - 50, y)
    doc.text(`$${total.toFixed(2)}`, colSubtotal, y, { width: 80, align: "right" })

    doc.end()
  })
}
