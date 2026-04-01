// Simulazione autenticazione — da sostituire con un vero provider (NextAuth, Clerk, ecc.)

export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "presenze_staff_user";

// Utenti demo — lookup per email
const DEMO_USERS: (User & { password: string })[] = [
  {
    id: "1",
    name: "Marco Bianchi",
    email: "admin@azienda.it",
    role: "admin",
    password: "Admin2024",
  },
  {
    id: "2",
    name: "Laura Rossi",
    email: "dipendente@azienda.it",
    role: "staff",
    password: "Staff2024",
  },
  // Backwards compat — vecchie credenziali username/password
  {
    id: "1",
    name: "Marco Bianchi",
    email: "admin",
    role: "admin",
    password: "admin",
  },
  {
    id: "2",
    name: "Laura Rossi",
    email: "staff",
    role: "staff",
    password: "staff",
  },
];

export function login(emailOrUsername: string, password: string): User | null {
  const match = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === emailOrUsername.toLowerCase() && u.password === password
  );
  if (match) {
    const { password: _, ...userData } = match;
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
