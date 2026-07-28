import { Award } from "lucide-react";

const TIER_STYLES = {
  gold: { label: "Gold", className: "border-amber-500/40 bg-amber-500/10 text-amber-600" },
  silver: { label: "Silver", className: "border-slate-400/40 bg-slate-400/10 text-slate-500" },
  bronze: { label: "Bronze", className: "border-orange-700/40 bg-orange-700/10 text-orange-700" },
};

export default function CredentialTierBadge({ tier, count }) {
  if (!tier) {
    return <p className="text-xs text-muted">Add a project or certification to start earning a credential tier.</p>;
  }

  const style = TIER_STYLES[tier];
  return (
    <div
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}
    >
      <Award size={13} />
      {style.label} tier
      <span className="font-normal opacity-70">
        · {count} project{count === 1 ? "" : "s"}/certification{count === 1 ? "" : "s"}
      </span>
    </div>
  );
}
