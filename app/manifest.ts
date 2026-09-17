import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PRIMEOS - Restaurant POS",
    short_name: "PRIME POS",
    description: "Restaurant Point of Sale & Operations Management System",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait",
    categories: ["food", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "PRIME POS Management Dashboard",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "PRIME POS Mobile Orders",
      },
    ],
  };
}