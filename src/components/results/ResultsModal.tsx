"use client";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { GuessPayload, GuessResult } from "@/types";
import ScoreBreakdown from "./ScoreBreakdown";

interface ResultsModalProps {
  result: GuessResult;
  guess: GuessPayload;
  movieTitle: string;
  onPlayAgain: () => void;
}

export default function ResultsModal({ result, guess, movieTitle, onPlayAgain }: ResultsModalProps) {
  const { data: session } = useSession();

  function handleShare() {
    const text = `🎬 Kinno — ${movieTitle}\n⭐ Score: ${Math.round(result.score.total)}/250\nPlay at kinno.app`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto bg-cinema-bg/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-300">
              {movieTitle}
            </h2>
          </div>

          {/* Guest sign-in prompt */}
          {!session && (
            <motion.div
              className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
            >
              <p className="text-sm font-medium text-gold mb-3">
                Sign in to save your score and climb the leaderboard!
              </p>
              <button
                onClick={() => signIn("google")}
                className="rounded-lg bg-gold px-5 py-2 text-sm font-bold text-cinema-bg hover:opacity-90 transition-opacity"
              >
                Sign in with Google
              </button>
            </motion.div>
          )}

          {result.savedToProfile && (
            <motion.p
              className="text-center text-sm text-green-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              ✓ Score saved to your profile!
            </motion.p>
          )}

          {/* Score breakdown */}
          <ScoreBreakdown result={result} guess={guess} />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border border-cinema-border py-3 text-sm font-semibold text-slate-300 hover:border-gold hover:text-gold transition-colors"
            >
              Share 📋
            </button>
            <button
              onClick={onPlayAgain}
              className="flex-1 rounded-xl bg-gold py-3 text-sm font-bold text-cinema-bg hover:opacity-90 transition-opacity"
            >
              Play Again
            </button>
          </div>

          <div className="text-center">
            <Link href="/leaderboard" className="text-sm text-cinema-muted hover:text-gold transition-colors">
              View Leaderboard →
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
