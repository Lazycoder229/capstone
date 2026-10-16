import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "Pards PRIME Admin",
    short_name: "PRIME Admin",
    description: "Manage restaurant operations from PRIME POS.",
    start_url: "/admin/login",
    scope: "/admin/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff9900",
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
