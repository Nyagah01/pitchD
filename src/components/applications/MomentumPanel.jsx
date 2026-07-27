import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Pencil, Check } from "lucide-react";
import { computeStreak, computeLongestStreak, computeTodayCount, computeBadges } from "../../lib/gamification";

export default function MomentumPanel({ applications, dailyGoal, onGoalChange }) {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(dailyGoal);
  const [saving, setSaving] = useState(false);

  const streak = computeStreak(applications);
  const longestStreak = computeLongestStreak(applications);
  const todayCount = computeTodayCount(applications);
  const badges = computeBadges({ applications, streak, longestStreak });

  async function saveGoal() {
    const value = Math.max(1, Number(goalDraft) || 1);
    setSaving(true);
    try {
      await onGoalChange(value);
      setEditingGoal(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-card flex flex-col gap-5 rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.1, 1.02, 1.08, 1], rotate: [0, -2, 2, -1, 0] } : {}}
            transition={streak > 0 ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            <Flame
              size={24}
              fill={streak > 0 ? "currentColor" : "none"}
              strokeWidth={streak > 0 ? 1.5 : 2}
              className={streak > 0 ? "text-orange-500" : "text-muted opacity-40"}
              style={
                streak > 0
                  ? { filter: "drop-shadow(0 0 7px rgba(249,115,22,0.7)) drop-shadow(0 0 2px rgba(250,204,21,0.5))" }
                  : undefined
              }
            />
          </motion.div>
          <div>
            <p className="text-lg font-extrabold text-text">{streak}-day streak</p>
            <p className="text-xs text-muted">
              {streak > 0 ? `Best: ${longestStreak} days` : "Apply today to light it up"}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
            <span>
              Today's goal: {todayCount} / {dailyGoal}
            </span>
            {editingGoal ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  className="w-14 rounded-lg border border-border bg-bg px-2 py-0.5 text-xs text-text outline-none focus:border-primary"
                />
                <button onClick={saveGoal} disabled={saving} className="text-primary hover:opacity-80">
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setGoalDraft(dailyGoal);
                  setEditingGoal(true);
                }}
                className="flex items-center gap-1 text-muted hover:text-text"
              >
                <Pencil size={11} /> Set goal
              </button>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b.id}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              b.earned
                ? "border-primary/30 bg-primary-soft text-primary"
                : "border-border text-muted opacity-50"
            }`}
          >
            {b.label}
          </span>
        ))}
      </div>
    </section>
  );
}
