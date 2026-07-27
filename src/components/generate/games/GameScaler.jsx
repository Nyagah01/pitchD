import { useEffect, useRef, useState } from "react";

// Visually scales a fixed-size game (designed at `width`x`height`) down to fit
// narrower screens via CSS transform, so physics/feel stay identical at every
// size — only the rendered pixels shrink. Never scales up past 1.
export default function GameScaler({ width, height, children }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const available = containerRef.current?.offsetWidth ?? width;
      setScale(Math.min(1, available / width));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width]);

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      <div style={{ width: width * scale, height: height * scale }}>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
      </div>
    </div>
  );
}
