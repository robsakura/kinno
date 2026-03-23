const OMDB_BASE = "https://www.omdbapi.com";

export async function getImdbRating(imdbId: string): Promise<number | null> {
  const key = process.env.OMDB_API_KEY;
  if (!key) return null;

  const url = `${OMDB_BASE}/?i=${imdbId}&apikey=${key}`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.Response === "False" || !data.imdbRating || data.imdbRating === "N/A") {
      return null;
    }
    return parseFloat(data.imdbRating);
  } catch {
    return null;
  }
}
