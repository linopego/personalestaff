import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { visibilitySettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized, forbidden } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return unauthorized();
  if (user.ruolo !== "admin") return forbidden();

  const { id } = await params;
  await db.delete(visibilitySettings).where(eq(visibilitySettings.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
