import { NextRequest, NextResponse } from "next/server";
import {
  getTopRatedMovies,
  getMoviesByPerson,
  getMoviesByGenre,
} from "@/lib/tmdb";
import { TMDbSearchResult } from "@/types";
import { filterMoviesByPGData } from "@/lib/pg-filter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "top_rated";

  let movies: TMDbSearchResult[];
  if (type === "top_rated") {
    movies = await getTopRatedMovies(1);
  } else if (type.startsWith("person:")) {
    const id = parseInt(type.split(":")[1]);
    movies = await getMoviesByPerson(id);
  } else if (type.startsWith("genre:")) {
    const id = parseInt(type.split(":")[1]);
    movies = await getMoviesByGenre(id);
  } else {
    movies = [];
  }

  const filtered = await filterMoviesByPGData(movies);
  return NextResponse.json(filtered);
}
