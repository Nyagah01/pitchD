import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { signUpWithPassword, signInWithGoogle, signInWithLinkedIn } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";
import { friendlyError } from "../lib/friendlyError";

export default function Signup() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signUpWithPassword(email, password);
    setBusy(false);
    if (error) setError(friendlyError(error));
    else setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 text-text">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="font-header text-2xl font-extrabold tracking-tight">
            Pitch<span className="text-primary">d</span>
          </Link>
          <p className="mt-2 text-sm text-muted">
            Dump your whole career history in. Let AI shape it into applications.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          {done ? (
            <p className="text-sm text-accent">
              Check <span className="text-text">{email}</span> to confirm your account, then sign in.
            </p>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
                <label className="text-xs font-medium text-muted">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="At least 6 characters"
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="cta-glow rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create account
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
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
