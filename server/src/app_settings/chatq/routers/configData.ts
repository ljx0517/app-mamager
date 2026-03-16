import { eq, asc } from "drizzle-orm";
import { router, appProcedure } from "@/trpc";
import {
  chatqDimensions,
  chatqPersonaTags,
  chatqScenes,
  chatqRelations,
  chatqPersonaPackages,
} from "@/db/schema.js";

/**
 * ChatQ 主数据只读接口（从数据库读取，admin 可管理）
 */
export const configDataRouter = router({
  listScenes: appProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(chatqScenes)
      .orderBy(asc(chatqScenes.sort), asc(chatqScenes.sceneId));
    return rows.map((r) => ({
      id: r.sceneId,
      name: r.name,
      description: r.description ?? "",
      icon: r.icon ?? "",
      color: r.color ?? "",
    }));
  }),

  listRelations: appProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(chatqRelations)
      .orderBy(asc(chatqRelations.sort), asc(chatqRelations.relationId));
    return rows.map((r) => ({
      id: r.relationId,
      name: r.name,
      description: r.description ?? undefined,
    }));
  }),

  listPersonaDimensions: appProcedure.query(async ({ ctx }) => {
    const dims = await ctx.db
      .select()
      .from(chatqDimensions)
      .orderBy(asc(chatqDimensions.sort), asc(chatqDimensions.dimensionId));
    const tags = await ctx.db
      .select()
      .from(chatqPersonaTags)
      .orderBy(asc(chatqPersonaTags.dimensionId), asc(chatqPersonaTags.sort), asc(chatqPersonaTags.tagId));
    const tagsByDim = new Map<string, typeof tags>();
    for (const t of tags) {
      if (!tagsByDim.has(t.dimensionId)) tagsByDim.set(t.dimensionId, []);
      tagsByDim.get(t.dimensionId)!.push(t);
    }
    return dims.map((d) => ({
      id: d.dimensionId,
      name: d.name,
      description: d.description ?? "",
      sort: d.sort,
      tags: (tagsByDim.get(d.dimensionId) ?? []).map((t) => ({
        id: t.tagId,
        name: t.name,
        sentiment: t.sentiment,
        weight_default: t.weightDefault,
        description: t.description ?? "",
      })),
    }));
  }),

  listPersonaPackages: appProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(chatqPersonaPackages)
      .orderBy(asc(chatqPersonaPackages.sort), asc(chatqPersonaPackages.packageId));
    return rows.map((r) => ({
      id: r.packageId,
      name: r.name,
      description: r.description ?? "",
      gender: r.gender,
      age_range: r.ageRange ?? [],
      tags: r.tags,
      scenes: r.scenes,
    }));
  }),
});
