import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/jobs", "/employers/", "/employer$", "/safety", "/letters$"],
      disallow: ["/candidate", "/employer/", "/admin", "/messages", "/notifications", "/account", "/dev-login", "/onboarding", "/feedback", "/api/", "/letters/", "/sign-in", "/sign-up", "/suspended"],
    }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
