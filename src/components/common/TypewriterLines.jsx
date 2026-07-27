import { useEffect, useRef, useState } from "react";

export default function TypewriterLines({ lines, speed = 14, gap = 260, onDone }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (lineIndex >= lines.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }
    const current = lines[lineIndex].text;
    if (charIndex >= current.length) {
      const t = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      }, gap);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCharIndex((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [lineIndex, charIndex, lines, speed, gap, onDone]);

  return (
    <>
      {lines.slice(0, lineIndex).map((line, i) => (
        <p key={i} className={line.className}>
          {line.text}
        </p>
      ))}
      {lineIndex < lines.length && (
        <p className={lines[lineIndex].className}>
          {lines[lineIndex].text.slice(0, charIndex)}
          <span className="typewriter-cursor" aria-hidden="true" />
        </p>
      )}
    </>
  );
}
