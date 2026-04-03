"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [showAdminForm, setShowAdminForm] = useState(false);

  // Se l'utente è già loggato, redirect
  if (!loading && user) {
    router.push(user.ruolo === "admin" ? "/admin" : "/staff/timbra");
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validazione campi
    const errors: { email?: boolean; password?: boolean } = {};
    if (!email.trim()) errors.email = true;
    if (!password.trim()) errors.password = true;
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      if (!result) {
        setError("Credenziali non corrette. Riprova.");
        setSubmitting(false);
      }
    } catch {
      setError("Errore di connessione. Riprova.");
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-2xl border bg-sidebar-bg px-4 py-4 text-base text-foreground placeholder:text-text-muted transition-colors min-h-[56px] focus:outline-none focus:ring-2 focus:ring-offset-0";
  const inputOk = `${inputBase} border-border focus:border-accent focus:ring-accent/30`;
  const inputErr = `${inputBase} border-red-500 focus:border-red-500 focus:ring-red-500/30`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-5 py-8 login-page" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
      <div className="w-full max-w-sm">
        {/* ── Logo & Brand ── */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-accent/10">
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-20 w-20">
              <rect width="52" height="52" rx="14" fill="#0C1445"/>
              <circle cx="26" cy="26" r="15" stroke="#1E40AF" strokeWidth="1" strokeDasharray="2.5 2.5"/>
              <circle cx="26" cy="26" r="10" stroke="#2563EB" strokeWidth="1.5"/>
              <circle cx="26" cy="26" r="5.5" stroke="#3B82F6" strokeWidth="1.5"/>
              <circle cx="26" cy="26" r="2.5" fill="#60A5FA"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Creazioni S.R.L.</h1>
          <p className="mt-2 text-base text-text-muted">Gestione presenze del personale</p>
        </div>

        {/* ── Google Sign In (principale) ── */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/staff/timbra" })}
          className="w-full flex items-center justify-center gap-3 rounded-2xl border border-zinc-300 bg-white py-4 text-base font-semibold text-zinc-800 min-h-[56px] active:bg-zinc-50 active:scale-[0.98] transition-all"
        >
          <GoogleLogo />
          Accedi con Google
        </button>

        {authError === "not_authorized" && (
          <div className="mt-3 rounded-2xl bg-red-500/10 border border-red-500/25 px-4 py-3 animate-fade-in">
            <p className="text-sm font-medium text-red-400">Il tuo account Google non è autorizzato. Contatta l&apos;amministratore.</p>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-text-muted">
          Accesso riservato al personale autorizzato.
        </p>

        {/* ── Admin toggle ── */}
        <div className="mt-8">
          <button
            onClick={() => setShowAdminForm(!showAdminForm)}
            className="w-full text-center text-xs text-text-muted/50 py-2"
          >
            {showAdminForm ? "Chiudi" : "Accesso amministratore"}
          </button>

          {showAdminForm && (
            <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-card-bg p-4">
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-3 py-2 animate-fade-in">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Email"
                className={inputOk}
              />
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Password"
                  className={`${inputOk} pr-14`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-xl text-text-muted"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white min-h-[48px] active:bg-accent-hover active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Accesso...</span>
                  </>
                ) : (
                  "Accedi"
                )}
              </button>
            </form>
          )}
        </div>

        {/* ── Footer ── */}
        <p className="mt-6 text-center text-sm text-text-muted">
          Problemi di accesso? Contatta l&apos;amministratore.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5 1.798 0 3.483-.456 4.95-1.266M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}
