"use client"

import { deleteUserAction } from "@/lib/actions/users"

export function DeleteUserButton({ userId }: { userId: number }) {
  return (
    <form action={deleteUserAction}>
      <input type="hidden" name="id" value={userId} />
      <button
        type="submit"
        onClick={(e) => { if (!confirm("Delete this user and all their work entries?")) e.preventDefault() }}
        className="text-red-500 hover:text-red-700 text-sm"
      >
        Delete
      </button>
    </form>
  )
}
