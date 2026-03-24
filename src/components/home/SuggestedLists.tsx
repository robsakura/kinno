"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { TMDbSearchResult } from "@/types";

const LISTS = [
  { id: "top_rated", label: "Top Rated All Time" },
  { id: "person:500", label: "Tom Cruise" },
  { id: "person:6193", label: "Leonardo DiCaprio" },
  { id: "person:525", label: "Christopher Nolan" },
  { id: "person:488", label: "Steven Spielberg" },
  { id: "person:190", label: "Clint Eastwood" },
  { id: "person:1245", label: "Scarlett Johansson" },
  { id: "genre:28", label: "Action Classics" },
  { id: "genre:878", label: "Sci-Fi" },
  { id: "genre:27", label: "Horror" },
  { id: "genre:35", label: "Comedy" },
  { id: "genre:18", label: "Drama" },
];

const IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE ?? "https://image.tmdb.org/t/p";

export default function SuggestedLists() {
  const [activeList, setActiveList] = useState(LISTS[0].id);
  const [movies, setMovies] = useState<TMDbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMovies([]);
    fetch(`/api/movies/list?type=${encodeURIComponent(activeList)}`)
      .then((r) => r.json())
      .then((data) => {
        setMovies(Array.isArray(data) ? data : []);
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [activeList]);

  return (
    <div className="space-y-3">
      {/* Scrollable list tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {LISTS.map((list) => (
          <button
            key={list.id}
            onClick={() => setActiveList(list.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeList === list.id
                ? "bg-gold text-cinema-bg"
                : "bg-cinema-surface text-cinema-muted border border-cinema-border hover:text-slate-200"
            }`}
          >
            {list.label}
          </button>
        ))}
      </div>

      {/* Movie poster row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-24 h-36 rounded-lg bg-cinema-surface animate-pulse"
              />
            ))
          : movies.map((movie) => (
              <Link
                key={movie.tmdbId}
                href={`/game/${movie.tmdbId}`}
                className="shrink-0 group relative w-24 rounded-lg overflow-hidden border border-cinema-border hover:border-gold/60 transition-colors"
              >
                {movie.posterPath ? (
                  <Image
                    src={`${IMAGE_BASE}/w185${movie.posterPath}`}
                    alt={movie.title}
                    width={96}
                    height={144}
                    className="w-full h-36 object-cover"
                  />
                ) : (
                  <div className="w-full h-36 bg-cinema-surface flex items-center justify-center text-2xl">
                    🎬
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white leading-tight line-clamp-2">
                    {movie.title}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
