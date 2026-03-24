import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/browser";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const imdbId = req.nextUrl.searchParams.get("id") ?? "tt0068646";
  const url = `https://www.imdb.com/title/${imdbId}/parentalguide/`;

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    let html = "";
    let timedOut = false;
    try {
      await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
      try {
        await page.waitForSelector("section[id^='advisory-']", { timeout: 10000 });
      } catch {
        timedOut = true;
      }
      html = await page.content();
    } finally {
      await page.close();
    }

    const $ = cheerio.load(html);
    const SECTIONS = ["advisory-nudity", "advisory-violence", "advisory-language", "advisory-drugs", "advisory-frightening"];
    const sectionInfo: Record<string, { found: boolean; pillText: string; headerText: string }> = {};
    for (const id of SECTIONS) {
      const section = $(`section#${id}`);
      if (!section.length) {
        sectionInfo[id] = { found: false, pillText: "", headerText: "" };
        continue;
      }
      const clone = section.clone();
      clone.find("ul, li").remove();
      sectionInfo[id] = {
        found: true,
        pillText: section.find(".ipl-status-pill").first().text().trim(),
        headerText: clone.text().trim().slice(0, 200),
      };
    }

    return NextResponse.json({
      htmlLength: html.length,
      timedOut,
      hasAdvisorySections: SECTIONS.some((id) => sectionInfo[id].found),
      snippet: html.slice(0, 300),
      sections: sectionInfo,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
