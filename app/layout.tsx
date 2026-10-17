import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/shell";
import "./globals.css";

const dm = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Class 101 — Out of Syllabus",
    template: "%s · Class 101",
  },
  description:
    "CodeSapiens first-year freshers meetup. Your task, your team, Sapien Dollars, and a card people can scan.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffd966",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${dm.variable} ${display.variable} flex min-h-screen flex-col bg-cream font-sans text-ink antialiased`}>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
