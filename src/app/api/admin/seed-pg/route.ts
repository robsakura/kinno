import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PGRow {
  imdbId: string;
  sexNudity: number;
  violenceGore: number;
  profanity: number;
  alcoholDrugs: number;
  frightening: number;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows: PGRow[] = await req.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows" }, { status: 400 });
  }

  let upserted = 0;
  for (const row of rows) {
    try {
      await prisma.pGData.upsert({
        where: { imdbId: row.imdbId },
        create: row,
        update: {
          sexNudity: row.sexNudity,
          violenceGore: row.violenceGore,
          profanity: row.profanity,
          alcoholDrugs: row.alcoholDrugs,
          frightening: row.frightening,
        },
      });
      // Also sync into Movie if already cached
      await prisma.movie.updateMany({
        where: { id: row.imdbId },
        data: {
          sexNudity: row.sexNudity,
          violenceGore: row.violenceGore,
          profanity: row.profanity,
          alcoholDrugs: row.alcoholDrugs,
          frightening: row.frightening,
          pgDataUncertain: false,
        },
      });
      upserted++;
    } catch {
      // skip bad rows
    }
  }

  return NextResponse.json({ upserted, total: rows.length });
}
