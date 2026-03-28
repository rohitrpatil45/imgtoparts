import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "CNC Image Auto Crop Tool",
  description:
    "Production-ready SaaS web app for CNC designers to auto-crop reference imagery into quadrant and detail views.",
  metadataBase: new URL("https://example.com")
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} h-full bg-[#0b0f1a]`}
    >
      <body className="min-h-full bg-[#0b0f1a] text-slate-100 antialiased">
        <div
          className="relative min-h-screen overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 24%), radial-gradient(circle at 82% 12%, rgba(139,92,246,0.16), transparent 28%), linear-gradient(180deg, #0b0f1a 0%, #0b1120 45%, #0f172a 100%)"
          }}
        >
          <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
              backgroundSize: "120px 120px"
            }}
          />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
