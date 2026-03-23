import * as cheerio from "cheerio";
import prisma from "./prisma";

export interface ParentalGuideData {
  sexNudity: number;
  violenceGore: number;
  profanity: number;
  alcoholDrugs: number;
  frightening: number;
  uncertain: boolean;
}

function severityToInt(text: string): number {
  const t = text.toLowerCase().trim();
  if (t.includes("none") || t.includes("not applicable")) return 0;
  if (t.includes("mild")) return 1;
  if (t.includes("moderate")) return 2;
  if (t.includes("severe")) return 3;
  return 1; // default mild
}

const SECTION_MAP: Record<string, keyof Omit<ParentalGuideData, "uncertain">> = {
  "advisory-nudity": "sexNudity",
  "advisory-violence": "violenceGore",
  "advisory-language": "profanity",
  "advisory-drugs": "alcoholDrugs",
  "advisory-frightening": "frightening",
};

async function scrapeIMDb(imdbId: string): Promise<ParentalGuideData | null> {
  const url = `https://www.imdb.com/title/${imdbId}/parentalguide/`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const result: Partial<Omit<ParentalGuideData, "uncertain">> = {};

    for (const [sectionId, field] of Object.entries(SECTION_MAP)) {
      const section = $(`section#${sectionId}`);
      // Try the severity pill first (ipl-status-pill or similar)
      const pill = section
        .find(".ipl-status-pill, [class*='severity'], [class*='rating-label']")
        .first()
        .text()
        .trim();
      if (pill) {
        result[field] = severityToInt(pill);
        continue;
      }
      // Fallback: look for the certification/rating text within the section header
      const headerText = section.find("h4, .advisory-title, strong").first().next().text().trim();
      if (headerText) {
        result[field] = severityToInt(headerText);
      }
    }

    const filled = Object.keys(result).length;
    if (filled === 0) return null;

    return {
      sexNudity: result.sexNudity ?? 1,
      violenceGore: result.violenceGore ?? 1,
      profanity: result.profanity ?? 1,
      alcoholDrugs: result.alcoholDrugs ?? 1,
      frightening: result.frightening ?? 1,
      uncertain: filled < 5,
    };
  } catch {
    return null;
  }
}

export async function getParentalGuide(imdbId: string): Promise<ParentalGuideData> {
  // Tier 1: check if already cached in DB with data
  const movie = await prisma.movie.findUnique({ where: { id: imdbId } });
  if (
    movie &&
    !movie.pgDataUncertain &&
    movie.sexNudity !== null
  ) {
    return {
      sexNudity: movie.sexNudity,
      violenceGore: movie.violenceGore,
      profanity: movie.profanity,
      alcoholDrugs: movie.alcoholDrugs,
      frightening: movie.frightening,
      uncertain: false,
    };
  }

  // Tier 2: scrape IMDb
  const scraped = await scrapeIMDb(imdbId);
  if (scraped) return scraped;

  // Tier 3: default to mild across the board, flag as uncertain
  return {
    sexNudity: 1,
    violenceGore: 1,
    profanity: 1,
    alcoholDrugs: 1,
    frightening: 1,
    uncertain: true,
  };
}
