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
  if (cached && Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS) {
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
      pgDataUncertain: cached.pgDataUncertain,
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
