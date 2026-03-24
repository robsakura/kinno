"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TMDbSearchResult } from "@/types";

const IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setOpen(true);
      setLoading(false);
    }, 300);
  }, [query]);

  function handleSelect(movie: TMDbSearchResult) {
    setOpen(false);
    setQuery("");
    router.push(`/game/${movie.tmdbId}`);
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a movie…"
          className="w-full rounded-xl border border-cinema-border bg-cinema-surface pl-9 pr-4 py-3 text-sm text-slate-100 placeholder-cinema-muted outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cinema-muted animate-pulse">
            …
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full rounded-xl border border-cinema-border bg-cinema-surface shadow-2xl z-30 overflow-hidden">
          {results.map((movie) => (
            <button
              key={movie.tmdbId}
              onClick={() => handleSelect(movie)}
              className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-cinema-border transition-colors text-left"
            >
              <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded">
                {movie.posterPath ? (
                  <Image
                    src={`${IMAGE_BASE}/w92${movie.posterPath}`}
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-cinema-bg flex items-center justify-center text-xs">🎬</div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-100">{movie.title}</p>
                {movie.year && (
                  <p className="text-xs text-cinema-muted">{movie.year}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
