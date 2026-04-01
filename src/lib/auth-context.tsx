"use client";

import {
  createContext,
  useContext,
} from "react";
import {
  SessionProvider,
  useSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  ruolo: string;
  tipoContratto: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => null,
  logout: () => {},
});

function AuthContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user: User | null = session?.user
    ? {
        id: (session.user as { id?: string }).id ?? "",
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        ruolo: (session.user as { ruolo?: string }).ruolo ?? "staff",
        tipoContratto: (session.user as { tipoContratto?: string }).tipoContratto ?? "Fisso",
      }
    : null;

  async function login(email: string, password: string): Promise<User | null> {
    const res = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      // Reload to pick up fresh session from server
      window.location.reload();
      return {} as User;
    }
    return null;
  }

  function logout() {
    nextAuthSignOut({ callbackUrl: "/login" });
  }

  return (
    <AuthContext.Provider value={{ user, loading: status === "loading", login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
