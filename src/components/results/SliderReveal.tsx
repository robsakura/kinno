"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SliderRevealProps {
  label: string;
  icon?: string;
  min: number;
  max: number;
  guessValue: number;
  actualValue: number;
  displayGuess: string;
  displayActual: string;
  points: number;
  delay?: number;
}

export default function SliderReveal({
  label,
  icon,
  min,
  max,
  guessValue,
  actualValue,
  displayGuess,
  displayActual,
  points,
  delay = 0,
}: SliderRevealProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay * 1000 + 300);
    return () => clearTimeout(t);
  }, [delay]);

  const guessPercent = ((guessValue - min) / (max - min)) * 100;
  const actualPercent = ((actualValue - min) / (max - min)) * 100;
  const isExact = guessValue === actualValue;
  const isClose =
    !isExact &&
    (Math.abs(guessValue - actualValue) <= 1 ||
      (typeof guessValue === "number" && Math.abs(guessValue - actualValue) <= 0.5));

  const thumbColor = isExact
    ? "#22c55e"   // green
    : isClose
    ? "#eab308"   // yellow
    : "#ef4444";  // red

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </span>
        <span
          className={`text-sm font-bold ${
            isExact ? "text-green-400" : isClose ? "text-yellow-400" : "text-red-400"
          }`}
        >
          +{points}
        </span>
      </div>

      {/* Custom animatable slider */}
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="relative w-full h-1.5 rounded-full bg-cinema-border overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ backgroundColor: thumbColor }}
            initial={{ width: `${guessPercent}%` }}
            animate={{ width: revealed ? `${actualPercent}%` : `${guessPercent}%` }}
            transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>

        {/* Guess marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-slate-400 bg-cinema-bg z-10"
          style={{ left: `${guessPercent}%`, transform: "translateX(-50%) translateY(-50%)" }}
          title={`Your guess: ${displayGuess}`}
        />

        {/* Actual position thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-20 shadow-lg"
          style={{
            backgroundColor: thumbColor,
            left: `${guessPercent}%`,
            transform: "translateX(-50%) translateY(-50%)",
          }}
          animate={{
            left: revealed ? `${actualPercent}%` : `${guessPercent}%`,
          }}
          transition={{ duration: 0.8, delay, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>

      <div className="flex justify-between text-xs text-cinema-muted">
        <span>
          Your guess: <span className="text-slate-300 font-medium">{displayGuess}</span>
        </span>
        <span>
          Actual: <span className="font-bold text-slate-100">{displayActual}</span>
        </span>
      </div>
    </div>
  );
}
