import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../lib/ThemeContext";

// Slides fully covering the screen, slight overshoot/bounce as it settles, a brief
// pause (the real theme swap happens here, see ThemeContext), then continues sliding
// out the far side. Desktop slides left-to-right; mobile slides top-to-bottom instead,
// since it reads more naturally on a narrow, tall viewport.
const KEYFRAMES = ["-100%", "4%", "-1%", "0%", "0%", "100%"];
const TIMES = [0, 0.32, 0.4, 0.46, 0.62, 1];
const EASES = ["easeOut", "easeOut", "easeOut", "linear", "easeIn"];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

export default function ThemeWipeOverlay() {
  const { wipe, clearWipe } = useTheme();
  const isMobile = useIsMobile();
  const axis = isMobile ? "y" : "x";

  return (
    <AnimatePresence>
      {wipe && (
        <motion.div
          key={wipe.key}
          className="pointer-events-none fixed inset-0 z-[999]"
          style={{ backgroundColor: wipe.color }}
          initial={{ [axis]: KEYFRAMES[0] }}
          animate={{ [axis]: KEYFRAMES }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, times: TIMES, ease: EASES }}
          onAnimationComplete={clearWipe}
        />
      )}
    </AnimatePresence>
  );
}
