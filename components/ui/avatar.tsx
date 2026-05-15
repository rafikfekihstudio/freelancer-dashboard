export function Avatar({ url, name, size = "md" }: { url?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-6 w-6 text-xs" : size === "lg" ? "h-12 w-12 text-lg" : "h-8 w-8 text-sm"

  if (url) {
    return <img src={url} alt={name} className={`${dims} rounded-full object-cover`} />
  }

  return (
    <div className={`${dims} rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
