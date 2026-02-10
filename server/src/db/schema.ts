import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==================== 枚举定义 ====================

/** 管理员角色 */
export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",
  "admin",
]);

/** App 平台类型 */
export const platformEnum = pgEnum("platform", [
  "ios",
  "android",
  "web",
]);

/** 订阅层级（通用分级，plan 中可引用） */
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro_monthly",
  "pro_yearly",
]);

/** 订阅状态 */
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
  "grace_period",
]);

/** 订阅计划周期类型 */
export const billingPeriodEnum = pgEnum("billing_period", [
  "monthly",
  "yearly",
  "lifetime",
  "custom",
]);

// ==================== 管理后台表 ====================

/** 管理员表 */
export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** 应用表 - 支持多 App 管理 */
export const apps = pgTable("apps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  bundleId: varchar("bundle_id", { length: 255 }).notNull(),
  platform: platformEnum("platform").default("ios").notNull(),
  apiKey: varchar("api_key", { length: 64 }).notNull().unique(),
  apiSecret: varchar("api_secret", { length: 128 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  /** App 级别的自定义配置 */
  settings: jsonb("settings").$type<AppSettings>().default({
    freeReplyLimitPerDay: 10,
    freeCandidateCount: 1,
    proCandidateCount: 5,
    enableAI: true,
    enableSubscription: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** App 配置类型（可按需扩展，不同 App 各取所需） */
export interface AppSettings {
  /** 免费用户每日回复上限 */
  freeReplyLimitPerDay: number;
  /** 免费用户候选回复数 */
  freeCandidateCount: number;
  /** Pro 用户候选回复数 */
  proCandidateCount: number;
  /** 是否启用 AI 功能 */
  enableAI: boolean;
  /** 是否启用订阅功能 */
  enableSubscription: boolean;
  /** 允许的扩展字段（为后续各 App 独立设置预留） */
  [key: string]: unknown;
}

// ==================== 订阅计划表（核心新增） ====================

/**
 * 订阅计划表 - 每个 App 独立配置自己的订阅方案
 *
 * 例如 App A 可以配 "月度会员 ¥12 / 年度会员 ¥98"
 *      App B 可以配 "基础版 ¥6/月 / 专业版 ¥18/月 / 终身 ¥298"
 */
export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("app_id")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    /** 计划名称（面向用户展示） */
    name: varchar("name", { length: 100 }).notNull(),
    /** App Store / Google Play 产品 ID */
    productId: varchar("product_id", { length: 255 }).notNull(),
    /** 对应的订阅层级 */
    tier: subscriptionTierEnum("tier").default("pro_monthly").notNull(),
    /** 计费周期 */
    billingPeriod: billingPeriodEnum("billing_period").default("monthly").notNull(),
    /** 价格（分为单位，如 1200 = ¥12.00） */
    priceCents: integer("price_cents").notNull(),
    /** 货币代码 */
    currency: varchar("currency", { length: 3 }).default("CNY").notNull(),
    /** 订阅时长（天），lifetime 可设 36500 */
    durationDays: integer("duration_days").notNull(),
    /** 计划描述 */
    description: text("description"),
    /** 包含的功能列表（展示用） */
    features: jsonb("features").$type<string[]>().default([]),
    /** 是否上架 */
    isActive: boolean("is_active").default(true).notNull(),
    /** 排序权重（越小越靠前） */
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    /** 同一 App 内 productId 唯一 */
    uniqueIndex("plans_app_product_unique").on(table.appId, table.productId),
  ]
);

// ==================== 业务数据表（按 App 隔离） ====================

/** 用户表 - 用户归属于特定 App */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appId: uuid("app_id")
      .references(() => apps.id, { onDelete: "cascade" })
      .notNull(),
    deviceId: varchar("device_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_app_device_unique").on(table.appId, table.deviceId),
  ]
);

/** 用户订阅表 - 记录用户当前的订阅状态 */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  /** 关联的订阅计划（免费用户为 null） */
  planId: uuid("plan_id").references(() => subscriptionPlans.id, {
    onDelete: "set null",
  }),
  tier: subscriptionTierEnum("tier").default("free").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  originalTransactionId: varchar("original_transaction_id", { length: 255 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** 说话风格表 - 内置风格按 App 区分 */
export const styles = pgTable("styles", {
  id: uuid("id").defaultRandom().primaryKey(),
  appId: uuid("app_id")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 10 }),
  color: varchar("color", { length: 20 }),
  prompt: text("prompt").notNull(),
  temperature: real("temperature").default(0.7),
  maxTokens: integer("max_tokens").default(500),
  isBuiltin: boolean("is_builtin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** 使用记录表（每日用量统计） */
export const usageRecords = pgTable("usage_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").defaultNow().notNull(),
  replyCount: integer("reply_count").default(0).notNull(),
});

// ==================== 类型导出 ====================

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Style = typeof styles.$inferSelect;
export type NewStyle = typeof styles.$inferInsert;

export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
