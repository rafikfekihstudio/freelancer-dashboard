import type { NextConfig } from "next"

const nextConfig: NextConfig & Record<string, unknown> = {
  serverExternalPackages: ["sharp", "pdfkit"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
}

export default nextConfig
