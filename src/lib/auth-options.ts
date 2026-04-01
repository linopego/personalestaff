import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { utenti, googleWhitelist } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(utenti)
          .where(eq(utenti.email, credentials.email.toLowerCase()))
          .limit(1);

        if (!user || !user.attivo || !user.passwordHash) return null;

        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user.id),
          name: `${user.nome} ${user.cognome}`,
          email: user.email,
          ruolo: user.ruolo,
          tipoContratto: user.tipoContratto,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      if (!email) return "/login?error=not_authorized";

      // Controlla whitelist
      const [wl] = await db
        .select()
        .from(googleWhitelist)
        .where(eq(googleWhitelist.email, email))
        .limit(1);

      if (!wl) {
        // Check if admin with this email exists
        const [existing] = await db
          .select()
          .from(utenti)
          .where(eq(utenti.email, email))
          .limit(1);

        if (existing && existing.ruolo === "admin") return true;
        return "/login?error=not_authorized";
      }

      // Controlla se utente esiste già
      const [existing] = await db
        .select()
        .from(utenti)
        .where(eq(utenti.email, email))
        .limit(1);

      if (existing) {
        // Aggiorna google_id e avatar se mancanti
        await db.update(utenti).set({
          googleId: user.id,
          avatarUrl: user.image ?? existing.avatarUrl,
          metodoAccesso: "google",
          emailVerified: true,
          updatedAt: new Date(),
        }).where(eq(utenti.id, existing.id));
      } else {
        // Crea nuovo utente dai dati whitelist + Google
        const nameParts = (user.name ?? "").split(" ");
        await db.insert(utenti).values({
          nome: wl.nome ?? nameParts[0] ?? "",
          cognome: wl.cognome ?? nameParts.slice(1).join(" ") ?? "",
          email,
          googleId: user.id,
          avatarUrl: user.image,
          ruolo: "staff",
          tipoContratto: wl.tipoContratto,
          oreSettimanali: wl.oreSettimanali,
          metodoAccesso: "google",
          emailVerified: true,
        });

        // Segna whitelist come utilizzata
        await db.update(googleWhitelist)
          .set({ utilizzata: true })
          .where(eq(googleWhitelist.id, wl.id));
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        token.id = u.id;
        token.ruolo = u.ruolo;
        token.tipoContratto = u.tipoContratto;
        token.avatarUrl = u.image;
      }

      if (account?.provider === "google" && user?.email) {
        // Fetch from DB to get ruolo etc
        const [dbUser] = await db
          .select()
          .from(utenti)
          .where(eq(utenti.email, user.email.toLowerCase()))
          .limit(1);

        if (dbUser) {
          token.id = String(dbUser.id);
          token.ruolo = dbUser.ruolo;
          token.tipoContratto = dbUser.tipoContratto;
          token.avatarUrl = dbUser.avatarUrl;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        u.id = token.id;
        u.ruolo = token.ruolo;
        u.tipoContratto = token.tipoContratto;
        u.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
