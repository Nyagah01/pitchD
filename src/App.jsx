import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import { ThemeProvider } from "./lib/ThemeContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import RequireProfile from "./components/layout/RequireProfile";
import AppShell from "./components/layout/AppShell";
import ThemeWipeOverlay from "./components/layout/ThemeWipeOverlay";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import PortfolioView from "./pages/PortfolioView";

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Applications = lazy(() => import("./pages/Applications"));
const Apply = lazy(() => import("./pages/Apply"));
const ApplicationDetail = lazy(() => import("./pages/ApplicationDetail"));

function PageFallback() {
  return <div className="p-10 text-sm text-muted">Loading…</div>;
}

function Protected({ children }) {
  return (
    <RequireProfile>
      <AppShell>
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </AppShell>
    </RequireProfile>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ThemeWipeOverlay />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/p/:slug" element={<PortfolioView />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageFallback />}>
                    <Onboarding />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/applications" element={<Protected><Applications /></Protected>} />
            <Route path="/apply" element={<Protected><Apply /></Protected>} />
            <Route path="/applications/:id" element={<Protected><ApplicationDetail /></Protected>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
