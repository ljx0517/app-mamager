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
  index,
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

/** 用户状态 */
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "disabled",
  "suspended",
  "pending_verification",
]);

// ==================== 管理后台表 ====================

/** 管理员表 */
export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: adminRoleEnum("role").default("admin").notNull(),
  tokenVersion: integer("token_version").default(0).notNull(),
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
  /** App 配置名称，关联 app_settings 目录下的配置 */
  configName: varchar("config_name", { length: 100 }).default("common").notNull(),
  /** App 配置模板，用于快速创建或复制配置 */
  configTemplate: varchar("config_template", { length: 100 }),
  /** App 友好的 slug 标识符，用于 URL */
  slug: varchar("slug", { length: 100 }).unique(),
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
    aiProviders: [
      {
        type: "mock",
        enabled: true,
        priority: 100,
      } as AIProviderConfig,
    ],
    defaultAIProvider: "mock",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** AI 提供商类型 */
export type AIProviderType = "openai" | "anthropic" | "google" | "mock" | "azure_openai" | "unknown";

/** AI 提供商配置 */
export interface AIProviderConfig {
  /** 提供商类型 */
  type: AIProviderType;
  /** API 密钥（加密存储） */
  apiKey?: string;
  /** 基础 URL（可选，用于自部署或代理） */
  baseUrl?: string;
  /** 模型名称（如 gpt-4o-mini, claude-3-haiku） */
  model?: string;
  /** 是否启用 */
  enabled: boolean;
  /** 优先级（数字越小优先级越高） */
  priority: number;
  /** 失败重试次数 */
  retryCount?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
}

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
  /** AI 提供商配置列表 */
  aiProviders?: AIProviderConfig[];
  /** 默认 AI 提供商类型 */
  defaultAIProvider?: AIProviderType;
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
    passwordHash: varchar("password_hash", { length: 255 }),
    status: userStatusEnum("status").default("active").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    verificationToken: varchar("verification_token", { length: 255 }),
    verificationTokenExpires: timestamp("verification_token_expires", { withTimezone: true }),
    resetToken: varchar("reset_token", { length: 255 }),
    resetTokenExpires: timestamp("reset_token_expires", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_app_device_unique").on(table.appId, table.deviceId),
    uniqueIndex("users_app_email_unique").on(table.appId, table.email),
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
export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").defaultNow().notNull(),
    /** 回复数量（向后兼容） */
    replyCount: integer("reply_count").default(0).notNull(),
    /** AI 调用 token 数量 */
    tokenCount: integer("token_count").default(0),
    /** AI 提供商类型 */
    aiProvider: varchar("ai_provider", { length: 50 }),
    /** 使用的模型名称 */
    model: varchar("model", { length: 100 }),
    /** 调用是否成功 */
    success: boolean("success").default(true),
    /** 调用耗时（毫秒） */
    durationMs: integer("duration_ms"),
    /** 错误信息（如调用失败） */
    errorMessage: text("error_message"),
  },
  (table) => [
    /** 按用户和时间查询使用记录 */
    index("usage_user_date_idx").on(table.userId, table.date),
    /** 按 AI 提供商和时间范围查询统计 */
    index("usage_ai_provider_date_idx").on(table.aiProvider, table.date),
    /** 按模型和时间范围查询统计 */
    index("usage_model_date_idx").on(table.model, table.date),
    /** 按成功状态和时间查询 */
    index("usage_success_date_idx").on(table.success, table.date),
  ]
);

// ==================== 类型导出 ====================

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

/** 用户状态类型 */
export type UserStatus = "active" | "disabled" | "suspended" | "pending_verification";

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
