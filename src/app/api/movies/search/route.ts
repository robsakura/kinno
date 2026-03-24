import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { filterMoviesByPGData } from "@/lib/pg-filter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }
  const results = await searchMovies(q);
  const filtered = await filterMoviesByPGData(results);
  return NextResponse.json(filtered);
}
