import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PoStory Content Studio",
    short_name: "PoStory Studio",
    description: "PoStory 内部内容工作台",
    start_url: "/internal/content-studio",
    scope: "/",
    display: "standalone",
    background_color: "#faf9fc",
    theme_color: "#ec348b",
    icons: [{ src: "/icon.png", sizes: "284x284", type: "image/png", purpose: "maskable" }],
  };
}
