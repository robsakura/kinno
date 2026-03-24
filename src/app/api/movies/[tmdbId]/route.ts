import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { getMovieDetail } from "@/lib/tmdb";
import { getImdbRating } from "@/lib/omdb";
import { getParentalGuide } from "@/lib/imdb-parental";
import { MovieData } from "@/types";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(
  _req: NextRequest,
  { params }: { params: { tmdbId: string } }
) {
  const tmdbId = parseInt(params.tmdbId);
  if (isNaN(tmdbId)) {
    return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
  }

  // Check DB cache first (skip if PG data is uncertain)
  const cached = await prisma.movie.findFirst({ where: { tmdbId } });
  if (
    cached &&
    !cached.pgDataUncertain &&
    Date.now() - cached.cachedAt.getTime() < CACHE_TTL_MS
  ) {
    const movie: MovieData = {
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
    return NextResponse.json(movie);
  }

  // Fetch from APIs
  const detail = await getMovieDetail(tmdbId);
  if (!detail) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }
  if (!detail.imdbId) {
    return NextResponse.json({ error: "No IMDb ID for this movie" }, { status: 404 });
  }

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

  const result: MovieData = {
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
  return NextResponse.json(result);
}
