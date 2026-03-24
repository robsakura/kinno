import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getMovieDetail } from "@/lib/tmdb";
import { getImdbRating } from "@/lib/omdb";
import { getParentalGuide } from "@/lib/imdb-parental";
import { scoreTotal } from "@/lib/scoring";
import { GuessPayload, GuessResult, MovieData } from "@/types";
import GameClient from "@/components/game/GameClient";

interface PageProps {
  params: { tmdbId: string };
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function getOrFetchMovie(tmdbId: number): Promise<MovieData | null> {
  const cached = await prisma.movie.findFirst({ where: { tmdbId } });

  // Only use cache when PG data is confirmed and within TTL
  if (
    cached &&
    !cached.pgDataUncertain &&
    Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS
  ) {
    return {
      id: cached.id,
      tmdbId: cached.tmdbId,
      title: cached.title,
      year: cached.year,
      imdbRating: cached.imdbRating,
      sexNudity: cached.sexNudity,
      violenceGore: cached.violenceGore,
      profanity: cached.profanity,
      alcoholDrugs: cached.alcoholDrugs,
      frightening: cached.frightening,
      pgDataUncertain: false,
      posterPath: cached.posterPath,
    };
  }

  // If the movie exists but PG data is uncertain, re-scrape PG only
  if (cached && cached.pgDataUncertain) {
    const pg = await getParentalGuide(cached.id);
    if (!pg.uncertain) {
      await prisma.movie.update({
        where: { id: cached.id },
        data: {
          sexNudity: pg.sexNudity,
          violenceGore: pg.violenceGore,
          profanity: pg.profanity,
          alcoholDrugs: pg.alcoholDrugs,
          frightening: pg.frightening,
          pgDataUncertain: false,
        },
      });
    }
    return {
      id: cached.id,
      tmdbId: cached.tmdbId,
      title: cached.title,
      year: cached.year,
      imdbRating: cached.imdbRating,
      sexNudity: pg.sexNudity,
      violenceGore: pg.violenceGore,
      profanity: pg.profanity,
      alcoholDrugs: pg.alcoholDrugs,
      frightening: pg.frightening,
      pgDataUncertain: pg.uncertain,
      posterPath: cached.posterPath,
    };
  }

  const detail = await getMovieDetail(tmdbId);
  if (!detail || !detail.imdbId) return null;

  const [imdbRating, pg] = await Promise.all([
    getImdbRating(detail.imdbId),
    getParentalGuide(detail.imdbId),
  ]);

  const finalRating = imdbRating ?? 7.0;

  const movie = await prisma.movie.upsert({
    where: { id: detail.imdbId },
    create: {
      id: detail.imdbId,
      tmdbId: detail.tmdbId,
      title: detail.title,
      year: detail.year,
      imdbRating: finalRating,
      sexNudity: pg.sexNudity,
      violenceGore: pg.violenceGore,
      profanity: pg.profanity,
      alcoholDrugs: pg.alcoholDrugs,
      frightening: pg.frightening,
      pgDataUncertain: pg.uncertain,
      posterPath: detail.posterPath,
    },
    update: {
      imdbRating: finalRating,
      sexNudity: pg.sexNudity,
      violenceGore: pg.violenceGore,
      profanity: pg.profanity,
      alcoholDrugs: pg.alcoholDrugs,
      frightening: pg.frightening,
      pgDataUncertain: pg.uncertain,
      posterPath: detail.posterPath,
      cachedAt: new Date(),
    },
  });

  return {
    id: movie.id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    year: movie.year,
    imdbRating: movie.imdbRating,
    sexNudity: movie.sexNudity,
    violenceGore: movie.violenceGore,
    profanity: movie.profanity,
    alcoholDrugs: movie.alcoholDrugs,
    frightening: movie.frightening,
    pgDataUncertain: movie.pgDataUncertain,
    posterPath: movie.posterPath,
  };
}

export default async function GamePage({ params }: PageProps) {
  const tmdbId = parseInt(params.tmdbId);
  if (isNaN(tmdbId)) notFound();

  let movie: MovieData | null = null;
  try {
    movie = await getOrFetchMovie(tmdbId);
  } catch {
    notFound();
  }
  if (!movie) notFound();

  // Block movies without verified PG data
  if (movie.pgDataUncertain) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <p className="text-2xl font-bold text-slate-100">Parental guide data not available</p>
          <p className="text-slate-400">This movie isn&apos;t in our dataset yet.</p>
          <a href="/" className="inline-block mt-4 px-6 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:bg-amber-400 transition">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Check if the logged-in user already guessed this movie
  let initialResult: GuessResult | undefined;
  let initialGuess: GuessPayload | undefined;

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const existing = await prisma.guess.findUnique({
      where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
    });
    if (existing && movie) {
      initialGuess = {
        tmdbId: movie.tmdbId,
        yearGuess: existing.yearGuess,
        ratingGuess: existing.ratingGuess,
        sexGuess: existing.sexGuess,
        violenceGuess: existing.violenceGuess,
        profanityGuess: existing.profanityGuess,
        drugsGuess: existing.drugsGuess,
        frighteningGuess: existing.frighteningGuess,
      };
      initialResult = {
        score: scoreTotal(initialGuess, movie),
        actual: movie,
        alreadyGuessed: true,
        savedToProfile: true,
      };
    }
  }

  return (
    <GameClient
      movie={movie}
      initialResult={initialResult}
      initialGuess={initialGuess}
    />
  );
}
