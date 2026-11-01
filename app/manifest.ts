import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Supplier Finder",
    short_name: "Supplier Finder",
    description: "Building maintenance supplier search in Ukraine and Moldova",
    lang: "ru",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFBF2",
    theme_color: "#1B4B2F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
