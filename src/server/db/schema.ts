import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Custom type untuk kolom bytea PostgreSQL
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// Enums sesuai TECH_SPEC.md Bagian 4
export const userRoleEnum = pgEnum("user_role", [
  "ppl",
  "bpp_coordinator",
  "admin",
]);

export const riskStatusEnum = pgEnum("risk_status", [
  "green",
  "amber",
  "red",
]);

export const cropPhaseEnum = pgEnum("crop_phase", [
  "bero",
  "vegetatif_awal",
  "vegetatif_akhir",
  "bunting",
  "masak_susu",
  "menjelang_panen",
]);

export const draftStatusEnum = pgEnum("draft_status", [
  "pending",
  "approved",
  "held",
  "suppressed",
  "expired",
  "superseded",
]);

export const channelEnum = pgEnum("channel", [
  "whatsapp",
  "telegram",
]);

export const deliveryStateEnum = pgEnum("delivery_state", [
  "queued",
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
  "dead",
]);

// Tabel 1: users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  phoneEnc: bytea("phone_enc"),
  phoneHash: bytea("phone_hash"),
  isActive: boolean("is_active").notNull().default(true),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tabel 2: regions
export const regions = pgTable("regions", {
  id: uuid("id").primaryKey().defaultRandom(),
  level: text("level").notNull(), // 'kecamatan' | 'desa'
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => regions.id),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
  timezone: text("timezone").notNull().default("Asia/Jakarta"),
  bmkgAdm4: text("bmkg_adm4"),
  isActive: boolean("is_active").notNull().default(true),
});

// Tabel 3: ppl_assignments
export const pplAssignments = pgTable(
  "ppl_assignments",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.regionId] }),
  ]
);

// Tabel 4: poktan
export const poktan = pgTable("poktan", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id),
});

// Tabel 5: contacts
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    poktanId: uuid("poktan_id")
      .notNull()
      .references(() => poktan.id),
    nameEnc: bytea("name_enc").notNull(),
    phoneEnc: bytea("phone_enc"),
    phoneHash: bytea("phone_hash"),
    channel: channelEnum("channel").notNull(),
    telegramChatIdEnc: bytea("telegram_chat_id_enc"),
    dusunLabel: text("dusun_label"),
    isLeader: boolean("is_leader").notNull().default(false),
    optInAt: timestamp("opt_in_at", { withTimezone: true }),
    optInSource: text("opt_in_source"),
    optOutAt: timestamp("opt_out_at", { withTimezone: true }),
  },
  (table) => [
    unique("contacts_phone_channel_unique").on(table.phoneHash, table.channel),
  ]
);

// Tabel 6: rule_versions
export const ruleVersions = pgTable(
  "rule_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: integer("version").unique().notNull(),
    thresholds: jsonb("thresholds").notNull(),
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("one_active_rule")
      .on(table.isActive)
      .where(sql`is_active = true`),
  ]
);

// Tabel 7: weather_snapshots
export const weatherSnapshots = pgTable("weather_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id),
  runSlot: text("run_slot").notNull(), // '0500' | '1700' | 'manual'
  source: text("source").notNull(), // 'open-meteo' | 'bmkg' | 'cache'
  isDegraded: boolean("is_degraded").notNull().default(false),
  latencyMs: integer("latency_ms"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb("payload").notNull(),
});

// Tabel 8: weather_daily
export const weatherDaily = pgTable(
  "weather_daily",
  {
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
    localDate: date("local_date").notNull(),
    tMean: numeric("t_mean", { precision: 4, scale: 1 }),
    tMax: numeric("t_max", { precision: 4, scale: 1 }),
    tMin: numeric("t_min", { precision: 4, scale: 1 }),
    rhMean: numeric("rh_mean", { precision: 4, scale: 1 }),
    rhHoursGe80: smallint("rh_hours_ge80"),
    precipMm: numeric("precip_mm", { precision: 5, scale: 1 }),
    isForecast: boolean("is_forecast").notNull(),
    snapshotId: uuid("snapshot_id").references(() => weatherSnapshots.id),
  },
  (table) => [
    primaryKey({ columns: [table.regionId, table.localDate] }),
  ]
);

// Tabel 9: risk_assessments
export const riskAssessments = pgTable(
  "risk_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
    assessedForDate: date("assessed_for_date").notNull(),
    status: riskStatusEnum("status").notNull(),
    ruleVersionId: uuid("rule_version_id")
      .notNull()
      .references(() => ruleVersions.id),
    snapshotId: uuid("snapshot_id").references(() => weatherSnapshots.id),
    features: jsonb("features").notNull(),
    explain: jsonb("explain").notNull(),
    isDegraded: boolean("is_degraded").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("risk_assessments_region_date_snapshot_unique").on(
      table.regionId,
      table.assessedForDate,
      table.snapshotId
    ),
  ]
);

// Tabel 10: alert_drafts
export const alertDrafts = pgTable(
  "alert_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id")
      .notNull()
      .references(() => riskAssessments.id),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id),
    status: draftStatusEnum("status").notNull().default("pending"),
    cropPhase: cropPhaseEnum("crop_phase"),
    recommendedText: text("recommended_text").notNull(),
    editedText: text("edited_text"),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    escalationDueAt: timestamp("escalation_due_at", { withTimezone: true }),
    escalatedAt: timestamp("escalated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("one_open_draft_per_region")
      .on(table.regionId)
      .where(sql`status = 'pending'`),
  ]
);

// Tabel 11: broadcasts
export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  draftId: uuid("draft_id")
    .notNull()
    .references(() => alertDrafts.id),
  finalText: text("final_text").notNull(),
  approvedBy: uuid("approved_by")
    .notNull()
    .references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tabel 12: deliveries
export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    broadcastId: uuid("broadcast_id")
      .notNull()
      .references(() => broadcasts.id),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id),
    channel: channelEnum("channel").notNull(),
    stage: text("stage").notNull().default("template"), // 'template' | 'session'
    state: deliveryStateEnum("state").notNull().default("queued"),
    providerMsgId: text("provider_msg_id"),
    attempts: smallint("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastError: text("last_error"),
  },
  (table) => [
    unique("deliveries_broadcast_contact_stage_unique").on(
      table.broadcastId,
      table.contactId,
      table.stage
    ),
    index("deliveries_due")
      .on(table.nextAttemptAt)
      .where(sql`state IN ('queued', 'failed')`),
  ]
);

// Tabel 13: inbound_messages
export const inboundMessages = pgTable("inbound_messages", {
  providerMsgId: text("provider_msg_id").primaryKey(),
  channel: channelEnum("channel").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processed: boolean("processed").notNull().default(false),
});

// Tabel 14: farmer_reports
export const farmerReports = pgTable("farmer_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contacts.id),
  regionId: uuid("region_id")
    .notNull()
    .references(() => regions.id),
  dusunLabel: text("dusun_label").notNull(),
  dusunNorm: text("dusun_norm").notNull(),
  code: smallint("code").notNull(), // 0: Aman, 1: Waspada, 2: Bahaya
  rawText: text("raw_text").notNull(),
  providerMsgId: text("provider_msg_id").unique(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  visitRequested: boolean("visit_requested").notNull().default(false),
});

// Tabel 15: audit_logs (append-only)
export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  diff: jsonb("diff"),
  ip: text("ip"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
