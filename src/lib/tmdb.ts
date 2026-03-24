import { TMDbSearchResult } from "@/types";

const BASE_URL = "https://api.themoviedb.org/3";
const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const API_KEY = process.env.TMDB_API_KEY;

function authHeaders(): Record<string, string> {
  if (TOKEN) {
    return { Authorization: `Bearer ${TOKEN}` };
  }
  return {};
}

function buildUrl(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  if (!TOKEN && API_KEY) {
    url.searchParams.set("api_key", API_KEY);
  }
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function searchMovies(query: string): Promise<TMDbSearchResult[]> {
  if (!query || query.length < 2) return [];
  const url = buildUrl("/search/movie", { query, include_adult: "false" });
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).slice(0, 8).map((m: Record<string, unknown>) => ({
    tmdbId: m.id as number,
    title: m.title as string,
    year: m.release_date
      ? parseInt((m.release_date as string).split("-")[0])
      : null,
    posterPath: m.poster_path as string | null,
  }));
}

export async function getTrendingMovies(): Promise<TMDbSearchResult[]> {
  const url = buildUrl("/trending/movie/week");
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).slice(0, 20).map((m: Record<string, unknown>) => ({
    tmdbId: m.id as number,
    title: m.title as string,
    year: m.release_date
      ? parseInt((m.release_date as string).split("-")[0])
      : null,
    posterPath: m.poster_path as string | null,
  }));
}

export interface TMDbMovieDetail {
  tmdbId: number;
  title: string;
  year: number;
  posterPath: string | null;
  imdbId: string | null;
}

export async function getTopRatedMovies(page = 1): Promise<TMDbSearchResult[]> {
  const url = buildUrl("/movie/top_rated", { page: String(page) });
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((m: Record<string, unknown>) => ({
    tmdbId: m.id as number,
    title: m.title as string,
    year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
    posterPath: m.poster_path as string | null,
  }));
}

export async function getMoviesByPerson(personId: number): Promise<TMDbSearchResult[]> {
  const url = buildUrl(`/person/${personId}/movie_credits`);
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const cast: Record<string, unknown>[] = data.cast || [];
  return cast
    .filter((m) => m.poster_path && m.release_date)
    .sort((a, b) => (b.popularity as number) - (a.popularity as number))
    .slice(0, 20)
    .map((m) => ({
      tmdbId: m.id as number,
      title: m.title as string,
      year: parseInt((m.release_date as string).split("-")[0]),
      posterPath: m.poster_path as string | null,
    }));
}

export async function getMoviesByGenre(genreId: number): Promise<TMDbSearchResult[]> {
  const url = buildUrl("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "vote_average.desc",
    "vote_count.gte": "1000",
    page: "1",
  });
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).slice(0, 20).map((m: Record<string, unknown>) => ({
    tmdbId: m.id as number,
    title: m.title as string,
    year: m.release_date ? parseInt((m.release_date as string).split("-")[0]) : null,
    posterPath: m.poster_path as string | null,
  }));
}

export async function getMovieDetail(tmdbId: number): Promise<TMDbMovieDetail | null> {
  const url = buildUrl(`/movie/${tmdbId}`, {
    append_to_response: "external_ids",
  });
  const res = await fetch(url, {
    headers: authHeaders(),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const m = await res.json();
  const imdbId: string | null =
    m.external_ids?.imdb_id || m.imdb_id || null;
  const releaseYear = m.release_date
    ? parseInt((m.release_date as string).split("-")[0])
    : 0;
  return {
    tmdbId: m.id,
    title: m.title,
    year: releaseYear,
    posterPath: m.poster_path || null,
    imdbId,
  };
}
