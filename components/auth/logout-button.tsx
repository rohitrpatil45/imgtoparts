"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Signing out..." : "Logout"}
      </button>
      {errorMessage ? (
        <p className="max-w-xs text-right text-sm text-rose-200">{errorMessage}</p>
      ) : null}
    </div>
  );
}
