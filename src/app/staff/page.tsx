"use client";

import { useAuth } from "@/lib/auth-context";

export default function StaffPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background text-center">
      <h1 className="text-2xl font-bold text-foreground">Area Staff</h1>
      <p className="mt-2 text-text-muted">
        Benvenuto, {user?.name ?? "Utente"}. Questa è l&apos;area riservata allo staff.
      </p>
      <button
        onClick={logout}
        className="mt-6 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-hover transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
