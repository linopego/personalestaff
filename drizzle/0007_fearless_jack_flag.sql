ALTER TABLE "eventi_assegnazioni" ADD COLUMN "stato_conferma" varchar(15) DEFAULT 'in_attesa' NOT NULL;--> statement-breakpoint
ALTER TABLE "eventi_assegnazioni" ADD COLUMN "motivo_rifiuto" text;