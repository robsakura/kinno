import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const imdbId = req.nextUrl.searchParams.get("id") ?? "tt0068646";
  const url = `https://www.imdb.com/title/${imdbId}/parentalguide/`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const SECTIONS = [
      "advisory-nudity",
      "advisory-violence",
      "advisory-language",
      "advisory-drugs",
      "advisory-frightening",
    ];

    const sectionInfo: Record<string, { found: boolean; pillText: string; headerText: string; firstWords: string }> = {};
    for (const id of SECTIONS) {
      const section = $(`section#${id}`);
      if (!section.length) {
        sectionInfo[id] = { found: false, pillText: "", headerText: "", firstWords: "" };
        continue;
      }
      const clone = section.clone();
      clone.find("ul, li").remove();
      sectionInfo[id] = {
        found: true,
        pillText: section.find(".ipl-status-pill").first().text().trim(),
        headerText: clone.text().trim().slice(0, 200),
        firstWords: section.text().slice(0, 200),
      };
    }

    return NextResponse.json({
      status: res.status,
      wafAction: res.headers.get("x-amzn-waf-action"),
      htmlLength: html.length,
      hasAdvisorySections: SECTIONS.some((id) => sectionInfo[id].found),
      snippet: html.slice(0, 500),
      sections: sectionInfo,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
