export default function GenerationLog({ lines, active }) {
  return (
    <div className="window-chrome">
      <div className="window-chrome-bar">
        <span className="window-dot window-dot--red" />
        <span className="window-dot window-dot--yellow" />
        <span className="window-dot window-dot--green" />
        <span className="window-chrome-title">guest@pitchd:~/apply</span>
      </div>
      <div className="terminal-log px-6 py-5 text-[#8ee6a8]">
        {lines.map((line, i) => (
          <p key={i} className="whitespace-pre-wrap">
            <span className="text-white/30">{"> "}</span>
            {line}
          </p>
        ))}
        {active && <span className="inline-block h-3.5 w-2 animate-pulse bg-[#8ee6a8] align-middle" />}
      </div>
    </div>
  );
}
