import { DefaultSession } from "next-auth";

// Augment NextAuth session to include user id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export interface MovieData {
  id: string;       // IMDb ID
  tmdbId: number;
  title: string;
  year: number;
  imdbRating: number;
  sexNudity: number;
  violenceGore: number;
  profanity: number;
  alcoholDrugs: number;
  frightening: number;
  pgDataUncertain: boolean;
  posterPath: string | null;
}

export interface TMDbSearchResult {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
}

export interface GuessPayload {
  tmdbId: number;
  yearGuess: number;
  ratingGuess: number;
  sexGuess: number;
  violenceGuess: number;
  profanityGuess: number;
  drugsGuess: number;
  frighteningGuess: number;
}

export interface ScoreResult {
  year: number;
  rating: number;
  sex: number;
  violence: number;
  profanity: number;
  drugs: number;
  frightening: number;
  total: number;
}

export interface GuessResult {
  score: ScoreResult;
  actual: MovieData;
  alreadyGuessed: boolean;
  savedToProfile: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string | null;
  image: string | null;
  totalPoints: number;
}

export type PGSeverity = 0 | 1 | 2 | 3;

export const PG_LABELS: Record<number, string> = {
  0: "None",
  1: "Mild",
  2: "Moderate",
  3: "Severe",
};

export const PG_CATEGORIES = [
  { key: "sexGuess" as const, label: "Sex & Nudity", icon: "🔞", actualKey: "sexNudity" as const },
  { key: "violenceGuess" as const, label: "Violence & Gore", icon: "⚔️", actualKey: "violenceGore" as const },
  { key: "profanityGuess" as const, label: "Profanity", icon: "💬", actualKey: "profanity" as const },
  { key: "drugsGuess" as const, label: "Alcohol & Drugs", icon: "🍷", actualKey: "alcoholDrugs" as const },
  { key: "frighteningGuess" as const, label: "Frightening Scenes", icon: "😱", actualKey: "frightening" as const },
];
