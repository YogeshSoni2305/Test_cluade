import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rajasthan Kaam",
    short_name: "Kaam",
    description: "Trusted jobs and practical learning in businesses across India, for people from Rajasthan.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbf3",
    theme_color: "#1e2366",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
