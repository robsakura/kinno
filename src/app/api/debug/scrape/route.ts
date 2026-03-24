import { NextRequest, NextResponse } from "next/server";
import { getParentalGuide } from "@/lib/imdb-parental";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const imdbId = req.nextUrl.searchParams.get("id") ?? "tt0068646";
  try {
    const pg = await getParentalGuide(imdbId);
    return NextResponse.json({ imdbId, ...pg });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
