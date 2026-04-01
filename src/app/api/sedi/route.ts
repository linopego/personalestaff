import { NextResponse } from "next/server";
import { db } from "@/db";
import { sedi } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(sedi).where(eq(sedi.attiva, true));
  return NextResponse.json(result);
}
