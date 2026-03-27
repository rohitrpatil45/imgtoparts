import { Container } from "@/components/ui/container";

export default function SignInPlaceholderPage() {
  return (
    <Container className="pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-premium backdrop-blur-xl">
        <p className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-amber-100">
          Auth Ready
        </p>
        <h1 className="mt-4 font-[var(--font-heading)] text-4xl font-semibold text-white">
          Sign-in surface prepared for your auth provider.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          The app structure is ready for NextAuth, Clerk, Auth0, or a custom
          auth layer. This placeholder keeps the route map ready without adding
          auth complexity yet.
        </p>
      </div>
    </Container>
  );
}
