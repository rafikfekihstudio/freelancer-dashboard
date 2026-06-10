"use client"

export function FolderHirerSelect({
  folder,
  hirers,
  currentHirerId,
  currentHirerName,
}: {
  folder: string
  hirers: { id: number; name: string; email: string }[]
  currentHirerId: number | null
  currentHirerName: string | null
}) {
  return (
    <form action="/api/auth/folder-hirer" method="POST" className="inline">
      <input type="hidden" name="folder" value={folder} />
      <select
        name="hirerId"
        defaultValue={currentHirerId ?? ""}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="text-xs bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground focus:outline-none"
        title="Assign hirer to this folder"
      >
        <option value="">{currentHirerName ? `Retouching for ${currentHirerName}` : "No hirer"}</option>
        {hirers.map((h) => (
          <option key={h.id} value={h.id}>{h.name} ({h.email})</option>
        ))}
        {currentHirerName && <option value="">— Remove hirer —</option>}
      </select>
    </form>
  )
}
