import { z } from "zod";
import { eq, and, sql, desc, asc, count, sum, avg, between, gte, lte, inArray } from "drizzle-orm";
import { router, adminProcedure } from "../trpc/index.js";
import {
  apps,
  users,
  subscriptions,
  subscriptionPlans,
  usageRecords,
  styles,
} from "../db/schema.js";
import { TRPCError } from "@trpc/server";

/**
 * 数据分析路由（管理后台）
 *
 * 功能模块：
 *  usage.*    使用量统计分析
 *  revenue.*  收入与订阅分析
 *  growth.*   用户增长与留存分析
 */
export const analyticsRouter = router({
  // ==================== 使用量统计分析 ====================

  /**
   * 使用量统计分析
   * 支持时间趋势、分布分析、热门风格等
   */
  usage: adminProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        /** 时间范围：开始日期（YYYY-MM-DD） */
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        /** 时间范围：结束日期（YYYY-MM-DD） */
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        /** 时间粒度：day, week, month */
        granularity: z.enum(["day", "week", "month"]).default("day"),
        /** 是否按用户层级分组 */
        groupByTier: z.boolean().optional().default(false),
        /** 是否按AI提供商分组 */
        groupByProvider: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { appId, startDate, endDate, granularity, groupByTier, groupByProvider } = input;

      // 验证 App 存在
      const [app] = await ctx.db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "应用不存在" });
      }

      // 验证时间范围
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "开始日期不能晚于结束日期" });
      }

      // 获取该 App 下的所有用户
      const appUsers = await ctx.db
        .select({
          id: users.id,
          deviceId: users.deviceId,
          status: users.status,
        })
        .from(users)
        .where(eq(users.appId, appId));

      const userIds = appUsers.map((u) => u.id);
      if (userIds.length === 0) {
        return {
          timeSeries: [],
          summary: {
            totalUsers: 0,
            activeUsers: 0,
            totalReplies: 0,
            totalTokens: 0,
            avgTokensPerReply: 0,
            successRate: 0,
          },
          distribution: {
            byTier: {},
            byProvider: {},
            byModel: {},
          },
        };
      }

      // 构建时间序列查询
      let timeGroupExpr;
      switch (granularity) {
        case "day":
          timeGroupExpr = sql`DATE(${usageRecords.date})`;
          break;
        case "week":
          timeGroupExpr = sql`DATE_TRUNC('week', ${usageRecords.date})`;
          break;
        case "month":
          timeGroupExpr = sql`DATE_TRUNC('month', ${usageRecords.date})`;
          break;
      }

      // 基础使用量统计
      const usageQuery = ctx.db
        .select({
          timePeriod: timeGroupExpr.as("time_period"),
          totalReplies: sum(usageRecords.replyCount).as("total_replies"),
          totalTokens: sum(usageRecords.tokenCount).as("total_tokens"),
          successfulCalls: sum(sql`case when ${usageRecords.success} = true then 1 else 0 end`).as("successful_calls"),
          failedCalls: sum(sql`case when ${usageRecords.success} = false then 1 else 0 end`).as("failed_calls"),
          uniqueUsers: count(sql`distinct ${usageRecords.userId}`).as("unique_users"),
        })
        .from(usageRecords)
        .where(
          and(
            inArray(usageRecords.userId, userIds),
            sql`${usageRecords.date} BETWEEN ${startDate} AND ${endDate}`
          )
        )
        .groupBy(timeGroupExpr)
        .orderBy(asc(timeGroupExpr));

      const timeSeriesData = await usageQuery;

      // 汇总统计
      const summaryQuery = await ctx.db
        .select({
          totalReplies: sum(usageRecords.replyCount).as("total_replies"),
          totalTokens: sum(usageRecords.tokenCount).as("total_tokens"),
          successfulCalls: sum(sql`case when ${usageRecords.success} = true then 1 else 0 end`).as("successful_calls"),
          failedCalls: sum(sql`case when ${usageRecords.success} = false then 1 else 0 end`).as("failed_calls"),
        })
        .from(usageRecords)
        .where(
          and(
            inArray(usageRecords.userId, userIds),
            sql`${usageRecords.date} BETWEEN ${startDate} AND ${endDate}`
          )
        );

      const summary = summaryQuery[0] || {
        totalReplies: 0,
        totalTokens: 0,
        successfulCalls: 0,
        failedCalls: 0,
      };

      // 活跃用户统计（在指定时间范围内有使用记录的用户）
      const activeUsers = timeSeriesData.reduce(
        (count, period) => count + Number(period.uniqueUsers || 0),
        0
      );

      // 按订阅层级分布
      let byTierDistribution = {};
      if (groupByTier) {
        const tierData = await ctx.db
          .select({
            tier: subscriptions.tier,
            totalReplies: sum(usageRecords.replyCount).as("total_replies"),
            totalTokens: sum(usageRecords.tokenCount).as("total_tokens"),
            userCount: count(sql`distinct ${usageRecords.userId}`).as("user_count"),
          })
          .from(usageRecords)
          .innerJoin(subscriptions, eq(usageRecords.userId, subscriptions.userId))
          .where(
            and(
              inArray(usageRecords.userId, userIds),
              sql`${usageRecords.date} BETWEEN ${startDate} AND ${endDate}`,
              eq(subscriptions.status, "active")
            )
          )
          .groupBy(subscriptions.tier);

        byTierDistribution = tierData.reduce(
          (acc, row) => ({
            ...acc,
            [row.tier]: {
              totalReplies: Number(row.totalReplies || 0),
              totalTokens: Number(row.totalTokens || 0),
              userCount: Number(row.userCount || 0),
            },
          }),
          {}
        );
      }

      // 按AI提供商分布
      let byProviderDistribution = {};
      if (groupByProvider) {
        const providerData = await ctx.db
          .select({
            aiProvider: usageRecords.aiProvider,
            model: usageRecords.model,
            callCount: count().as("call_count"),
            totalTokens: sum(usageRecords.tokenCount).as("total_tokens"),
            avgDuration: avg(usageRecords.durationMs).as("avg_duration"),
            successRate: avg(sql`case when ${usageRecords.success} = true then 1.0 else 0.0 end`).as("success_rate"),
          })
          .from(usageRecords)
          .where(
            and(
              inArray(usageRecords.userId, userIds),
              sql`${usageRecords.date} BETWEEN ${startDate} AND ${endDate}`,
              sql`${usageRecords.aiProvider} IS NOT NULL`
            )
          )
          .groupBy(usageRecords.aiProvider, usageRecords.model)
          .orderBy(desc(sql`call_count`));

        byProviderDistribution = providerData.reduce(
          (acc, row) => ({
            ...acc,
            [`${row.aiProvider}:${row.model}`]: {
              callCount: Number(row.callCount || 0),
              totalTokens: Number(row.totalTokens || 0),
              avgDuration: Number(row.avgDuration || 0),
              successRate: Number(row.successRate || 0) * 100,
            },
          }),
          {}
        );
      }

      // 热门风格分析（如果系统记录风格使用）
      const popularStyles = await ctx.db
        .select({
          styleId: styles.id,
          styleName: styles.name,
          usageCount: count().as("usage_count"),
        })
        .from(styles)
        // TODO: 需要关联使用记录和风格选择，这里暂时返回空
        .where(eq(styles.appId, appId))
        .groupBy(styles.id, styles.name)
        .orderBy(desc(sql`usage_count`))
        .limit(10);

      return {
        timeSeries: timeSeriesData.map((row) => ({
          timePeriod: row.timePeriod,
          totalReplies: Number(row.totalReplies || 0),
          totalTokens: Number(row.totalTokens || 0),
          successfulCalls: Number(row.successfulCalls || 0),
          failedCalls: Number(row.failedCalls || 0),
          uniqueUsers: Number(row.uniqueUsers || 0),
          successRate: (Number(row.successfulCalls || 0) / Math.max(1, Number(row.successfulCalls || 0) + Number(row.failedCalls || 0))) * 100,
        })),
        summary: {
          totalUsers: appUsers.length,
          activeUsers,
          totalReplies: Number(summary.totalReplies || 0),
          totalTokens: Number(summary.totalTokens || 0),
          avgTokensPerReply: Number(summary.totalReplies || 0) > 0
            ? Number(summary.totalTokens || 0) / Number(summary.totalReplies || 0)
            : 0,
          successRate: (Number(summary.successfulCalls || 0) / Math.max(1, Number(summary.successfulCalls || 0) + Number(summary.failedCalls || 0))) * 100,
        },
        distribution: {
          byTier: byTierDistribution,
          byProvider: byProviderDistribution,
          popularStyles,
        },
      };
    }),

  // ==================== 收入与订阅分析 ====================

  /**
   * 收入与订阅分析
   * 支持 MRR、ARR、转化漏斗等
   */
  revenue: adminProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        /** 时间范围：开始日期（YYYY-MM-DD） */
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        /** 时间范围：结束日期（YYYY-MM-DD） */
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        /** 货币代码（默认 CNY） */
        currency: z.string().length(3).default("CNY"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { appId, startDate, endDate, currency } = input;

      // 验证 App 存在
      const [app] = await ctx.db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "应用不存在" });
      }

      // 获取该 App 下的所有订阅计划
      const plans = await ctx.db
        .select()
        .from(subscriptionPlans)
        .where(
          and(
            eq(subscriptionPlans.appId, appId),
            eq(subscriptionPlans.currency, currency),
            eq(subscriptionPlans.isActive, true)
          )
        );

      // 获取该 App 下的所有用户
      const appUsers = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.appId, appId));

      const userIds = appUsers.map((u) => u.id);
      if (userIds.length === 0) {
        return {
          mrr: 0,
          arr: 0,
          totalRevenue: 0,
          subscriptionStats: {
            total: 0,
            active: 0,
            cancelled: 0,
            expired: 0,
          },
          conversionFunnel: {
            totalUsers: 0,
            freeUsers: 0,
            proUsers: 0,
            conversionRate: 0,
          },
          planPerformance: [],
        };
      }

      // 获取活跃订阅
      const activeSubscriptions = await ctx.db
        .select({
          subscription: subscriptions,
          plan: subscriptionPlans,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            inArray(subscriptions.userId, userIds),
            eq(subscriptions.status, "active"),
            sql`${subscriptions.createdAt}::date BETWEEN ${startDate}::date AND ${endDate}::date`
          )
        );

      // 计算 MRR（月度经常性收入）
      const monthlyPlans = plans.filter(
        (p) => p.billingPeriod === "monthly" && p.tier !== "free"
      );
      const yearlyPlans = plans.filter(
        (p) => p.billingPeriod === "yearly" && p.tier !== "free"
      );

      let mrr = 0;
      activeSubscriptions.forEach(({ plan, subscription }) => {
        if (plan.billingPeriod === "monthly") {
          mrr += plan.priceCents / 100; // 分转元
        } else if (plan.billingPeriod === "yearly") {
          mrr += plan.priceCents / 100 / 12; // 年费按月均摊
        }
      });

      // 计算 ARR
      const arr = mrr * 12;

      // 订阅统计
      const subscriptionStatsQuery = await ctx.db
        .select({
          status: subscriptions.status,
          count: count(),
        })
        .from(subscriptions)
        .where(inArray(subscriptions.userId, userIds))
        .groupBy(subscriptions.status);

      const subscriptionStats = {
        total: subscriptionStatsQuery.reduce((sum, row) => sum + Number(row.count || 0), 0),
        active: subscriptionStatsQuery.find((row) => row.status === "active")?.count || 0,
        cancelled: subscriptionStatsQuery.find((row) => row.status === "cancelled")?.count || 0,
        expired: subscriptionStatsQuery.find((row) => row.status === "expired")?.count || 0,
      };

      // 转化漏斗分析
      const totalUsers = userIds.length;
      const freeUsers = await ctx.db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            inArray(subscriptions.userId, userIds),
            eq(subscriptions.tier, "free"),
            eq(subscriptions.status, "active")
          )
        );

      const proUsers = await ctx.db
        .select({ count: count() })
        .from(subscriptions)
        .where(
          and(
            inArray(subscriptions.userId, userIds),
            inArray(subscriptions.tier, ["pro_monthly", "pro_yearly"]),
            eq(subscriptions.status, "active")
          )
        );

      const freeCount = Number(freeUsers[0]?.count || 0);
      const proCount = Number(proUsers[0]?.count || 0);

      // 计划性能分析
      const planPerformance = await Promise.all(
        plans.map(async (plan) => {
          const planSubscriptions = await ctx.db
            .select({ count: count() })
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.planId, plan.id),
                eq(subscriptions.status, "active")
              )
            );

          const subscriptionCount = Number(planSubscriptions[0]?.count || 0);
          const monthlyRevenue = plan.billingPeriod === "monthly"
            ? subscriptionCount * plan.priceCents / 100
            : plan.billingPeriod === "yearly"
            ? subscriptionCount * plan.priceCents / 100 / 12
            : 0;

          return {
            planId: plan.id,
            planName: plan.name,
            billingPeriod: plan.billingPeriod,
            price: plan.priceCents / 100,
            currency: plan.currency,
            activeSubscriptions: subscriptionCount,
            monthlyRevenue,
            features: plan.features || [],
          };
        })
      );

      // 收入趋势（按月）
      const revenueTrend = await ctx.db
        .select({
          month: sql`DATE_TRUNC('month', ${subscriptions.createdAt})`.as("month"),
          revenue: sum(sql`case
            when ${subscriptionPlans.billingPeriod} = 'monthly' then ${subscriptionPlans.priceCents} / 100
            when ${subscriptionPlans.billingPeriod} = 'yearly' then ${subscriptionPlans.priceCents} / 100 / 12
            else 0
          end`).as("revenue"),
          newSubscriptions: count().as("new_subscriptions"),
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            inArray(subscriptions.userId, userIds),
            eq(subscriptions.status, "active"),
            sql`${subscriptions.createdAt}::date BETWEEN ${startDate}::date AND ${endDate}::date`
          )
        )
        .groupBy(sql`DATE_TRUNC('month', ${subscriptions.createdAt})`)
        .orderBy(asc(sql`month`));

      return {
        mrr,
        arr,
        totalRevenue: arr, // 当前按ARR计算总收入
        subscriptionStats,
        conversionFunnel: {
          totalUsers,
          freeUsers: freeCount,
          proUsers: proCount,
          conversionRate: totalUsers > 0 ? (proCount / totalUsers) * 100 : 0,
          freeToProConversion: freeCount > 0 ? (proCount / freeCount) * 100 : 0,
        },
        planPerformance,
        revenueTrend: revenueTrend.map((row) => ({
          month: row.month,
          revenue: Number(row.revenue || 0),
          newSubscriptions: Number(row.newSubscriptions || 0),
        })),
        currency,
      };
    }),

  // ==================== 用户增长与留存分析 ====================

  /**
   * 用户增长与留存分析
   * 支持同期群分析、留存率计算等
   */
  growth: adminProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        /** 分析周期数（默认为12个月） */
        periods: z.number().int().min(1).max(24).default(12),
        /** 周期类型：month, week */
        periodType: z.enum(["month", "week"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { appId, periods, periodType } = input;

      // 验证 App 存在
      const [app] = await ctx.db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "应用不存在" });
      }

      // 获取该 App 下的所有用户
      const allUsers = await ctx.db
        .select({
          id: users.id,
          createdAt: users.createdAt,
          lastLoginAt: users.lastLoginAt,
          status: users.status,
        })
        .from(users)
        .where(eq(users.appId, appId))
        .orderBy(asc(users.createdAt));

      if (allUsers.length === 0) {
        return {
          userGrowth: [],
          retention: {},
          cohortAnalysis: [],
        };
      }

      // 用户增长趋势
      const growthQuery = await ctx.db
        .select({
          period: sql`DATE_TRUNC('${sql.raw(periodType)}', ${users.createdAt})`.as("period"),
          newUsers: count().as("new_users"),
          activeUsers: count(sql`distinct case when ${users.lastLoginAt} >= DATE_TRUNC('${sql.raw(periodType)}', ${users.createdAt}) then ${users.id} end`).as("active_users"),
        })
        .from(users)
        .where(eq(users.appId, appId))
        .groupBy(sql`period`)
        .orderBy(asc(sql`period`))
        .limit(periods);

      // 留存率计算（同期群分析）
      const cohorts: Array<{
        cohortPeriod: string;
        totalUsers: number;
        retention: Record<string, number>;
      }> = [];

      // 简化版同期群分析：按注册月份分组
      const userGroups = allUsers.reduce((groups, user) => {
        const cohortKey = periodType === "month"
          ? user.createdAt.toISOString().substring(0, 7) // YYYY-MM
          : `${user.createdAt.toISOString().substring(0, 10)}`; // 简化处理

        if (!groups[cohortKey]) {
          groups[cohortKey] = [];
        }
        groups[cohortKey].push(user);
        return groups;
      }, {} as Record<string, typeof allUsers>);

      // 对每个同期群计算留存
      for (const [cohortPeriod, cohortUsers] of Object.entries(userGroups)) {
        const retention: Record<string, number> = {};

        // 计算每个周期的留存率
        for (let i = 0; i < periods; i++) {
          const periodStart = new Date(cohortPeriod + (periodType === "month" ? "-01" : ""));
          periodStart.setMonth(periodStart.getMonth() + i);

          const periodEnd = new Date(periodStart);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          // 统计在该周期内活跃的用户数
          const activeInPeriod = cohortUsers.filter((user) => {
            if (!user.lastLoginAt) return false;
            return user.lastLoginAt >= periodStart && user.lastLoginAt < periodEnd;
          }).length;

          const retentionRate = cohortUsers.length > 0
            ? (activeInPeriod / cohortUsers.length) * 100
            : 0;

          retention[`period_${i}`] = retentionRate;
        }

        cohorts.push({
          cohortPeriod,
          totalUsers: cohortUsers.length,
          retention,
        });
      }

      // 用户活跃度分析
      const activityLevels = {
        daily: allUsers.filter((u) => {
          if (!u.lastLoginAt) return false;
          const daysSinceLastLogin = (Date.now() - u.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastLogin <= 1;
        }).length,
        weekly: allUsers.filter((u) => {
          if (!u.lastLoginAt) return false;
          const daysSinceLastLogin = (Date.now() - u.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastLogin <= 7;
        }).length,
        monthly: allUsers.filter((u) => {
          if (!u.lastLoginAt) return false;
          const daysSinceLastLogin = (Date.now() - u.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastLogin <= 30;
        }).length,
        inactive: allUsers.filter((u) => {
          if (!u.lastLoginAt) return true;
          const daysSinceLastLogin = (Date.now() - u.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastLogin > 30;
        }).length,
      };

      return {
        userGrowth: growthQuery.map((row) => ({
          period: row.period,
          newUsers: Number(row.newUsers || 0),
          activeUsers: Number(row.activeUsers || 0),
          growthRate: 0, // 需要与上一期比较计算
        })),
        retention: {
          day1: 0, // 需要实际使用数据计算
          day7: 0,
          day30: 0,
        },
        cohortAnalysis: cohorts,
        activityLevels,
        summary: {
          totalUsers: allUsers.length,
          activeUsers: activityLevels.monthly,
          inactiveUsers: activityLevels.inactive,
          activationRate: allUsers.length > 0
            ? (activityLevels.monthly / allUsers.length) * 100
            : 0,
        },
      };
    }),

  // ==================== 实时数据快照 ====================

  /**
   * 获取实时数据快照（仪表盘用）
   */
  snapshot: adminProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { appId } = input;

      // 验证 App 存在
      const [app] = await ctx.db
        .select()
        .from(apps)
        .where(eq(apps.id, appId))
        .limit(1);

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "应用不存在" });
      }

      // 并行获取各项指标
      const [
        totalUsers,
        todayActiveUsers,
        todayUsage,
        activeSubscriptions,
        revenueToday,
      ] = await Promise.all([
        // 总用户数
        ctx.db
          .select({ count: count() })
          .from(users)
          .where(eq(users.appId, appId))
          .then((rows) => Number(rows[0]?.count || 0)),

        // 今日活跃用户
        ctx.db
          .select({ count: count(sql`distinct ${usageRecords.userId}`) })
          .from(usageRecords)
          .innerJoin(users, eq(usageRecords.userId, users.id))
          .where(
            and(
              eq(users.appId, appId),
              eq(usageRecords.date, sql`CURRENT_DATE`)
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // 今日使用量
        ctx.db
          .select({
            totalReplies: sum(usageRecords.replyCount),
            totalTokens: sum(usageRecords.tokenCount),
            successRate: avg(sql`case when ${usageRecords.success} = true then 1.0 else 0.0 end`),
          })
          .from(usageRecords)
          .innerJoin(users, eq(usageRecords.userId, users.id))
          .where(
            and(
              eq(users.appId, appId),
              eq(usageRecords.date, sql`CURRENT_DATE`)
            )
          )
          .then((rows) => ({
            totalReplies: Number(rows[0]?.totalReplies || 0),
            totalTokens: Number(rows[0]?.totalTokens || 0),
            successRate: Number(rows[0]?.successRate || 0) * 100,
          })),

        // 活跃订阅数
        ctx.db
          .select({ count: count() })
          .from(subscriptions)
          .innerJoin(users, eq(subscriptions.userId, users.id))
          .where(
            and(
              eq(users.appId, appId),
              eq(subscriptions.status, "active"),
              inArray(subscriptions.tier, ["pro_monthly", "pro_yearly"])
            )
          )
          .then((rows) => Number(rows[0]?.count || 0)),

        // 今日收入（简化版）
        ctx.db
          .select({
            revenue: sum(sql`case
              when ${subscriptionPlans.billingPeriod} = 'monthly' then ${subscriptionPlans.priceCents} / 100 / 30
              when ${subscriptionPlans.billingPeriod} = 'yearly' then ${subscriptionPlans.priceCents} / 100 / 365
              else 0
            end`),
          })
          .from(subscriptions)
          .innerJoin(users, eq(subscriptions.userId, users.id))
          .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
          .where(
            and(
              eq(users.appId, appId),
              eq(subscriptions.status, "active"),
              eq(subscriptions.createdAt, sql`CURRENT_DATE`)
            )
          )
          .then((rows) => Number(rows[0]?.revenue || 0)),
      ]);

      return {
        timestamp: new Date().toISOString(),
        metrics: {
          totalUsers,
          todayActiveUsers,
          activeSubscriptions,
          revenueToday,
          todayUsage,
        },
        health: {
          database: true,
          aiServices: true, // TODO: 实际检查AI服务健康状态
          rateLimiting: false, // TODO: 实现速率限制检查
        },
      };
    }),
});