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
      className={`${bodyFont.variable} ${headingFont.variable} h-full bg-slate-950`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        <div
          className="min-h-screen"
          style={{
            backgroundImage:
              "radial-gradient(circle at top, rgba(56, 189, 248, 0.12), transparent 24%), radial-gradient(circle at 85% 10%, rgba(59, 130, 246, 0.12), transparent 26%), linear-gradient(180deg, #020617 0%, #020617 35%, #0f172a 100%)"
          }}
        >
          <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[linear-gradient(120deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
