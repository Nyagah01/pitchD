import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  signInWithPassword,
  signInWithMagicLink,
  signInWithGoogle,
  signInWithLinkedIn,
  resetPasswordForEmail,
} from "../lib/auth";
import { useAuth } from "../lib/AuthContext";
import { friendlyError } from "../lib/friendlyError";

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  async function handlePasswordLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signInWithPassword(email, password);
    setBusy(false);
    if (error) setError(friendlyError(error));
    else navigate("/dashboard");
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setError("");
    setBusy(true);
    const { error } = await signInWithMagicLink(email);
    setBusy(false);
    if (error) setError(friendlyError(error));
    else setMagicSent(true);
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await resetPasswordForEmail(email);
    setBusy(false);
    if (error) setError(friendlyError(error));
    else setResetSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-text">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="font-header text-2xl font-extrabold tracking-tight">
            Pitch<span className="text-primary">d</span>
          </Link>
          <p className="mt-2 text-sm text-muted">Sign in to keep hunting.</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          {forgotMode ? (
            resetSent ? (
              <p className="text-sm text-accent">
                Check <span className="text-text">{email}</span> for a password reset link.
              </p>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <p className="text-xs text-muted">
                  Enter your email and we'll send you a link to set a new password.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                    placeholder="you@example.com"
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="cta-glow rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send reset link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setError("");
                  }}
                  className="text-xs font-medium text-muted hover:text-text"
                >
                  Back to sign in
                </button>
              </form>
            )
          ) : magicSent ? (
            <p className="text-sm text-accent">
              Check <span className="text-text">{email}</span> for a magic sign-in link.
            </p>
          ) : (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setError("");
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="cta-glow rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={busy}
                className="text-xs font-medium text-muted hover:text-text"
              >
                Email me a magic link instead
              </button>
            </form>
          )}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => signInWithGoogle()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-text hover:border-primary/40"
            >
              Continue with Google
            </button>
            <button
              onClick={() => signInWithLinkedIn()}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-text hover:border-primary/40"
            >
              Continue with LinkedIn
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
