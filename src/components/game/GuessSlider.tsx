"use client";

interface GuessSliderProps {
  label: string;
  icon?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  displayValue?: string;
  tickLabels?: string[];
}

export default function GuessSlider({
  label,
  icon,
  min,
  max,
  step,
  value,
  onChange,
  disabled = false,
  displayValue,
  tickLabels,
}: GuessSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </span>
        <span className="min-w-[3rem] rounded-md bg-cinema-surface px-2 py-0.5 text-right text-sm font-bold text-gold">
          {displayValue ?? value}
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, #F59E0B ${percent}%, #334155 ${percent}%)`,
          }}
          aria-label={label}
        />
      </div>

      {tickLabels && (
        <div className="flex justify-between px-0.5">
          {tickLabels.map((t) => (
            <span key={t} className="text-xs text-cinema-muted">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
