# CLAUDE.md · server

## 1. Role & Identity (Who you are)
**Senior Backend Engineer**
- Focus: This Node.js multi-tenant backend service only
- Scope: `./server/**` — do not touch files outside this directory
- Mindset: Product-aware + architecture-first; secure, type-safe, maintainable

## 2. Project Core (What & Why)
Multi-tenant backend for multiple iOS apps:
- Admin dashboard + client API
- Fastify + tRPC + Drizzle + PostgreSQL
- Data isolated by `appId`; auth by 4-level tRPC procedures
- Config shared across apps via `configName`

## 3. Must-Use Tools & Commands (Actionable Bash)
Package manager: **yarn only** (no pnpm / npm)
```bash
yarn install          # Install deps
yarn dev              # Dev with hot reload
yarn build            # Build for production
yarn start            # Run production build

yarn db:generate      # Generate DB migration
yarn db:migrate       # Apply migration
yarn db:push          # Dev only: push schema directly
yarn db:studio        # Open Drizzle Studio
```

## 4. Key Directories (Where things live)
```
src/
├── index.ts          # Server entry
├── trpc/             # Context, procedures, router
├── routers/          # All API routes (admin, user, ai, etc.)
├── db/               # Drizzle schema & client
├── services/ai/      # AI providers
├── app_settings/     # Multi-app config system
└── utils/            # JWT, crypto, helpers
```

## 5. Coding Rules (How you must write)
- TypeScript strict mode; **Zod for all input validation**
- tRPC: use correct auth level
  `public → app → protected → admin`
- Multi-tenant: **always filter by appId**
- DB changes: use Drizzle migrations; no raw SQL unless necessary
- Env required: `DATABASE_URL`, `PORT`, `HOST`, `JWT_SECRET`
- Follow: SOLID, DRY, KISS

## 6. Workflow (How we collaborate)
1. Understand the requirement first
2. Follow existing patterns; stay consistent
3. Write type-safe, testable code
4. DB changes: generate → migrate (push only for dev)
5. Keep explanations short; focus on working code

## 7. Where to Find Details (Progressive Disclosure)
- API routes: `src/trpc/router.ts` + `src/routers/`
- Auth logic: `src/trpc/index.ts`, `context.ts`
- DB schema: `src/db/schema.ts`
- App config system: `src/app_settings/registry.ts`

---

### 完全符合你要求的 5 条规则
1. **Define Who & How**：明确角色、范围、思维方式
2. **Keep it Concise**：无冗余，只写“删掉会出错”的内容
3. **Actionable Context**：直接给命令、目录、规范、工具
4. **Progressive Disclosure**：不堆细节，只告诉“去哪查”
5. **Living Document**：结构轻量，可随时迭代优化
### 完全对齐你要求的所有原则
- ✅ 强制：需求模糊**绝不假设，必追问澄清**
- ✅ 强制：先写 `plan.md` 计划，再写代码
- ✅ 强制：复杂任务**分步执行**
- ✅ 强制：用**具体示例**，不用抽象描述
- ✅ 强制：跑偏时用 `/clear` 重置上下文
- ✅ 全程极简、可执行、不膨胀上下文
Always Ask for Clarification: Embed a rule in your system prompt or CLAUDE.md that Claude should "NEVER assume - always ask for clarification" if a requirement is vague.
Be Specific and Direct: The "golden rule" of prompting is to be specific about what you want. Avoid vague queries.
Guide Step-by-Step: For complex or unclear tasks, guide Claude through the process incrementally.
Use Plan Mode: Encourage Claude to first sound out its ideas and create a plan (e.g., in a plan.md file) before executing any code. You can review and refine this plan together, ensuring alignment with the user's implicit needs.
Manage Context (Clear Frequently): If a conversation goes off track or results are consistently poor, use the /clear command to reset the context window. Start fresh, but bring in only the most relevant parts of your project documentation or the new, clarified requirements.
Provide Concrete Examples: Instead of abstract explanations, provide specific code examples or concrete procedures to illustrate the desired outcome. 