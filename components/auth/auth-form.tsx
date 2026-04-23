"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type AuthFormProps = {
  mode: "login" | "signup";
};

const copy = {
  login: {
    badge: "Welcome back",
    title: "Sign in to your workspace",
    description: "Access your account, continue your projects, and manage your CNC image workflow.",
    submitLabel: "Sign in",
    loadingLabel: "Signing in...",
    alternateLabel: "Need an account?",
    alternateHref: "/signup",
    alternateCta: "Create one",
    successMessage: ""
  },
  signup: {
    badge: "Start free",
    title: "Create your account",
    description: "Spin up a secure workspace and unlock your protected CNC dashboard in seconds.",
    submitLabel: "Create account",
    loadingLabel: "Creating account...",
    alternateLabel: "Already have an account?",
    alternateHref: "/login",
    alternateCta: "Sign in",
    successMessage:
      "Account created. If email confirmation is enabled in Supabase, check your inbox before signing in."
  }
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = copy[mode];
  const nextPath = searchParams.get("next") || "/dashboard";
  const isPasswordTooShort = password.length > 0 && password.length < 6;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.replace(nextPath);
          router.refresh();
          return;
        }

        setSuccessMessage(content.successMessage);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative isolate mx-auto flex min-h-[calc(100vh-13rem)] w-full max-w-6xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-80 max-w-5xl rounded-full bg-blue-500/10 blur-3xl" />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-premium backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden border-r border-white/10 bg-[linear-gradient(160deg,rgba(59,130,246,0.22),rgba(15,23,42,0.72)_45%,rgba(14,165,233,0.12))] p-10 lg:block">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
            SaaS Auth
          </div>
          <h2 className="mt-6 max-w-sm font-[var(--font-heading)] text-4xl font-semibold text-white">
            Secure access for your CNC image workflow.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-200">
            Simple email authentication, protected dashboard access, and a clean control surface built for a modern SaaS product.
          </p>
          <div className="mt-10 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-medium text-white">Protected dashboard</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Middleware guards the route and redirects unauthenticated visitors to the login screen.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">Session-aware UX</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Successful sign-ins redirect instantly, while signup and password errors are surfaced inline.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
              {content.badge}
            </div>
            <h1 className="mt-6 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {content.description}
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor={`${mode}-email`}
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email
                </label>
                <input
                  id={`${mode}-email`}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-400/20"
                />
              </div>

              <div>
                <label
                  htmlFor={`${mode}-password`}
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
                <input
                  id={`${mode}-password`}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.07] focus:ring-2 focus:ring-blue-400/20"
                />
                {isPasswordTooShort ? (
                  <p className="mt-2 text-sm text-amber-300">
                    Password must be at least 6 characters long.
                  </p>
                ) : null}
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(14,165,233,0.25)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? content.loadingLabel : content.submitLabel}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-400">
              {content.alternateLabel}{" "}
              <Link
                href={content.alternateHref}
                className="font-semibold text-blue-300 transition hover:text-blue-200"
              >
                {content.alternateCta}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
