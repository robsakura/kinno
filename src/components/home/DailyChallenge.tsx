import Link from "next/link";
import Image from "next/image";
import { MovieData } from "@/types";

const IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE ?? "https://image.tmdb.org/t/p";

interface DailyChallengeProps {
  movie: MovieData | null;
}

export default function DailyChallenge({ movie }: DailyChallengeProps) {
  if (!movie) {
    return (
      <div className="rounded-2xl border border-cinema-border bg-cinema-surface p-6 text-center">
        <p className="text-cinema-muted">No daily challenge available today.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/30 bg-cinema-surface overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* Blurred poster */}
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
          {movie.posterPath ? (
            <Image
              src={`${IMAGE_BASE}/w92${movie.posterPath}`}
              alt="Daily Challenge"
              fill
              className="object-cover blur-md scale-110"
            />
          ) : (
            <div className="h-full w-full bg-cinema-bg flex items-center justify-center text-2xl">🎬</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-gold">Today&apos;s Challenge</span>
          <p className="text-sm text-cinema-muted mt-0.5">
            Can you guess today&apos;s mystery movie?
          </p>
        </div>

        <Link
          href={`/game/${movie.tmdbId}`}
          className="shrink-0 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-cinema-bg hover:opacity-90 transition-opacity"
        >
          Play
        </Link>
      </div>
    </div>
  );
}
