import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updatePassword } from "../lib/auth";
import { useAuth } from "../lib/AuthContext";
import { friendlyError } from "../lib/friendlyError";

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setBusy(true);
    const { error } = await updatePassword(password);
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
          <p className="mt-2 text-sm text-muted">Set a new password.</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : done ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-accent">Password updated — you're all set.</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="cta-glow rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
              >
                Continue to Pitchd
              </button>
            </div>
          ) : !session ? (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm text-danger">
                This reset link is invalid or has expired. Request a new one from the login page.
              </p>
              <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">New password</label>
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">Confirm new password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
                  placeholder="Type it again"
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="cta-glow rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
