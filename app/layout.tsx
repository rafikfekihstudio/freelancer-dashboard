import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/session-provider"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`
        }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
