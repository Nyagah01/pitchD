import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Send, UserRound, KanbanSquare } from "lucide-react";
import ProfileStrength from "../components/profile/ProfileStrength";
import UpcomingPanel from "../components/applications/UpcomingPanel";
import MomentumPanel from "../components/applications/MomentumPanel";
import { getFullProfile, computeProfileStrength, upsertProfile } from "../lib/profile";
import { listApplications, upcomingReminders } from "../lib/applications";

export default function Dashboard() {
  const [profileData, setProfileData] = useState(null);
  const [applications, setApplications] = useState(null);

  const reload = useCallback(() => {
    getFullProfile().then(setProfileData);
    listApplications().then(setApplications);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const strength = profileData ? computeProfileStrength(profileData) : null;
  const reminders = applications ? upcomingReminders(applications) : [];

  async function handleGoalChange(dailyGoal) {
    await upsertProfile({ daily_goal: dailyGoal });
    reload();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold text-text">
          Welcome back{profileData?.profile?.full_name ? `, ${profileData.profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted">Here's where the hunt stands.</p>
      </div>

      {strength && <ProfileStrength score={strength.score} gaps={strength.gaps} />}

      {applications !== null && (
        <MomentumPanel
          applications={applications}
          dailyGoal={profileData?.profile?.daily_goal ?? 3}
          onGoalChange={handleGoalChange}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/apply"
          className="cta-glow flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4 hover:border-primary/40"
        >
          <Send size={18} className="text-primary" />
          <span className="text-sm font-semibold text-text">Apply for a role</span>
          <span className="text-xs text-muted">Paste a JD, get a tailored CV + cover letter</span>
        </Link>
        <Link
          to="/profile"
          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4 hover:border-primary/40"
        >
          <UserRound size={18} className="text-primary" />
          <span className="text-sm font-semibold text-text">Edit profile</span>
          <span className="text-xs text-muted">Keep your source of truth up to date</span>
        </Link>
        <Link
          to="/applications"
          className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4 hover:border-primary/40"
        >
          <KanbanSquare size={18} className="text-primary" />
          <span className="text-sm font-semibold text-text">View pipeline</span>
          <span className="text-xs text-muted">Track every application's status</span>
        </Link>
      </div>

      {applications !== null && <UpcomingPanel reminders={reminders} />}
    </div>
  );
}
