CREATE TABLE "notifiche" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"titolo" text NOT NULL,
	"messaggio" text NOT NULL,
	"link" text,
	"letto" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ALTER COLUMN "orario_inizio" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ALTER COLUMN "orario_fine" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ADD COLUMN "postazione" text;--> statement-breakpoint
ALTER TABLE "notifiche" ADD CONSTRAINT "notifiche_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_utenti_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."utenti"("id") ON DELETE no action ON UPDATE no action;