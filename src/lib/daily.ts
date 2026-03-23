import prisma from "./prisma";
import { getTrendingMovies } from "./tmdb";
import { getMovieDetail } from "./tmdb";
import { getImdbRating } from "./omdb";
import { getParentalGuide } from "./imdb-parental";
import { MovieData } from "@/types";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickIndex(list: unknown[], dateStr: string): number {
  const seed = dateStr
    .replace(/-/g, "")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return seed % list.length;
}

export async function getDailyChallenge(): Promise<MovieData | null> {
  const today = todayString();

  // Check if today's challenge is already cached
  const cached = await prisma.dailyChallenge.findUnique({
    where: { date: today },
    include: { movie: true },
  });
  if (cached) {
    const m = cached.movie;
    return {
      id: m.id,
      tmdbId: m.tmdbId,
      title: m.title,
      year: m.year,
      imdbRating: m.imdbRating,
      sexNudity: m.sexNudity,
      violenceGore: m.violenceGore,
      profanity: m.profanity,
      alcoholDrugs: m.alcoholDrugs,
      frightening: m.frightening,
      pgDataUncertain: m.pgDataUncertain,
      posterPath: m.posterPath,
    };
  }

  // Pick a movie from trending
  const trending = await getTrendingMovies();
  if (!trending.length) return null;

  const pick = trending[pickIndex(trending, today)];
  const detail = await getMovieDetail(pick.tmdbId);
  if (!detail || !detail.imdbId) return null;

  const imdbRating = (await getImdbRating(detail.imdbId)) ?? 7.0;
  const pg = await getParentalGuide(detail.imdbId);

  // Upsert movie
  const movie = await prisma.movie.upsert({
    where: { id: detail.imdbId },
    create: {
      id: detail.imdbId,
      tmdbId: detail.tmdbId,
      title: detail.title,
      year: detail.year,
      imdbRating,
      sexNudity: pg.sexNudity,
      violenceGore: pg.violenceGore,
      profanity: pg.profanity,
      alcoholDrugs: pg.alcoholDrugs,
      frightening: pg.frightening,
      pgDataUncertain: pg.uncertain,
      posterPath: detail.posterPath,
    },
    update: {
      cachedAt: new Date(),
    },
  });

  // Record daily challenge
  await prisma.dailyChallenge.upsert({
    where: { date: today },
    create: { date: today, movieId: movie.id },
    update: {},
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
