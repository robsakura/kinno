import * as cheerio from "cheerio";
import prisma from "./prisma";
import { getBrowser } from "./browser";

export interface ParentalGuideData {
  sexNudity: number;
  violenceGore: number;
  profanity: number;
  alcoholDrugs: number;
  frightening: number;
  uncertain: boolean;
}

// Returns null if text doesn't contain a recognised severity keyword
function parseSeverity(text: string): number | null {
  const t = text.toLowerCase();
  if (t.includes("severe")) return 3;
  if (t.includes("moderate")) return 2;
  if (t.includes("mild")) return 1;
  if (t.includes("none") || t.includes("not applicable")) return 0;
  return null;
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
  let html: string;
  try {
    // Use a real browser (Playwright) to solve IMDb's AWS WAF JS challenge
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      // Wait for actual page content — WAF challenge resolves then redirects
      await page.waitForSelector("section[id^='advisory-']", { timeout: 10000 });
      html = await page.content();
    } finally {
      await page.close();
    }
    const $ = cheerio.load(html);

    const result: Partial<Omit<ParentalGuideData, "uncertain">> = {};

    for (const [sectionId, field] of Object.entries(SECTION_MAP)) {
      const section = $(`section#${sectionId}`);
      if (!section.length) continue;

      // Strategy 1: explicit pill class (older IMDb design)
      const pill = section.find(".ipl-status-pill").first().text().trim();
      const pillVal = parseSeverity(pill);
      if (pillVal !== null) {
        result[field] = pillVal;
        continue;
      }

      // Strategy 2: data-severity attribute
      const dataSev = section.find("[data-severity]").first().attr("data-severity") ?? "";
      const dataVal = parseSeverity(dataSev);
      if (dataVal !== null) {
        result[field] = dataVal;
        continue;
      }

      // Strategy 3: clone section, strip content entry lists, scan remaining text
      // The severity label always appears in the header area, before <ul> content entries
      const clone = section.clone();
      clone.find("ul, li, .advisory-entries, .advisory-entry, .ipl-zebra-list").remove();
      const headerText = clone.text();
      const headerVal = parseSeverity(headerText);
      if (headerVal !== null) {
        result[field] = headerVal;
        continue;
      }

      // Strategy 4: scan first occurrence of severity word in full section text
      // (last resort — still better than always returning mild)
      const fullText = section.text();
      const match = fullText.match(/\b(none|mild|moderate|severe)\b/i);
      if (match) {
        result[field] = parseSeverity(match[1]) ?? 1;
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
  // Only use cache if data is confirmed (not uncertain)
  const movie = await prisma.movie.findUnique({ where: { id: imdbId } });
  if (movie && !movie.pgDataUncertain) {
    return {
      sexNudity: movie.sexNudity,
      violenceGore: movie.violenceGore,
      profanity: movie.profanity,
      alcoholDrugs: movie.alcoholDrugs,
      frightening: movie.frightening,
      uncertain: false,
    };
  }

  // Scrape IMDb (also re-runs whenever cached data was previously uncertain)
  const scraped = await scrapeIMDb(imdbId);
  if (scraped) return scraped;

  // Fallback: default to mild, flag as uncertain
  return {
    sexNudity: 1,
    violenceGore: 1,
    profanity: 1,
    alcoholDrugs: 1,
    frightening: 1,
    uncertain: true,
  };
}
