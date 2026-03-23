import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { scoreTotal } from "@/lib/scoring";
import { GuessResult, MovieData } from "@/types";

const GuessSchema = z.object({
  tmdbId: z.number().int().positive(),
  yearGuess: z.number().int().min(1900).max(2026),
  ratingGuess: z.number().min(1).max(10),
  sexGuess: z.number().int().min(0).max(3),
  violenceGuess: z.number().int().min(0).max(3),
  profanityGuess: z.number().int().min(0).max(3),
  drugsGuess: z.number().int().min(0).max(3),
  frighteningGuess: z.number().int().min(0).max(3),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = GuessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid guess data", details: parsed.error.flatten() }, { status: 422 });
  }

  const guess = parsed.data;

  // Fetch movie from DB (must be pre-cached by the game page)
  const movie = await prisma.movie.findFirst({ where: { tmdbId: guess.tmdbId } });
  if (!movie) {
    return NextResponse.json({ error: "Movie not found — load the game page first" }, { status: 404 });
  }

  const actual: MovieData = {
    id: movie.id,
    tmdbId: movie.tmdbId,
    title: movie.title,
    year: movie.year,
    imdbRating: movie.imdbRating,
    sexNudity: movie.sexNudity,
    violenceGore: movie.violenceGore,
    profanity: movie.profanity,
    alcoholDrugs: movie.alcoholDrugs,
    frightening: movie.frightening,
    pgDataUncertain: movie.pgDataUncertain,
    posterPath: movie.posterPath,
  };

  const score = scoreTotal(guess, actual);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Guest — calculate and return score without saving
    const result: GuessResult = {
      score,
      actual,
      alreadyGuessed: false,
      savedToProfile: false,
    };
    return NextResponse.json(result);
  }

  const userId = session.user.id;

  // Check for existing guess
  const existing = await prisma.guess.findUnique({
    where: { userId_movieId: { userId, movieId: movie.id } },
  });

  if (existing) {
    const previousScore = scoreTotal(
      {
        tmdbId: movie.tmdbId,
        yearGuess: existing.yearGuess,
        ratingGuess: existing.ratingGuess,
        sexGuess: existing.sexGuess,
        violenceGuess: existing.violenceGuess,
        profanityGuess: existing.profanityGuess,
        drugsGuess: existing.drugsGuess,
        frighteningGuess: existing.frighteningGuess,
      },
      actual
    );
    const result: GuessResult = {
      score: previousScore,
      actual,
      alreadyGuessed: true,
      savedToProfile: true,
    };
    return NextResponse.json(result);
  }

  // Save guess and update total points
  await prisma.$transaction([
    prisma.guess.create({
      data: {
        userId,
        movieId: movie.id,
        yearGuess: guess.yearGuess,
        ratingGuess: guess.ratingGuess,
        sexGuess: guess.sexGuess,
        violenceGuess: guess.violenceGuess,
        profanityGuess: guess.profanityGuess,
        drugsGuess: guess.drugsGuess,
        frighteningGuess: guess.frighteningGuess,
        pointsEarned: Math.round(score.total),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: Math.round(score.total) } },
    }),
  ]);

  const result: GuessResult = {
    score,
    actual,
    alreadyGuessed: false,
    savedToProfile: true,
  };
  return NextResponse.json(result);
}
