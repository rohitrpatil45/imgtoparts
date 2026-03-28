import Link from "next/link";
import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-8">
      <Container className="flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>CNC Image Auto Crop Tool. Built for premium SaaS image workflows.</div>
        <div className="flex gap-5">
          <Link href="/tool" className="transition hover:text-blue-100">
            Tool
          </Link>
          <Link href="/pricing" className="transition hover:text-blue-100">
            Pricing
          </Link>
          <Link href="/sign-in" className="transition hover:text-blue-100">
            Auth Ready
          </Link>
        </div>
      </Container>
    </footer>
  );
}

