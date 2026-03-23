import { NextResponse } from "next/server";
import { getDailyChallenge } from "@/lib/daily";

export const dynamic = "force-dynamic";

export async function GET() {
  const movie = await getDailyChallenge();
  if (!movie) {
    return NextResponse.json({ error: "No daily challenge available" }, { status: 503 });
  }
  return NextResponse.json(movie);
}
