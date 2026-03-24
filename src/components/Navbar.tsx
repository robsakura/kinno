"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-40 border-b border-cinema-border bg-cinema-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/kinno_logo_white.png"
            alt="Kinno"
            width={90}
            height={30}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="text-sm text-cinema-muted hover:text-gold transition-colors"
          >
            Leaderboard
          </Link>

          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-cinema-surface" />
          ) : session ? (
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  width={28}
                  height={28}
                  className="rounded-full border border-cinema-border shrink-0"
                />
              )}
              {session.user?.username && (
                <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                  {session.user.username}
                </span>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-cinema-muted hover:text-slate-200 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-cinema-bg transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
