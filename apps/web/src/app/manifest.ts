import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liftbook",
    short_name: "Liftbook",
    description: "Mobile-first offline workout journal",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ecfdf5",
    icons: [
      {
        src: "/manifest-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/manifest-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  }
}
