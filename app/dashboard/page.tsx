import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-premium backdrop-blur-xl sm:p-10">
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              Protected dashboard
            </div>
            <h1 className="mt-6 font-[var(--font-heading)] text-4xl font-semibold text-white">
              Welcome back
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Your account is authenticated and this route is protected with Supabase-powered middleware and server-side session checks.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-medium text-slate-300">Signed in as</p>
                <p className="mt-2 break-all font-[var(--font-heading)] text-xl font-semibold text-white">
                  {user.email}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(14,165,233,0.08))] p-5">
                <p className="text-sm font-medium text-slate-200">Session status</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Active session detected on the server. Unauthenticated visitors are redirected to the login page automatically.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-premium backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Account
                </p>
                <h2 className="mt-3 font-[var(--font-heading)] text-2xl font-semibold text-white">
                  Session controls
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Sign out safely and the middleware will require authentication again before this page can be opened.
                </p>
              </div>
              <LogoutButton />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
