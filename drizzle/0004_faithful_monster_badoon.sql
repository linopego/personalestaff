ALTER TABLE "timbrature" ALTER COLUMN "sede_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "timbrature" ADD COLUMN "tipo_accesso" varchar(10) DEFAULT 'sede' NOT NULL;--> statement-breakpoint
ALTER TABLE "timbrature" ADD COLUMN "motivo_remoto" text;--> statement-breakpoint
ALTER TABLE "utenti" ADD COLUMN "timbratura_remota_abilitata" boolean DEFAULT false NOT NULL;