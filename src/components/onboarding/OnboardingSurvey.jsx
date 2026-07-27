import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const QUESTIONS = [
  { id: "name", title: "What's your name?", type: "name" },
  {
    id: "experienceLevel",
    title: "Which best describes your experience?",
    type: "single",
    options: ["No experience", "Less than 1 year", "1–2 years", "3–5 years", "5+ years"],
  },
  {
    id: "referralSource",
    title: "Where did you hear about Pitchd?",
    type: "single",
    options: ["Twitter / X", "Google search", "A friend or colleague", "LinkedIn", "Other"],
  },
  {
    id: "goals",
    title: "What are you looking to use Pitchd for?",
    subtitle: "Pick as many as apply.",
    type: "multi",
    options: [
      "Landing a new job",
      "A side hustle",
      "ATS-friendly CVs & cover letters",
      "Managing my applications",
      "Interview prep",
      "Other",
    ],
  },
];

function OptionButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
        selected ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-text hover:border-primary/40"
      }`}
    >
      {label}
      {selected && <Check size={16} />}
    </button>
  );
}

export default function OnboardingSurvey({ onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [goals, setGoals] = useState([]);

  const question = QUESTIONS[stepIndex];
  const isLast = stepIndex === QUESTIONS.length - 1;

  function canAdvance() {
    if (question.type === "name") return firstName.trim() && lastName.trim();
    return true;
  }

  function toggleGoal(option) {
    setGoals((g) => (g.includes(option) ? g.filter((x) => x !== option) : [...g, option]));
  }

  function finish() {
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
    onComplete({ fullName, experienceLevel, referralSource, goals });
  }

  function goNext() {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function skip() {
    if (isLast) finish();
    else goNext();
  }

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between text-xs font-medium text-muted">
        <span>
          Question {stepIndex + 1} of {QUESTIONS.length}
        </span>
        <div className="flex gap-1">
          {QUESTIONS.map((q, i) => (
            <span
              key={q.id}
              className={`h-1.5 w-6 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div key={question.id} className="flashcard-enter">
          <h2 className="text-lg font-bold text-text">{question.title}</h2>
          {question.subtitle && <p className="mt-1 text-sm text-muted">{question.subtitle}</p>}

          <div className="mt-5 flex flex-col gap-3">
            {question.type === "name" && (
              <>
                <input
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
                <input
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Middle name (optional)"
                  className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
              </>
            )}

            {question.type === "single" &&
              question.options.map((opt) => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={(question.id === "experienceLevel" ? experienceLevel : referralSource) === opt}
                  onClick={() =>
                    question.id === "experienceLevel" ? setExperienceLevel(opt) : setReferralSource(opt)
                  }
                />
              ))}

            {question.type === "multi" &&
              question.options.map((opt) => (
                <OptionButton key={opt} label={opt} selected={goals.includes(opt)} onClick={() => toggleGoal(opt)} />
              ))}
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-text disabled:opacity-0"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="flex items-center gap-4">
          {question.type !== "name" && (
            <button type="button" onClick={skip} className="text-xs font-medium text-muted hover:text-text">
              Skip
            </button>
          )}
          <button
            type="button"
            disabled={!canAdvance()}
            onClick={goNext}
            className="cta-glow flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLast ? "Continue" : "Next"} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
