import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, FileText, Search, BellRing, UploadCloud, Palette, Check } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import { THEMES } from "../lib/theme";
import { CEO_NAME, CEO_TITLE, CEO_MESSAGE_PARAGRAPHS } from "../lib/ceoMessage";
import TypewriterLines from "../components/common/TypewriterLines";

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Dump your whole history",
    body: "Paste everything or upload an old resume. AI structures it into a real profile once — nothing invented, nothing lost.",
  },
  {
    icon: FileText,
    title: "Tailored CVs, on demand",
    body: "Paste any job description and get an ATS-scored, reordered CV and cover letter built only from what's actually true about you.",
  },
  {
    icon: Search,
    title: "Prep that's actually researched",
    body: "Interview questions and coding-test prep grounded in live search on the real company and role — not generic advice.",
  },
  {
    icon: BellRing,
    title: "Never miss a deadline",
    body: "A living pipeline for every application, with reminders for deadlines and interviews before they sneak up on you.",
  },
];

const STEPS = [
  { n: "01", title: "Brain-dump everything", body: "Old resumes, LinkedIn, side projects, certificates — however messy." },
  { n: "02", title: "Paste a job description", body: "One paste. Pitchd matches it against your real profile." },
  { n: "03", title: "Get the whole application", body: "ATS score, CV, cover letter, interview prep — reviewed and saved." },
];

function NavThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-text hover:border-primary/40"
        aria-label="Change appearance"
      >
        <Palette size={15} />
        <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: current.swatch }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="glass-card absolute right-0 z-20 mt-2 w-44 rounded-2xl p-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-text hover:bg-surface-raised"
              >
                <span className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: t.swatch }} />
                <span className="flex-1 text-left">{t.label}</span>
                {t.id === theme && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Landing() {
  const { session, loading } = useAuth();
  const [signatureVisible, setSignatureVisible] = useState(false);
  const ceoLines = CEO_MESSAGE_PARAGRAPHS.map((para) => ({ text: para, className: "text-sm leading-relaxed text-muted" }));
  if (!loading && session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-header text-xl font-extrabold tracking-tight">
            Pitch<span className="text-primary">d</span>
          </span>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-surface p-1 sm:flex">
            <a href="#features" className="rounded-full px-4 py-1.5 text-sm font-medium text-muted hover:text-text">
              Features
            </a>
            <a href="#how-it-works" className="rounded-full px-4 py-1.5 text-sm font-medium text-muted hover:text-text">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <NavThemeSwitcher />
            </div>
            <Link
              to="/login"
              className="rounded-full px-3 py-2 text-sm font-semibold text-text hover:bg-surface-raised sm:px-4"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="cta-glow rounded-full bg-primary px-3 py-2 text-sm font-semibold text-white sm:px-4"
            >
              Register now
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Built for the whole hunt, not just the resume
        </div>
        <h1 className="font-header text-4xl font-light leading-[1.1] tracking-tight sm:text-7xl sm:leading-[1.05]">
          Your career, <span className="font-extrabold text-primary">structured</span>.
          <br />
          Every application, <span className="font-extrabold text-primary">tailored</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg">
          Dump in everything you've ever done. Pitchd turns it into ATS-ready CVs, cover letters, and
          researched interview prep — one job description at a time.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="cta-glow flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Register now <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="w-full rounded-full border border-border bg-surface px-6 py-3 text-center text-sm font-semibold text-text hover:border-primary/40 sm:w-auto"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="window-chrome">
          <div className="window-chrome-bar">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
            <span className="window-chrome-title">guest@pitchd:~/apply</span>
          </div>
          <div className="terminal-log px-6 py-6 text-[#8ee6a8]">
            <p>&gt; Reading profile...</p>
            <p>&gt; Matching against job description...</p>
            <p>&gt; Scoring ATS fit: 87%</p>
            <p>&gt; Drafting tailored CV...</p>
            <p>&gt; Drafting cover letter...</p>
            <p className="text-white">&gt; Done. Review and save whenever you're ready.</p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center font-header text-3xl font-extrabold sm:text-4xl">
          Everything the hunt needs, in one place
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-bold text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-center font-header text-3xl font-extrabold sm:text-4xl">How it works</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map(({ n, title, body }) => (
            <div key={n} className="rounded-2xl border border-border bg-surface p-6">
              <span className="font-header text-3xl font-extrabold text-primary/30">{n}</span>
              <h3 className="mt-3 text-sm font-bold text-text">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-24">
        <div className="glass-card rounded-3xl p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <img
              src="/ceo-photo.jpg"
              alt={CEO_NAME}
              className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
            />
            <p className="text-xs font-medium uppercase tracking-wide text-muted">A word from our founder</p>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <TypewriterLines lines={ceoLines} onDone={() => setSignatureVisible(true)} />
          </div>
          {signatureVisible && (
            <p className="mt-4 text-sm font-semibold text-text">
              {CEO_NAME}, <span className="font-normal text-muted">{CEO_TITLE}</span>
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
        <div className="glass-card rounded-3xl p-6 sm:p-12">
          <h2 className="font-header text-2xl font-extrabold sm:text-4xl">Ready to stop rewriting your CV by hand?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Set up your profile once. Apply everywhere, tailored every time.
          </p>
          <Link
            to="/signup"
            className="cta-glow mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white"
          >
            Register now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted">
        © {new Date().getFullYear()} Pitchd. Built for the whole hunt.
      </footer>
    </div>
  );
}
