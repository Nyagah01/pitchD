import { createContext, useContext, useEffect, useState } from "react";
import { getSession, onAuthStateChange } from "./auth";

const AuthContext = createContext({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const subscription = onAuthStateChange((newSession) => setSession(newSession));
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
