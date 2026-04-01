// Simulazione autenticazione — da sostituire con un vero provider (NextAuth, Clerk, ecc.)

export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "presenze_staff_user";

// Utenti demo
const DEMO_USERS: Record<string, User & { password: string }> = {
  admin: {
    id: "1",
    name: "Marco Bianchi",
    email: "admin@presenzestaff.it",
    role: "admin",
    password: "admin",
  },
  staff: {
    id: "2",
    name: "Laura Rossi",
    email: "staff@presenzestaff.it",
    role: "staff",
    password: "staff",
  },
};

export function login(username: string, password: string): User | null {
  const user = DEMO_USERS[username];
  if (user && user.password === password) {
    const { password: _, ...userData } = user;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    }
    return userData;
  }
  return null;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}
