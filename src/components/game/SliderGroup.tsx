"use client";
import { useState } from "react";
import GuessSlider from "./GuessSlider";
import { GuessPayload, PG_LABELS } from "@/types";

interface SliderGroupProps {
  tmdbId: number;
  onSubmit: (payload: GuessPayload) => void;
  submitting: boolean;
}

const PG_CATEGORIES = [
  { key: "sexGuess" as const, label: "Sex & Nudity", icon: "🔞" },
  { key: "violenceGuess" as const, label: "Violence & Gore", icon: "⚔️" },
  { key: "profanityGuess" as const, label: "Profanity", icon: "💬" },
  { key: "drugsGuess" as const, label: "Alcohol & Drugs", icon: "🍷" },
  { key: "frighteningGuess" as const, label: "Frightening Scenes", icon: "😱" },
];

export default function SliderGroup({ tmdbId, onSubmit, submitting }: SliderGroupProps) {
  const [yearGuess, setYearGuess] = useState(2000);
  const [ratingGuess, setRatingGuess] = useState(5.0);
  const [sexGuess, setSexGuess] = useState(1);
  const [violenceGuess, setViolenceGuess] = useState(1);
  const [profanityGuess, setProfanityGuess] = useState(1);
  const [drugsGuess, setDrugsGuess] = useState(1);
  const [frighteningGuess, setFrighteningGuess] = useState(1);

  const setters: Record<string, (v: number) => void> = {
    sexGuess: setSexGuess,
    violenceGuess: setViolenceGuess,
    profanityGuess: setProfanityGuess,
    drugsGuess: setDrugsGuess,
    frighteningGuess: setFrighteningGuess,
  };
  const values: Record<string, number> = {
    sexGuess,
    violenceGuess,
    profanityGuess,
    drugsGuess,
    frighteningGuess,
  };

  function handleSubmit() {
    onSubmit({
      tmdbId,
      yearGuess,
      ratingGuess: Math.round(ratingGuess * 10) / 10,
      sexGuess,
      violenceGuess,
      profanityGuess,
      drugsGuess,
      frighteningGuess,
    });
  }

  return (
    <div className="space-y-6">
      {/* Year */}
      <div className="rounded-xl border border-cinema-border bg-cinema-surface p-4">
        <GuessSlider
          label="Release Year"
          icon="📅"
          min={1900}
          max={2026}
          step={1}
          value={yearGuess}
          onChange={setYearGuess}
          disabled={submitting}
        />
      </div>

      {/* IMDb Rating */}
      <div className="rounded-xl border border-cinema-border bg-cinema-surface p-4">
        <GuessSlider
          label="IMDb Rating"
          icon="⭐"
          min={1}
          max={10}
          step={0.1}
          value={ratingGuess}
          onChange={setRatingGuess}
          disabled={submitting}
          displayValue={ratingGuess.toFixed(1)}
        />
      </div>

      {/* Parental Guide */}
      <div className="rounded-xl border border-cinema-border bg-cinema-surface p-4 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-cinema-muted">
          Parents Guide
        </p>
        {PG_CATEGORIES.map(({ key, label, icon }) => (
          <GuessSlider
            key={key}
            label={label}
            icon={icon}
            min={0}
            max={3}
            step={1}
            value={values[key]}
            onChange={setters[key]}
            disabled={submitting}
            displayValue={PG_LABELS[values[key]]}
            tickLabels={["None", "Mild", "Moderate", "Severe"]}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-xl bg-gold py-4 text-base font-bold text-cinema-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Checking…" : "Submit Guess"}
      </button>
    </div>
  );
}
