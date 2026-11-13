CREATE TYPE "public"."channel" AS ENUM('whatsapp', 'telegram');--> statement-breakpoint
CREATE TYPE "public"."crop_phase" AS ENUM('bero', 'vegetatif_awal', 'vegetatif_akhir', 'bunting', 'masak_susu', 'menjelang_panen');--> statement-breakpoint
CREATE TYPE "public"."delivery_state" AS ENUM('queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('pending', 'approved', 'held', 'suppressed', 'expired', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('green', 'amber', 'red');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ppl', 'bpp_coordinator', 'admin');--> statement-breakpoint
CREATE TABLE "alert_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"status" "draft_status" DEFAULT 'pending' NOT NULL,
	"crop_phase" "crop_phase",
	"recommended_text" text NOT NULL,
	"edited_text" text,
	"reviewer_id" uuid,
	"reviewed_at" timestamp with time zone,
	"escalation_due_at" timestamp with time zone,
	"escalated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"diff" jsonb,
	"ip" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"draft_id" uuid NOT NULL,
	"final_text" text NOT NULL,
	"approved_by" uuid NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poktan_id" uuid NOT NULL,
	"name_enc" "bytea" NOT NULL,
	"phone_enc" "bytea",
	"phone_hash" "bytea",
	"channel" "channel" NOT NULL,
	"telegram_chat_id_enc" "bytea",
	"dusun_label" text,
	"is_leader" boolean DEFAULT false NOT NULL,
	"opt_in_at" timestamp with time zone,
	"opt_in_source" text,
	"opt_out_at" timestamp with time zone,
	CONSTRAINT "contacts_phone_channel_unique" UNIQUE("phone_hash","channel")
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broadcast_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"channel" "channel" NOT NULL,
	"stage" text DEFAULT 'template' NOT NULL,
	"state" "delivery_state" DEFAULT 'queued' NOT NULL,
	"provider_msg_id" text,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	CONSTRAINT "deliveries_broadcast_contact_stage_unique" UNIQUE("broadcast_id","contact_id","stage")
);
--> statement-breakpoint
CREATE TABLE "farmer_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"dusun_label" text NOT NULL,
	"dusun_norm" text NOT NULL,
	"code" smallint NOT NULL,
	"raw_text" text NOT NULL,
	"provider_msg_id" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"visit_requested" boolean DEFAULT false NOT NULL,
	CONSTRAINT "farmer_reports_provider_msg_id_unique" UNIQUE("provider_msg_id")
);
--> statement-breakpoint
CREATE TABLE "inbound_messages" (
	"provider_msg_id" text PRIMARY KEY NOT NULL,
	"channel" "channel" NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poktan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"region_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppl_assignments" (
	"user_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	CONSTRAINT "ppl_assignments_user_id_region_id_pk" PRIMARY KEY("user_id","region_id")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"timezone" text DEFAULT 'Asia/Jakarta' NOT NULL,
	"bmkg_adm4" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "regions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"assessed_for_date" date NOT NULL,
	"status" "risk_status" NOT NULL,
	"rule_version_id" uuid NOT NULL,
	"snapshot_id" uuid,
	"features" jsonb NOT NULL,
	"explain" jsonb NOT NULL,
	"is_degraded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "risk_assessments_region_date_snapshot_unique" UNIQUE("region_id","assessed_for_date","snapshot_id")
);
--> statement-breakpoint
CREATE TABLE "rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer NOT NULL,
	"thresholds" jsonb NOT NULL,
	"note" text,
	"created_by" uuid,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rule_versions_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"phone_enc" "bytea",
	"phone_hash" "bytea",
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weather_daily" (
	"region_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"t_mean" numeric(4, 1),
	"t_max" numeric(4, 1),
	"t_min" numeric(4, 1),
	"rh_mean" numeric(4, 1),
	"rh_hours_ge80" smallint,
	"precip_mm" numeric(5, 1),
	"is_forecast" boolean NOT NULL,
	"snapshot_id" uuid,
	CONSTRAINT "weather_daily_region_id_local_date_pk" PRIMARY KEY("region_id","local_date")
);
--> statement-breakpoint
CREATE TABLE "weather_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"run_slot" text NOT NULL,
	"source" text NOT NULL,
	"is_degraded" boolean DEFAULT false NOT NULL,
	"latency_ms" integer,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_drafts" ADD CONSTRAINT "alert_drafts_assessment_id_risk_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."risk_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_drafts" ADD CONSTRAINT "alert_drafts_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_drafts" ADD CONSTRAINT "alert_drafts_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_draft_id_alert_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "public"."alert_drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_poktan_id_poktan_id_fk" FOREIGN KEY ("poktan_id") REFERENCES "public"."poktan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_broadcast_id_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."broadcasts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_reports" ADD CONSTRAINT "farmer_reports_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_reports" ADD CONSTRAINT "farmer_reports_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_reports" ADD CONSTRAINT "farmer_reports_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poktan" ADD CONSTRAINT "poktan_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppl_assignments" ADD CONSTRAINT "ppl_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppl_assignments" ADD CONSTRAINT "ppl_assignments_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_id_regions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_rule_version_id_rule_versions_id_fk" FOREIGN KEY ("rule_version_id") REFERENCES "public"."rule_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_snapshot_id_weather_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."weather_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_daily" ADD CONSTRAINT "weather_daily_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_daily" ADD CONSTRAINT "weather_daily_snapshot_id_weather_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."weather_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_open_draft_per_region" ON "alert_drafts" USING btree ("region_id") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "deliveries_due" ON "deliveries" USING btree ("next_attempt_at") WHERE state IN ('queued', 'failed');--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_rule" ON "rule_versions" USING btree ("is_active") WHERE is_active = true;--> statement-breakpoint
REVOKE UPDATE, DELETE ON TABLE "audit_logs" FROM PUBLIC;--> statement-breakpoint
CREATE OR REPLACE FUNCTION protect_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operasi UPDATE atau DELETE dilarang pada tabel audit_logs (append-only)';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER audit_logs_no_update_delete
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION protect_audit_logs();
