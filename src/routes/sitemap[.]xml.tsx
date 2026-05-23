import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/help", changefreq: "monthly", priority: "0.6" },
          { path: "/roommates", changefreq: "daily", priority: "0.8" },
          { path: "/list-hostel", changefreq: "monthly", priority: "0.7" },
          { path: "/signup", changefreq: "monthly", priority: "0.5" },
          { path: "/login", changefreq: "monthly", priority: "0.3" },
        ];

        try {
          const { data } = await supabase
            .from("hostels")
            .select("id, slug, updated_at")
            .eq("is_published", true)
            .limit(1000);
          for (const h of data ?? []) {
            entries.push({
              path: `/hostel/${h.slug ?? h.id}`,
              changefreq: "weekly",
              priority: "0.8",
              lastmod: h.updated_at ? new Date(h.updated_at).toISOString() : undefined,
            });
          }
        } catch {
          // ignore — sitemap still serves static routes
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n")
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
