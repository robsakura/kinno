import { GuessPayload, MovieData, ScoreResult } from "@/types";

export function scoreYear(guess: number, actual: number): number {
  return Math.max(0, 100 - Math.abs(guess - actual) * 10);
}

export function scoreRating(guess: number, actual: number): number {
  const raw = 50 - Math.abs(guess - actual) * 5;
  return Math.round(Math.max(0, raw) * 10) / 10;
}

export function scorePg(guess: number, actual: number): number {
  return guess === actual ? 20 : 0;
}

export function scoreTotal(guess: GuessPayload, actual: MovieData): ScoreResult {
  const year = scoreYear(guess.yearGuess, actual.year);
  const rating = scoreRating(guess.ratingGuess, actual.imdbRating);
  const sex = scorePg(guess.sexGuess, actual.sexNudity);
  const violence = scorePg(guess.violenceGuess, actual.violenceGore);
  const profanity = scorePg(guess.profanityGuess, actual.profanity);
  const drugs = scorePg(guess.drugsGuess, actual.alcoholDrugs);
  const frightening = scorePg(guess.frighteningGuess, actual.frightening);
  const total = year + rating + sex + violence + profanity + drugs + frightening;
  return { year, rating, sex, violence, profanity, drugs, frightening, total };
}
