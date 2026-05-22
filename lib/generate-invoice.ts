import PDFDocument from "pdfkit"

type InvoiceEntry = {
  title: string
  editingType: string
  price: number
}

export function generateInvoicePdf({
  folder,
  entries,
  total,
  partyLabel,
  partyName,
}: {
  folder: string
  entries: InvoiceEntry[]
  total: number
  partyLabel: string
  partyName: string
}): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => {
      const buf = Buffer.concat(chunks)
      resolve(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer)
    })
    doc.on("error", reject)

    const pageWidth = doc.page.width - 100
    const colTitle = pageWidth * 0.5
    const colType = pageWidth * 0.25
    const colPrice = pageWidth * 0.25

    doc.fontSize(22).font("Helvetica-Bold").text("INVOICE", 50, 50)
    doc.fontSize(10).font("Helvetica").text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, 80)
    doc.text(`Folder: ${folder}`, 50, 95)
    doc.text(`${partyLabel}: ${partyName}`, 50, 110)

    doc.moveTo(50, 130).lineTo(50 + pageWidth, 130).stroke()

    let y = 140
    doc.fontSize(10).font("Helvetica-Bold")
    doc.text("Title", 50, y)
    doc.text("Type", 50 + colTitle, y)
    doc.text("Price", 50 + colTitle + colType, y, { width: colPrice, align: "right" })

    y += 18
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).stroke()
    y += 6

    doc.fontSize(10).font("Helvetica")
    for (const entry of entries) {
      doc.text(entry.title, 50, y, { width: colTitle - 10 })
      doc.text(entry.editingType, 50 + colTitle, y, { width: colType - 10 })
      doc.text(`$${entry.price.toFixed(2)}`, 50 + colTitle + colType, y, { width: colPrice, align: "right" })
      y += 18
    }

    y += 4
    doc.moveTo(50 + colTitle + colType, y).lineTo(50 + pageWidth, y).stroke()
    y += 6

    doc.font("Helvetica-Bold")
    doc.text("Total", 50 + colTitle, y, { width: colType })
    doc.text(`$${total.toFixed(2)}`, 50 + colTitle + colType, y, { width: colPrice, align: "right" })

    doc.end()
  })
}
