import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
// Fonts are trimmed for slow connections: only the weights we use, and Tiro only for Devanagari.
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/tiro-devanagari-hindi/devanagari-400.css";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/600.css";
import "./globals.css";
import { BYPASS } from "@/lib/auth";
import { seedIfEmpty } from "@/lib/seed";
import { after } from "next/server";
import { maybeRunHousekeeping } from "@/lib/housekeeping";
import { siteUrl } from "@/lib/seo";
import { Suspense } from "react";
import { Analytics } from "@/components/Analytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { getLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Rajasthan Kaam — Work, learn & grow", template: "%s · Rajasthan Kaam" },
  description:
    "A trusted job and practical-learning platform for people from Rajasthan to work in established businesses across India — with clear pay, stay and learning details.",
  applicationName: "Rajasthan Kaam",
  openGraph: { siteName: "Rajasthan Kaam", locale: "en_IN", alternateLocale: ["hi_IN"], type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: "Kaam", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#971d17", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (BYPASS) seedIfEmpty();
  // lightweight in-process scheduler; /api/cron/housekeeping is available for a real cron
  after(() => { maybeRunHousekeeping(); });
  const lang = await getLang();
  const body = (
    <html lang={lang}>
      <body className="min-h-screen">
        <a href="#main" className="sr-only z-50 bg-ink px-4 py-2 font-semibold text-paper-50 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">{lang === "hi" ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}</a>
        <Header />
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <Footer />
        <Suspense fallback={null}><Analytics /></Suspense>
        <ServiceWorker />
      </body>
    </html>
  );
  return BYPASS ? body : <ClerkProvider>{body}</ClerkProvider>;
}
