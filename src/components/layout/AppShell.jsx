import Sidebar from "./Sidebar";
import JoboWidget from "../jobo/JoboWidget";

export default function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text sm:h-screen sm:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 sm:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </main>
      <JoboWidget />
    </div>
  );
}
