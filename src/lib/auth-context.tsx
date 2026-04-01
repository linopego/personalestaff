"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  type User,
  getUser,
  login as authLogin,
  logout as authLogout,
} from "./auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  const login = useCallback(
    (username: string, password: string) => {
      const u = authLogin(username, password);
      if (u) {
        setUser(u);
        if (u.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/staff");
        }
      }
      return u;
    },
    [router]
  );

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
