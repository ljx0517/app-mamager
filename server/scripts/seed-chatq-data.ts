/**
 * 将 ChatQ 主数据（维度、标签、场景、关系、人设包）从静态数据写入数据库
 * 运行：cd server && pnpm exec tsx scripts/seed-chatq-data.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { db } from "../src/db/index.js";
import {
  chatqDimensions,
  chatqPersonaTags,
  chatqScenes,
  chatqRelations,
  chatqPersonaPackages,
} from "../src/db/schema.js";
import { CHATQ_SCENES } from "../src/app_settings/chatq/data/scenes.js";
import { CHATQ_RELATIONS } from "../src/app_settings/chatq/data/relations.js";
import { CHATQ_PERSONA_PACKAGES } from "../src/app_settings/chatq/data/personaPackages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dimensionsData = JSON.parse(
  readFileSync(
    join(__dirname, "../src/app_settings/chatq/data/personaDimensions.json"),
    "utf-8"
  )
);

type DimensionsJson = { dimensions: Array<{
  id: string;
  name: string;
  description: string;
  sort: number;
  tags: Array<{
    id: string;
    name: string;
    sentiment: string;
    weight_default: number;
    description: string;
  }>;
}>};

async function seed() {
  const { dimensions } = dimensionsData as DimensionsJson;

  console.log("Seeding chatq_dimensions...");
  for (const d of dimensions) {
    await db
      .insert(chatqDimensions)
      .values({
        dimensionId: d.id,
        name: d.name,
        description: d.description ?? null,
        sort: d.sort,
      })
      .onConflictDoNothing({ target: chatqDimensions.dimensionId });
  }

  console.log("Seeding chatq_persona_tags...");
  for (const d of dimensions) {
    for (let i = 0; i < d.tags.length; i++) {
      const t = d.tags[i];
      await db
        .insert(chatqPersonaTags)
        .values({
          dimensionId: d.id,
          tagId: t.id,
          name: t.name,
          sentiment: t.sentiment as "positive" | "neutral" | "negative",
          weightDefault: t.weight_default,
          description: t.description ?? null,
          sort: i,
        })
        .onConflictDoNothing({
          target: [chatqPersonaTags.dimensionId, chatqPersonaTags.tagId],
        });
    }
  }

  console.log("Seeding chatq_scenes...");
  for (let i = 0; i < CHATQ_SCENES.length; i++) {
    const s = CHATQ_SCENES[i];
    await db
      .insert(chatqScenes)
      .values({
        sceneId: s.id,
        name: s.name,
        description: s.description ?? null,
        icon: s.icon ?? null,
        color: s.color ?? null,
        sort: i,
      })
      .onConflictDoNothing({ target: chatqScenes.sceneId });
  }

  console.log("Seeding chatq_relations...");
  for (let i = 0; i < CHATQ_RELATIONS.length; i++) {
    const r = CHATQ_RELATIONS[i];
    await db
      .insert(chatqRelations)
      .values({
        relationId: r.id,
        name: r.name,
        description: r.description ?? null,
        sort: i,
      })
      .onConflictDoNothing({ target: chatqRelations.relationId });
  }

  console.log("Seeding chatq_persona_packages...");
  for (let i = 0; i < CHATQ_PERSONA_PACKAGES.length; i++) {
    const p = CHATQ_PERSONA_PACKAGES[i];
    await db
      .insert(chatqPersonaPackages)
      .values({
        packageId: p.id,
        name: p.name,
        description: p.description ?? null,
        gender: p.gender,
        ageRange: p.age_range ?? [],
        tags: p.tags,
        scenes: p.scenes,
        sort: i,
      })
      .onConflictDoNothing({ target: chatqPersonaPackages.packageId });
  }

  console.log("ChatQ 主数据 seed 完成。");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
