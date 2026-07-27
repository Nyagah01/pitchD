import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { getProfile } from "../../lib/profile";

export default function RequireProfile({ children }) {
  const { session, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!session) {
      setChecking(false);
      return;
    }
    getProfile()
      .then((profile) => {
        setHasProfile(!!profile?.full_name);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [session]);

  if (loading || checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-muted">
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!hasProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
