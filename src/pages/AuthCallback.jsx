import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      navigate(session ? "/dashboard" : "/login", { replace: true });
    }
  }, [loading, session, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-bg text-sm text-muted">
      Signing you in…
    </div>
  );
}
