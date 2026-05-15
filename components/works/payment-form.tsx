"use client"

import { useActionState } from "react"
import { recordPaymentAction } from "@/lib/actions/payments"

export function PaymentForm({ workEntryId, price }: { workEntryId: number; price: number }) {
  const [state, action, pending] = useActionState(recordPaymentAction, null)

  return (
    <form action={action} className="mt-4 space-y-3 rounded-lg border p-4">
      <input type="hidden" name="workEntryId" value={workEntryId} />
      <p className="text-sm font-medium">Record Payment Received</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label htmlFor="amount" className="text-xs text-muted-foreground">Amount ($)</label>
          <input id="amount" name="amount" type="number" step="0.01" min="0.01" required className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
        </div>
        <div className="space-y-1">
          <label htmlFor="paidAt" className="text-xs text-muted-foreground">Date</label>
          <input id="paidAt" name="paidAt" type="date" required className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
        </div>
        <div className="space-y-1">
          <label htmlFor="notes" className="text-xs text-muted-foreground">Notes</label>
          <input id="notes" name="notes" className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-2 py-1 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
        </div>
      </div>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors disabled:opacity-50">
        {pending ? "..." : "Record Payment"}
      </button>
    </form>
  )
}
