/**
 * Seed parental guide data from the Kaggle "IMDB Parental Guide" dataset.
 * Dataset: https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide
 *
 * Usage:
 *   1. Download the CSV from Kaggle and place it at: data/imdb_parental_guide.csv
 *   2. Run: npx tsx scripts/seed-parental-guide.ts
 *
 * The CSV is expected to have columns:
 *   imdb_id, sex_nudity, violence_gore, profanity, alcohol_drugs, frightening
 *   with severity values: "None", "Mild", "Moderate", "Severe"
 */

import { createReadStream } from "fs";
import { createInterface } from "readline";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function severityToInt(text: string): number {
  const t = text.toLowerCase().trim();
  if (t === "none" || t === "") return 0;
  if (t === "mild") return 1;
  if (t === "moderate") return 2;
  if (t === "severe") return 3;
  return 1;
}

async function main() {
  const csvPath = "./data/imdb_parental_guide.csv";
  console.log(`Reading from ${csvPath}…`);

  const rl = createInterface({
    input: createReadStream(csvPath),
    crlfDelay: Infinity,
  });

  let header: string[] = [];
  let count = 0;
  let updated = 0;

  for await (const line of rl) {
    if (!header.length) {
      header = line.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      console.log("Columns:", header);
      continue;
    }

    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = values[i] ?? ""));

    const imdbId = row["imdb_id"] || row["tconst"] || row["id"];
    if (!imdbId || !imdbId.startsWith("tt")) continue;

    count++;

    const sexNudity    = severityToInt(row["sex_nudity"]    || row["sex & nudity"]                   || row["nudity"]   || "");
    const violenceGore = severityToInt(row["violence_gore"] || row["violence & gore"]                 || row["violence"] || "");
    const profanity    = severityToInt(row["profanity"]     || row["language"]                        || "");
    const alcoholDrugs = severityToInt(row["alcohol_drugs"] || row["alcohol, drugs & smoking"]        || row["drugs"]    || "");
    const frightening  = severityToInt(row["frightening"]   || row["frightening & intense scenes"]    || "");

    try {
      // Upsert into the dedicated PGData table (works regardless of play history)
      await prisma.pGData.upsert({
        where: { imdbId },
        create: { imdbId, sexNudity, violenceGore, profanity, alcoholDrugs, frightening },
        update: { sexNudity, violenceGore, profanity, alcoholDrugs, frightening },
      });

      // Also update the Movie table if the movie has been played
      await prisma.movie.updateMany({
        where: { id: imdbId },
        data: { sexNudity, violenceGore, profanity, alcoholDrugs, frightening, pgDataUncertain: false },
      });
      updated++;
    } catch {
      // skip
    }

    if (count % 1000 === 0) {
      console.log(`Processed ${count} rows, updated ${updated} movies…`);
    }
  }

  console.log(`Done. Processed ${count} rows, updated ${updated} movies.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
