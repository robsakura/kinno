import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }
  const results = await searchMovies(q);
  return NextResponse.json(results);
}
