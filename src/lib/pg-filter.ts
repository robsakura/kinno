/**
 * Filters a list of TMDb movies to only those with verified parental guide data
 * in the PGData table (seeded from the Kaggle dataset).
 */
import prisma from "./prisma";
import { getMovieDetail } from "./tmdb";
import { TMDbSearchResult } from "@/types";

export async function filterMoviesByPGData(
  movies: TMDbSearchResult[]
): Promise<TMDbSearchResult[]> {
  if (movies.length === 0) return [];

  const tmdbIds = movies.map((m) => m.tmdbId);

  // Check which ones we already know about (Movie cache has imdbId → PGData linkable)
  const cached = await prisma.movie.findMany({
    where: { tmdbId: { in: tmdbIds } },
    select: { tmdbId: true, id: true },
  });
  const cachedMap = new Map(cached.map((c) => [c.tmdbId, c.id]));

  // For cached movies, check PGData directly
  const cachedImdbIds = cached.map((c) => c.id);
  const pgRows = cachedImdbIds.length > 0
    ? await prisma.pGData.findMany({
        where: { imdbId: { in: cachedImdbIds } },
        select: { imdbId: true },
      })
    : [];
  const pgSet = new Set(pgRows.map((r) => r.imdbId));

  // For movies NOT in our cache, fetch IMDb ID from TMDb and check PGData
  const uncachedMovies = movies.filter((m) => !cachedMap.has(m.tmdbId));
  const resolvedImdbIds = new Map<number, string>(); // tmdbId → imdbId

  if (uncachedMovies.length > 0) {
    const details = await Promise.all(
      uncachedMovies.map((m) => getMovieDetail(m.tmdbId))
    );
    const newImdbIds: string[] = [];
    details.forEach((d, i) => {
      if (d?.imdbId) {
        resolvedImdbIds.set(uncachedMovies[i].tmdbId, d.imdbId);
        newImdbIds.push(d.imdbId);
      }
    });

    if (newImdbIds.length > 0) {
      const newPgRows = await prisma.pGData.findMany({
        where: { imdbId: { in: newImdbIds } },
        select: { imdbId: true },
      });
      newPgRows.forEach((r) => pgSet.add(r.imdbId));
    }
  }

  return movies.filter((m) => {
    const imdbId = cachedMap.get(m.tmdbId) ?? resolvedImdbIds.get(m.tmdbId);
    return imdbId !== undefined && pgSet.has(imdbId);
  });
}
