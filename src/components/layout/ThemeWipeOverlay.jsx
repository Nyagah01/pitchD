import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "../../lib/ThemeContext";

// Slide in from the left, slight overshoot/bounce as it settles fully covering the
// screen, a brief pause (the real theme swap happens here, see ThemeContext), then
// continues sliding out to the right.
const KEYFRAMES = ["-100%", "4%", "-1%", "0%", "0%", "100%"];
const TIMES = [0, 0.32, 0.4, 0.46, 0.62, 1];
const EASES = ["easeOut", "easeOut", "easeOut", "linear", "easeIn"];

export default function ThemeWipeOverlay() {
  const { wipe, clearWipe } = useTheme();

  return (
    <AnimatePresence>
      {wipe && (
        <motion.div
          key={wipe.key}
          className="pointer-events-none fixed inset-0 z-[999]"
          style={{ backgroundColor: wipe.color }}
          initial={{ x: KEYFRAMES[0] }}
          animate={{ x: KEYFRAMES }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, times: TIMES, ease: EASES }}
          onAnimationComplete={clearWipe}
        />
      )}
    </AnimatePresence>
  );
}
