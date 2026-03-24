/**
 * Reads the Kaggle IMDB Parental Guide CSV and POSTs batches to the deployed app's
 * /api/admin/seed-pg endpoint.
 *
 * Usage:
 *   ADMIN_SEED_SECRET=<secret> APP_URL=https://kinno.rsapps.ca npx tsx scripts/push-pg-seed.ts
 */

import { createReadStream } from "fs";
import { createInterface } from "readline";

const APP_URL = process.env.APP_URL ?? "https://kinno.rsapps.ca";
const SECRET = process.env.ADMIN_SEED_SECRET ?? "";
const CSV_PATH = "./data/IMDB_parental_guide.csv";
const BATCH_SIZE = 500;

function severityToInt(text: string): number {
  const t = text.toLowerCase().trim();
  if (t === "none" || t === "") return 0;
  if (t === "mild") return 1;
  if (t === "moderate") return 2;
  if (t === "severe") return 3;
  return 1;
}

function codeToInt(code: string, fallbackText: string): number {
  const n = parseInt(code, 10);
  if (!isNaN(n) && n >= 1 && n <= 4) return n - 1;
  return severityToInt(fallbackText);
}

async function postBatch(batch: object[]): Promise<number> {
  const res = await fetch(`${APP_URL}/api/admin/seed-pg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": SECRET,
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json() as { upserted: number };
  return json.upserted;
}

async function main() {
  if (!SECRET) {
    console.error("ADMIN_SEED_SECRET env var required");
    process.exit(1);
  }

  console.log(`Reading ${CSV_PATH} → posting to ${APP_URL}/api/admin/seed-pg`);

  const rl = createInterface({
    input: createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  let header: string[] = [];
  let batch: object[] = [];
  let totalRows = 0;
  let totalUpserted = 0;
  let batchNum = 0;

  for await (const line of rl) {
    if (!header.length) {
      header = line.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
      console.log("Columns:", header);
      continue;
    }

    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = values[i] ?? ""));

    const imdbId = row["tconst"] || row["imdb_id"] || row["id"];
    if (!imdbId || !imdbId.startsWith("tt")) continue;

    batch.push({
      imdbId,
      sexNudity:    codeToInt(row["sex_code"],       row["sex"]      || row["sex_nudity"]    || ""),
      violenceGore: codeToInt(row["violence_code"],  row["violence"] || row["violence_gore"] || ""),
      profanity:    codeToInt(row["profanity_code"], row["profanity"]                        || ""),
      alcoholDrugs: codeToInt(row["drug_code"],      row["drugs"]    || row["alcohol_drugs"] || ""),
      frightening:  codeToInt(row["intense_code"],   row["intense"]  || row["frightening"]   || ""),
    });
    totalRows++;

    if (batch.length >= BATCH_SIZE) {
      batchNum++;
      const upserted = await postBatch(batch);
      totalUpserted += upserted;
      console.log(`Batch ${batchNum}: ${upserted}/${batch.length} upserted (total ${totalRows} rows, ${totalUpserted} upserted)`);
      batch = [];
    }
  }

  // Final batch
  if (batch.length > 0) {
    batchNum++;
    const upserted = await postBatch(batch);
    totalUpserted += upserted;
    console.log(`Batch ${batchNum}: ${upserted}/${batch.length} upserted`);
  }

  console.log(`\nDone. ${totalRows} rows processed, ${totalUpserted} upserted.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
