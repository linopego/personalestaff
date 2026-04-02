"use client";

import { useAuth } from "@/lib/auth-context";

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border bg-sidebar-bg px-4 lg:px-6" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}>
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-text-muted hover:bg-white/5 hover:text-foreground lg:hidden"
        aria-label="Apri menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User info */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{user?.name ?? "Utente"}</p>
          <p className="text-xs text-accent-warm font-medium">
            {user?.ruolo === "admin" ? "Admin" : "Staff"}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
          {user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("") ?? "U"}
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
