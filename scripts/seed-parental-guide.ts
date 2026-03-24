/**
 * Seed parental guide data from the Kaggle "IMDB Parental Guide" dataset.
 * Dataset: https://www.kaggle.com/datasets/barryhaworth/imdb-parental-guide
 *
 * Usage:
 *   1. Download the CSV from Kaggle and place it at: data/imdb_parental_guide.csv
 *   2. Run: npx tsx scripts/seed-parental-guide.ts
 *
 * The CSV is expected to have columns (Barry Haworth dataset):
 *   tconst, sex, violence, profanity, drugs, intense (text labels)
 *   sex_code, violence_code, profanity_code, drug_code, intense_code (numeric 1=None 2=Mild 3=Moderate 4=Severe)
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

    // Prefer numeric codes (1–4 → subtract 1 for 0–3) over text labels
    function codeToInt(code: string, fallbackText: string): number {
      const n = parseInt(code, 10);
      if (!isNaN(n) && n >= 1 && n <= 4) return n - 1;
      return severityToInt(fallbackText);
    }

    const sexNudity    = codeToInt(row["sex_code"],       row["sex"]      || row["sex_nudity"]    || "");
    const violenceGore = codeToInt(row["violence_code"],  row["violence"] || row["violence_gore"] || "");
    const profanity    = codeToInt(row["profanity_code"], row["profanity"]                        || "");
    const alcoholDrugs = codeToInt(row["drug_code"],      row["drugs"]    || row["alcohol_drugs"] || "");
    const frightening  = codeToInt(row["intense_code"],   row["intense"]  || row["frightening"]   || "");

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
