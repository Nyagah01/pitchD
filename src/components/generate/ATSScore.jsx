import { useEffect, useState } from "react";

export default function ATSScore({ score, gaps }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const duration = 900;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(progress * score));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const color = score >= 75 ? "text-accent" : score >= 50 ? "text-primary" : "text-danger";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-baseline gap-2">
        <span className={`font-header text-4xl font-extrabold ${color}`}>{display}%</span>
        <span className="text-sm text-muted">ATS match</span>
      </div>
      {gaps?.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-sm text-muted">
          {gaps.map((gap, i) => (
            <li key={i}>· {gap}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
