"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GuessPayload, GuessResult, MovieData } from "@/types";
import MoviePoster from "./MoviePoster";
import SliderGroup from "./SliderGroup";
import ResultsModal from "@/components/results/ResultsModal";

interface GameClientProps {
  movie: MovieData;
  initialResult?: GuessResult;
  initialGuess?: GuessPayload;
}

export default function GameClient({ movie, initialResult, initialGuess }: GameClientProps) {
  const [result, setResult] = useState<GuessResult | null>(initialResult ?? null);
  const [lastGuess, setLastGuess] = useState<GuessPayload | null>(initialGuess ?? null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(guess: GuessPayload) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guess),
      });
      const data: GuessResult = await res.json();
      setLastGuess(guess);
      setResult(data);
    } catch {
      // silently keep submitting state
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <MoviePoster title={movie.title} posterPath={movie.posterPath} />
      <SliderGroup
        tmdbId={movie.tmdbId}
        onSubmit={handleSubmit}
        submitting={submitting || result !== null}
      />
      {result && lastGuess && (
        <ResultsModal
          result={result}
          guess={lastGuess}
          movieTitle={movie.title}
          onPlayAgain={() => router.push("/")}
        />
      )}
    </div>
  );
}
