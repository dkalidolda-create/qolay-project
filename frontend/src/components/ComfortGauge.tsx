interface Props {
  score: number;
  label: string;
}

export default function ComfortGauge({ score, label }: Props) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 85
      ? "#14b8a6"
      : score >= 65
        ? "#eab308"
        : score >= 45
          ? "#f97316"
          : "#ef4444";

  return (
    <div className="relative flex flex-col items-center justify-center gap-2">
      <svg width="180" height="180" className="-rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="14"
          fill="none"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke={color}
          strokeWidth="14"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}
