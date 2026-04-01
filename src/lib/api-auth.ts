import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { NextResponse } from "next/server";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  ruolo: string;
  tipoContratto: string;
}

export async function getSession() {
  const session = await getServerSession(authOptions);
  return session?.user as SessionUser | null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Accesso negato" }, { status: 403 });
}
