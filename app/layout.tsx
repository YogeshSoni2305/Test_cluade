import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource-variable/noto-sans-devanagari";
import "./globals.css";
import { BYPASS } from "@/lib/auth";
import { seedIfEmpty } from "@/lib/seed";
import { getLang } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "Rajasthan Kaam — Work, learn & grow", template: "%s · Rajasthan Kaam" },
  description:
    "A trusted job and practical-learning platform for people from Rajasthan to work in established businesses across India — with clear pay, stay and learning details.",
};
export const viewport: Viewport = { themeColor: "#1e2366", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (BYPASS) seedIfEmpty();
  const lang = await getLang();
  const body = (
    <html lang={lang}>
      <body className="min-h-screen">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
  return BYPASS ? body : <ClerkProvider>{body}</ClerkProvider>;
}
