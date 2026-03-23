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

    try {
      await prisma.movie.updateMany({
        where: { id: imdbId },
        data: {
          sexNudity: severityToInt(row["sex_nudity"] || row["sex & nudity"] || row["nudity"] || ""),
          violenceGore: severityToInt(row["violence_gore"] || row["violence & gore"] || row["violence"] || ""),
          profanity: severityToInt(row["profanity"] || row["language"] || ""),
          alcoholDrugs: severityToInt(row["alcohol_drugs"] || row["alcohol, drugs & smoking"] || row["drugs"] || ""),
          frightening: severityToInt(row["frightening"] || row["frightening & intense scenes"] || ""),
          pgDataUncertain: false,
        },
      });
      updated++;
    } catch {
      // skip rows that don't match any movie in DB
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
