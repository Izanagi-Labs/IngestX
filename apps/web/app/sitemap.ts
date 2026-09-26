import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const BASE_URL = "https://ingestx.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${BASE_URL}${path}`;

  const docs: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: url(page.url),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: url("/demo"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...docs,
  ];
}
