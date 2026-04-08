import webpush from "web-push";
import { db } from "@/db";
import { pushSubscriptions, notifiche } from "@/db/schema";
import { eq } from "drizzle-orm";

webpush.setVapidDetails(
  "mailto:admin@presenzestaff.it",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

/**
 * Invia una push notification a un utente e salva in DB.
 */
export async function inviaNotifica({
  userId,
  tipo,
  titolo,
  messaggio,
  link,
}: {
  userId: number;
  tipo: string;
  titolo: string;
  messaggio: string;
  link?: string;
}) {
  // Salva notifica in DB
  await db.insert(notifiche).values({ userId, tipo, titolo, messaggio, link: link || null });

  // Manda push a tutti i dispositivi dell'utente
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title: titolo, body: messaggio, url: link || "/" })
      );
    } catch (err: unknown) {
      // Se la subscription è scaduta, rimuovila
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}
