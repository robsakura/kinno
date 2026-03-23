"use client";
import { motion } from "framer-motion";
import { GuessPayload, GuessResult, PG_LABELS } from "@/types";
import SliderReveal from "./SliderReveal";

interface ScoreBreakdownProps {
  result: GuessResult;
  guess: GuessPayload;
}

export default function ScoreBreakdown({ result, guess }: ScoreBreakdownProps) {
  const { score, actual } = result;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Total score */}
      <div className="text-center">
        <p className="text-sm text-cinema-muted uppercase tracking-widest mb-1">Total Score</p>
        <motion.p
          className="text-6xl font-black text-gold"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          {Math.round(score.total)}
        </motion.p>
        <p className="text-sm text-cinema-muted mt-1">out of 250</p>
        {result.alreadyGuessed && (
          <p className="mt-2 text-xs text-yellow-400">You already guessed this movie — showing your original result.</p>
        )}
      </div>

      {/* Sliders reveal */}
      <div className="rounded-xl border border-cinema-border bg-cinema-surface p-5 space-y-6">
        <SliderReveal
          label="Release Year"
          icon="📅"
          min={1900}
          max={2026}
          guessValue={guess.yearGuess}
          actualValue={actual.year}
          displayGuess={String(guess.yearGuess)}
          displayActual={String(actual.year)}
          points={score.year}
          delay={0}
        />
        <SliderReveal
          label="IMDb Rating"
          icon="⭐"
          min={1}
          max={10}
          guessValue={guess.ratingGuess}
          actualValue={actual.imdbRating}
          displayGuess={guess.ratingGuess.toFixed(1)}
          displayActual={actual.imdbRating.toFixed(1)}
          points={score.rating}
          delay={0.15}
        />
        <SliderReveal
          label="Sex & Nudity"
          icon="🔞"
          min={0}
          max={3}
          guessValue={guess.sexGuess}
          actualValue={actual.sexNudity}
          displayGuess={PG_LABELS[guess.sexGuess]}
          displayActual={PG_LABELS[actual.sexNudity]}
          points={score.sex}
          delay={0.3}
        />
        <SliderReveal
          label="Violence & Gore"
          icon="⚔️"
          min={0}
          max={3}
          guessValue={guess.violenceGuess}
          actualValue={actual.violenceGore}
          displayGuess={PG_LABELS[guess.violenceGuess]}
          displayActual={PG_LABELS[actual.violenceGore]}
          points={score.violence}
          delay={0.45}
        />
        <SliderReveal
          label="Profanity"
          icon="💬"
          min={0}
          max={3}
          guessValue={guess.profanityGuess}
          actualValue={actual.profanity}
          displayGuess={PG_LABELS[guess.profanityGuess]}
          displayActual={PG_LABELS[actual.profanity]}
          points={score.profanity}
          delay={0.6}
        />
        <SliderReveal
          label="Alcohol & Drugs"
          icon="🍷"
          min={0}
          max={3}
          guessValue={guess.drugsGuess}
          actualValue={actual.alcoholDrugs}
          displayGuess={PG_LABELS[guess.drugsGuess]}
          displayActual={PG_LABELS[actual.alcoholDrugs]}
          points={score.drugs}
          delay={0.75}
        />
        <SliderReveal
          label="Frightening Scenes"
          icon="😱"
          min={0}
          max={3}
          guessValue={guess.frighteningGuess}
          actualValue={actual.frightening}
          displayGuess={PG_LABELS[guess.frighteningGuess]}
          displayActual={PG_LABELS[actual.frightening]}
          points={score.frightening}
          delay={0.9}
        />
      </div>

      {actual.pgDataUncertain && (
        <p className="text-xs text-cinema-muted text-center italic">
          * Parental guide data for this movie may be approximate.
        </p>
      )}
    </motion.div>
  );
}
