import { db } from "@/db";
import { visibilitySettings } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Restituisce la data_reset applicabile a un dipendente.
 * Priorità: setting specifico > setting globale > null (tutto visibile)
 */
export async function getVisibilityDate(userId: number): Promise<Date | null> {
  // Cerca setting specifico per utente
  const [specifico] = await db
    .select()
    .from(visibilitySettings)
    .where(eq(visibilitySettings.userId, userId))
    .limit(1);

  if (specifico) return new Date(specifico.dataReset);

  // Cerca setting globale (userId = null)
  const [globale] = await db
    .select()
    .from(visibilitySettings)
    .where(isNull(visibilitySettings.userId))
    .limit(1);

  if (globale) return new Date(globale.dataReset);

  return null;
}
