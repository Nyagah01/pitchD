function toDateKey(iso) {
  return new Date(iso).toDateString();
}

function distinctActivityDates(applications) {
  const keys = new Set(applications.map((a) => toDateKey(a.created_at)));
  return [...keys].map((k) => new Date(k)).sort((a, b) => b - a);
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function computeStreak(applications) {
  const dates = distinctActivityDates(applications);
  if (dates.length === 0) return 0;

  const today = new Date(new Date().toDateString());
  const mostRecent = dates[0];
  const gapFromToday = Math.round((today - mostRecent) / ONE_DAY);
  if (gapFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i - 1] - dates[i]) / ONE_DAY);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function computeLongestStreak(applications) {
  const dates = distinctActivityDates(applications).sort((a, b) => a - b);
  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i] - dates[i - 1]) / ONE_DAY);
    current = diff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function computeTodayCount(applications) {
  const todayKey = new Date().toDateString();
  return applications.filter((a) => toDateKey(a.created_at) === todayKey).length;
}

export function computeBadges({ applications, streak, longestStreak }) {
  const total = applications.length;
  const hasInterview = applications.some((a) => a.status === "interview" || a.status === "offer");
  const hasOffer = applications.some((a) => a.status === "offer");
  const best = Math.max(streak, longestStreak);

  return [
    { id: "first", label: "First Steps", earned: total >= 1 },
    { id: "streak3", label: "3-Day Streak", earned: best >= 3 },
    { id: "streak7", label: "7-Day Streak", earned: best >= 7 },
    { id: "streak30", label: "30-Day Streak", earned: best >= 30 },
    { id: "ten", label: "10 Sent", earned: total >= 10 },
    { id: "fifty", label: "50 Sent", earned: total >= 50 },
    { id: "interview", label: "Interview Ready", earned: hasInterview },
    { id: "offer", label: "Offer!", earned: hasOffer },
  ];
}
