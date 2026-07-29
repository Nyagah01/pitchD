import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, UserRound, KanbanSquare, Send, LogOut, Menu, X } from "lucide-react";
import { signOut } from "../../lib/auth";
import ThemeSwitcher from "./ThemeSwitcher";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/applications", label: "Applications", icon: KanbanSquare },
  { to: "/apply", label: "Apply", icon: Send },
];

function desktopLinkClass({ isActive }) {
  return `flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-raised hover:text-text"
  }`;
}

function tabLinkClass({ isActive }) {
  return `flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium ${
    isActive ? "text-primary" : "text-muted"
  }`;
}

export default function Sidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 sm:flex">
        <div className="mb-8 px-2">
          <span className="font-header text-xl font-extrabold tracking-tight text-text">
            Pitch<span className="text-primary">d</span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-border pt-2">
          <ThemeSwitcher />
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-text"
          >
            <LogOut size={17} strokeWidth={2} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3 sm:hidden">
        <span className="font-header text-lg font-extrabold tracking-tight text-text">
          Pitch<span className="text-primary">d</span>
        </span>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text"
          aria-label="Menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed inset-x-0 top-[57px] z-40 border-b border-border bg-surface px-4 py-3 shadow-lg sm:hidden">
            <div className="flex flex-col gap-1">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={desktopLinkClass} onClick={() => setMenuOpen(false)}>
                  <Icon size={17} strokeWidth={2} />
                  {label}
                </NavLink>
              ))}
              <div className="my-1 border-t border-border" />
              <ThemeSwitcher dropUp={false} />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-muted hover:bg-surface-raised hover:text-text"
              >
                <LogOut size={17} strokeWidth={2} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-surface px-1 py-1.5 sm:hidden">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={tabLinkClass}>
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
