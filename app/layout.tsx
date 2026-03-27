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
        <div className="relative min-h-screen overflow-hidden bg-[#0b0f1a]">
          <div className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,#0b0f1a_0%,#0b0f1a_32%,#0e1324_100%)]" />
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(168,85,247,0.18),transparent_24%),radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.08),transparent_32%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25 [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />
          <div className="absolute left-1/2 top-0 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-white/5 blur-[180px]" />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
