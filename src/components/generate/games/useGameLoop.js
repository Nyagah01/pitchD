import { useEffect, useRef } from "react";

// requestAnimationFrame loop that always calls the latest version of `callback`
// (avoids stale closures) and cleanly stops when `active` goes false.
export function useGameLoop(callback, active) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!active) return;
    let frameId;
    let last = performance.now();

    function tick(now) {
      const dt = Math.min(now - last, 50); // cap so a tab-away doesn't cause a huge physics jump
      last = now;
      callbackRef.current(dt);
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active]);
}
