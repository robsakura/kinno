"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function UsernameModal() {
  const { data: session, update } = useSession();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Only show when signed in and no username set yet
  if (!session?.user?.id || session.user.username) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        await update(); // refresh session so username propagates
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-cinema-border bg-cinema-surface p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-100">Choose a username</h2>
          <p className="text-sm text-cinema-muted mt-1">
            This is how you&apos;ll appear on the leaderboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. CinemaGuru42"
            maxLength={24}
            className="w-full rounded-lg border border-cinema-border bg-cinema-bg px-3 py-2 text-sm text-slate-100 placeholder:text-cinema-muted focus:outline-none focus:border-gold"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <p className="text-xs text-cinema-muted">
            2–24 characters · letters, numbers, _ or -
          </p>
          <button
            type="submit"
            disabled={saving || value.trim().length < 2}
            className="w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-cinema-bg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Set username"}
          </button>
        </form>
      </div>
    </div>
  );
}
