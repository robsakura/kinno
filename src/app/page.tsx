import { getDailyChallenge } from "@/lib/daily";
import DailyChallenge from "@/components/home/DailyChallenge";
import SearchBar from "@/components/home/SearchBar";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let daily = null;
  try {
    daily = await getDailyChallenge();
  } catch {
    // DB not configured yet — silently fail
  }

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <div className="flex justify-center">
          <Image
            src="/kinno_logo_white.png"
            alt="Kinno"
            width={180}
            height={60}
            className="h-14 w-auto"
            priority
          />
        </div>
        <p className="text-cinema-muted max-w-sm mx-auto text-sm leading-relaxed">
          Guess the release year, IMDb rating, and parental guide ratings of any movie.
        </p>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-cinema-muted">
          Search a Movie
        </p>
        <SearchBar />
      </div>

      {/* Daily challenge */}
      <div className="space-y-3">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-cinema-muted">
          Or Play Today&apos;s Challenge
        </p>
        <DailyChallenge movie={daily} />
      </div>
    </div>
  );
}
