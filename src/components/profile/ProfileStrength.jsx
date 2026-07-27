import { useEffect, useState } from "react";

export default function ProfileStrength({ score, gaps }) {
  const [display, setDisplay] = useState(0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const id = requestAnimationFrame(() => setDisplay(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const offset = circumference - (display / 100) * circumference;

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-5">
      <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s ease-out" }}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          transform="rotate(90 50 50)"
          className="fill-text font-header text-[22px] font-extrabold"
        >
          {score}%
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-text">Profile is {score}% complete</p>
        {gaps.length > 0 ? (
          <p className="mt-1 text-sm text-muted">
            Add <span className="text-primary">{gaps[0]}</span> to improve CV tailoring.
          </p>
        ) : (
          <p className="mt-1 text-sm text-accent">Fully stocked — every generated doc will draw on this.</p>
        )}
      </div>
    </div>
  );
}
