"use client"

import Link from "next/link"
import { WorkHoverCard } from "@/components/work-hover-card"
import { DeleteEntryButton } from "@/components/delete-entry-button"
import { InlineStatus } from "@/components/inline-status"
import { FolderHirerSelect } from "@/components/folder-hirer-select"
import { FolderPaymentBadge } from "@/components/folder-payment-badge"
import { FolderStatusBadge } from "@/components/folder-status-badge"
import { FolderTypeBadge } from "@/components/folder-type-badge"
import { InvoiceForm } from "@/components/invoice-form"
import { CollapsibleSection } from "@/components/collapsible-section"

function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) return <div className="h-10 w-10 rounded bg-muted" />
  return <img src={src} alt={alt} className="h-10 w-10 rounded object-cover" />
}

function folderPaymentStatus(entries: any[]): { label: string; cls: string } {
  const allPaid = entries.every((e: any) => e.paymentStatus === "paid")
  const anyPaid = entries.some((e: any) => e.paymentStatus === "paid" || e.paymentStatus === "partial")
  if (allPaid) return { label: "paid", cls: "bg-green-100 text-green-700" }
  if (anyPaid) return { label: "partial", cls: "bg-blue-100 text-blue-700" }
  return { label: "unpaid", cls: "bg-gray-100 text-gray-700" }
}

function folderWorkStatus(entries: any[]): string {
  const allDone = entries.every((e: any) => e.status === "completed")
  return allDone ? "completed" : "in-progress"
}

export function FolderSection({
  folder,
  entries,
  note,
  hirers,
  allTypes,
  defaultOpen = true,
}: {
  folder: string
  entries: any[]
  note: string | null
  hirers: { id: number; name: string; email: string }[]
  allTypes: string[]
  defaultOpen?: boolean
}) {
  const ps = folderPaymentStatus(entries)
  const ws = folderWorkStatus(entries)
  const total = entries.reduce((s: number, e: any) => s + e.price, 0)
  const currentHirerId = entries.find((e: any) => e.hirerId)?.hirerId ?? null
  const currentHirerName = entries.find((e: any) => e.hirerName)?.hirerName ?? null
  const types = [...new Set(entries.map((e: any) => e.editingType))]
  const commonType = types.length === 1 ? types[0] : types.join(" + ")

  return (
    <CollapsibleSection
      defaultOpen={defaultOpen}
      title={
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{folder}</h2>
            <Link href={`/retoucher/new?folder=${encodeURIComponent(folder)}`} className="text-muted-foreground hover:text-foreground text-lg leading-none" title="Add to this folder">+</Link>
          </div>
          <FolderHirerSelect folder={folder} hirers={hirers} currentHirerId={currentHirerId} currentHirerName={currentHirerName} />
          {note && <p className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 mt-1">{note}</p>}
        </div>
      }
      badge={<FolderTypeBadge folder={folder} currentType={commonType} allTypes={allTypes} />}
      actions={
        <>
          <InvoiceForm
            folder={folder}
            defaultName={currentHirerName ?? ""}
            defaultEmail={entries.find((e: any) => e.hirerName === currentHirerName)?.hirerEmail ?? ""}
            images={entries.map((e: any) => ({ id: e.id, src: e.imagePath, label: e.title }))}
            trigger={<span className="text-[11px] text-muted-foreground hover:text-foreground underline">Invoice</span>}
          />
          <span className="text-sm text-muted-foreground">${total.toFixed(2)}</span>
          <FolderStatusBadge folder={folder} current={ws} />
          <FolderPaymentBadge folder={folder} current={ps.label} />
        </>
      }
    >
      <div className="border rounded-lg overflow-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Preview</th>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">File</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Price</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Payment</th>
              <th className="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: any) => (
              <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2">
                  <WorkHoverCard imageSrc={entry.imagePath} editingType={entry.editingType} expectedDelivery={entry.expectedDelivery} hirerName={entry.hirerName}>
                    <Thumb src={entry.imagePath} alt={entry.title} />
                  </WorkHoverCard>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/retoucher/works/${entry.id}`} className="hover:underline font-medium">{entry.title}</Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{entry.originalFilename}</td>
                <td className="px-3 py-2">{entry.editingType}</td>
                <td className="px-3 py-2">${entry.price.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <InlineStatus
                    entryId={entry.id}
                    current={entry.status}
                    options={[
                      { value: "in-progress", label: "in-progress", cls: "bg-yellow-100 text-yellow-700" },
                      { value: "completed", label: "completed", cls: "bg-green-100 text-green-700" },
                    ]}
                  />
                </td>
                <td className="px-3 py-2">
                  <InlineStatus
                    entryId={entry.id}
                    current={entry.paymentStatus}
                    options={[
                      { value: "unpaid", label: "unpaid", cls: "bg-gray-100 text-gray-700" },
                      { value: "partial", label: "partial", cls: "bg-blue-100 text-blue-700" },
                      { value: "paid", label: "paid", cls: "bg-green-100 text-green-700" },
                    ]}
                  />
                </td>
                <td className="px-3 py-2"><DeleteEntryButton entryId={entry.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  )
}
