"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AppLogo from "@/components/app-logo";
import NotificationBell from "@/components/notification-bell";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { label: "Timbra", href: "/staff/timbra", icon: TimbraIcon },
  { label: "Turni", href: "/staff/turni", icon: TurniIcon },
  { label: "Eventi", href: "/staff/eventi", icon: EventiIcon },
  { label: "Storico", href: "/staff/storico", icon: StoricoIcon },
  { label: "Ore", href: "/staff/ore", icon: OreIcon },
  { label: "Profilo", href: "/staff/profilo", icon: ProfiloIcon },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (user.ruolo === "admin") {
      router.push("/admin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user || user.ruolo === "admin") return null;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-border bg-sidebar-bg px-4 sm:px-6" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <AppLogo className="h-6 w-6" />
          </div>
          <span className="text-base font-semibold text-foreground hidden sm:block">Creazioni SRL</span>
        </div>

        <div className="flex items-center gap-3 relative">
          <NotificationBell />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-[11px] text-text-muted">Dipendente</p>
          </div>
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:border-red-500/50 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Desktop nav (tab orizzontali) ── */}
      <nav className="hidden sm:flex gap-1 border-b border-border bg-sidebar-bg px-6 py-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/staff/timbra" && pathname.startsWith(item.href));
          const isActive = item.href === "/staff/timbra" ? pathname === "/staff/timbra" || pathname === "/staff" : active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto sm:pb-0" style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom, 8px))" }}>
        <div className="mx-auto max-w-lg px-4 py-3 sm:max-w-2xl sm:px-6 sm:py-6">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar-bg sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== "/staff/timbra" && pathname.startsWith(item.href));
          const isActive = item.href === "/staff/timbra" ? pathname === "/staff/timbra" || pathname === "/staff" : active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors ${
                isActive ? "text-accent" : "text-text-muted"
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        </div>
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function EventiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function TurniIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function TimbraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a48.667 48.667 0 0 0-1.418 8.773 1.497 1.497 0 0 0 1.357 1.678c.223.023.447.043.672.06a.5.5 0 0 0 .473-.28l1.176-2.352a.5.5 0 0 1 .673-.225A23.887 23.887 0 0 0 12 20.073c1.476 0 2.91-.186 4.292-.543a.5.5 0 0 1 .52.147l1.71 1.962a.5.5 0 0 0 .514.14c.225-.065.449-.133.672-.205a1.5 1.5 0 0 0 .96-1.727A48.82 48.82 0 0 1 19.5 10.5c0-1.862-.677-3.567-1.8-4.877" />
    </svg>
  );
}

function StoricoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function OreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function ProfiloIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}
