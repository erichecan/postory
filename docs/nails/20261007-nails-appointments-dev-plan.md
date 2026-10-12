# PoStory for Nails — 工作包 3「预约本与空档引擎」DEV-PLAN

状态：已实施并完成本地验收（2026-10-08）。执行时采用原生 Intl 时区换算，没有新增 Luxon 依赖；实现和验收结果以 `HANDOFF.md` 的 2026-10-08 记录为准。

## 读取了哪些文档

- `AGENTS.md`、`docs/nails/CONTINUE.md`、`docs/nails/WORK-PACKAGES.md`、`docs/nails/HANDOFF.md`
- 现有代码：`prisma/schema.prisma`（`Studio`/`MediaAsset` 模型与现有迁移）、
  `prisma/migrations/20261008014507_nails_media_asset/migration.sql`（RLS 策略写法参照）、
  `src/lib/db/studios.ts`（owner 过滤 + 事务内 RLS 身份写法）、`src/lib/nails/workspace.ts`、`src/lib/nails/validation.ts`、
  `src/app/nails/(workspace)/appointments/page.tsx`（当前纯占位页）、`src/components/nails/{primitives,studio-form,bottom-sheet}.tsx`、
  `scripts/nails-probe.ts`（Server Action 调用方式、事务内临时受限角色验证 RLS 的写法、并发测试写法）、`package.json`（确认无既有日期/时区库）

## 模块拆解

1. **Schema**：新增 `BusinessHours`（每周 7 天的营业时间规则）、`ClosedPeriod`（手动关闭时段）、`Appointment`（预约，含 `confirmed`/`cancelled` 状态）；`Studio` 增加 `defaultDurationMinutes` 字段与三个反向关系。
2. **数据库层并发保护**：`Appointment` 加 Postgres `EXCLUDE USING gist` 排他约束（需 `btree_gist` 扩展），按 `studioId` 相等 + 时间范围重叠、且仅对 `confirmed` 状态生效，在数据库层面保证"同一工作室两个重叠预约不能并发写入"，不依赖应用层先查后写的竞态窗口。
3. **时区与夏令时工具**（`src/lib/nails/time.ts`，纯函数，不加 `server-only`，可被 probe 脚本直接 import）：
   - 新增依赖 `luxon`：手写 IANA 时区 ↔ UTC 换算在夏令时切换日（跳过的小时/重复的小时）容易出细节错误，而验收标准明确点名"覆盖跨天与夏令时边界"，用经过验证的库比手搓 `Intl.DateTimeFormat` 迭代算法更可靠，这是本包唯一的新依赖。
   - 导出 `zonedDayBounds(localDate, timeZone)`、`localMinutesToUtc(localDate, minutes, timeZone)`、`utcToLocalMinutes(instant, timeZone)` 等窄接口，不直接把 `luxon` 的 `DateTime` 类型暴露到调用方。
4. **空档计算**（`src/lib/nails/availability.ts`，纯函数，不加 `server-only`）：
   - `computeAvailableSlots({ businessHours, closedPeriods, appointments, localDate, timeZone, durationMinutes, ignoreAppointmentId? })`：按营业时间切出候选时间槛，减去已关闭时段与已确认预约占用的时间，返回可预约起始时间列表；编辑已有预约时通过 `ignoreAppointmentId` 不把它自己算作占用。
   - 纯函数、无数据库/会话依赖，可在 `nails-probe.ts` 里直接 import 做夏令时边界等确定性断言（L0）。
5. **数据访问层**（`src/lib/db/appointments.ts`，`server-only`）：业务时间（读/写）、关闭时段（增/删）、预约（增/改/取消/按日期范围查询），复用 `studios.ts` 的 `withOwner()` 事务 RLS 写法；首次访问且 `BusinessHours` 为空时，在同一事务内按 `skipDuplicates` 幂等写入默认营业时间（周一至周五 9:00–18:00，周末关闭），避免空档引擎在用户设置前出现死路。
6. **Server Actions**（`src/lib/actions/appointments.ts`）：
   - `saveScheduleSettingsAction`：保存每周营业时间 + 默认预约时长，服务端校验 `startMinute < endMinute`、范围 0–1439。
   - `createClosedPeriodAction` / `deleteClosedPeriodAction`：关闭时段增删，创建时在同一事务内查询是否与现有 `confirmed` 预约重叠，重叠则拒绝并提示（应用层检查，人工操作为主，并发写入风险低，不额外加数据库约束）。
   - `createAppointmentAction` / `updateAppointmentAction` / `cancelAppointmentAction`：写入前做基本字段校验（客户称呼必填、时间在营业时间内可选但不强制——允许手动加急/例外预约），冲突由数据库排他约束兜底；捕获 Postgres `23P01`（exclusion_violation）转成"这个时间段刚被预约，请换一个时间"的友好提示，而不是 500。
7. **UI**：重写 `src/app/nails/(workspace)/appointments/page.tsx`（Server Component，按 `?date=`/`?view=day|week` 查询参数渲染）+ 新组件：
   - `src/components/nails/appointments-view.tsx`：Today/Week 切换、日期前进后退、当天时间槛网格（空档可点击新建、已占用显示客户称呼与时间，点击进入编辑/取消）。
   - `src/components/nails/appointment-sheet.tsx`：复用现有 `BottomSheet`，新建/编辑预约表单（日期+起始时间下拉，从 `computeAvailableSlots` 结果生成选项+取消按钮）。
   - `src/components/nails/schedule-settings-sheet.tsx`：营业时间（每周 7 天开关+起止时间）、默认预约时长、关闭时段列表增删，复用 `BottomSheet`。
   - 所有时间展示与交互都以 `studio.timeZone` 为准，不用浏览器本地时区渲染服务端数据。
8. **双语文案**：`nails.json` 替换现有占位键（`appointmentsEmptyTitle` 等），新增营业时间/预约表单/冲突提示相关键（zh/en 同步）。
9. **测试**：`scripts/nails-probe.ts` 新增——
   - `time.ts`/`availability.ts` 的夏令时边界断言（北美春季跳过的那一小时、秋季重复的那一小时，验证 `zonedDayBounds` 与 `computeAvailableSlots` 不产出负数/重复/缺失槛位）。
   - `BusinessHours`/`ClosedPeriod`/`Appointment` 三张新表的 RLS 隔离探针（跨工作室读不到、改不了、删不掉）。
   - 并发冲突探针：对同一工作室同一时间槛同时发两个 `createAppointmentAction` 请求，断言恰好一个成功、另一个收到友好冲突错误而不是 500 或两个都成功。
   - 新建预约后该时间槛从 `computeAvailableSlots` 结果消失；取消后恢复；跨天（预约跨越本地午夜附近）与工作室时区不是 `UTC`/服务器时区时结果仍正确。
   - 浏览器实际操作（390px）：设置营业时间 → 新建预约 → 空档减少 → 编辑预约改时间 → 取消预约 → 空档恢复 → Today/Week 切换 → 另一账号看不到此工作室的任何预约/营业时间设置。

## Schema 设计

```prisma
model BusinessHours {
  id          String   @id @default(cuid())
  studioId    String
  studio      Studio   @relation(fields: [studioId], references: [id], onDelete: Cascade)
  weekday     Int      // 0=Sunday .. 6=Saturday
  isClosed    Boolean  @default(false)
  startMinute Int      // local minutes since midnight, 0-1439
  endMinute   Int
  updatedAt   DateTime @updatedAt

  @@unique([studioId, weekday])
}

model ClosedPeriod {
  id        String   @id @default(cuid())
  studioId  String
  studio    Studio   @relation(fields: [studioId], references: [id], onDelete: Cascade)
  startAt   DateTime
  endAt     DateTime
  reason    String?  @db.VarChar(120)
  createdAt DateTime @default(now())

  @@index([studioId, startAt])
}

enum AppointmentStatus {
  confirmed
  cancelled
}

model Appointment {
  id         String            @id @default(cuid())
  studioId   String
  studio     Studio            @relation(fields: [studioId], references: [id], onDelete: Cascade)
  startAt    DateTime
  endAt      DateTime
  clientName String            @db.VarChar(80)
  note       String?           @db.VarChar(280)
  status     AppointmentStatus @default(confirmed)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt

  @@index([studioId, startAt])
}
```

`Studio` 增加：

```prisma
defaultDurationMinutes Int             @default(60)
businessHours          BusinessHours[]
closedPeriods          ClosedPeriod[]
appointments           Appointment[]
```

RLS（新迁移手写 SQL，同 `MediaAsset` 写法，三张表各一条）：

```sql
ALTER TABLE "BusinessHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BusinessHours" FORCE ROW LEVEL SECURITY;
CREATE POLICY "business_hours_owner" ON "BusinessHours"
    USING ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)))
    WITH CHECK ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)));
-- 同样的策略分别应用到 "ClosedPeriod" 与 "Appointment"。

CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Appointment" ADD CONSTRAINT "appointment_no_overlap"
    EXCLUDE USING gist (
      "studioId" WITH =,
      tstzrange("startAt", "endAt") WITH &&
    ) WHERE ("status" = 'confirmed');
```

## 路由清单（新增，全部 Server Actions，无新 HTTP 路由）

| Server Action | 鉴权 |
| --- | --- |
| `saveScheduleSettingsAction` | 登录 + studio |
| `createClosedPeriodAction` / `deleteClosedPeriodAction` | 登录 + studio |
| `createAppointmentAction` / `updateAppointmentAction` / `cancelAppointmentAction` | 登录 + studio |

## 风险点

- **夏令时手搓算法的隐性 bug**：验收标准点名覆盖 DST 边界，手写 `Intl.DateTimeFormat` 迭代换算容易在跳过/重复的那一小时出错且不易被常规测试发现；引入 `luxon`（零配置、体积小、业界验证过）作为唯一新依赖，把这类正确性问题交给经过验证的实现，自己只写窄接口包装（见模块 3）。
- **预约并发冲突**：如果只做"先查有没有冲突再插入"的应用层检查，两个并发请求可能都查到"无冲突"再同时插入，产生双重预约。用 Postgres `EXCLUDE USING gist` 排他约束在数据库层面兜底，插入/更新时数据库自己保证互斥，应用层检查只用来提前给出更友好的报错，不是唯一防线。
- **关闭时段与预约的交叉冲突**：只在"新建关闭时段"时应用层检查是否与现有 `confirmed` 预约重叠并拒绝；不反向限制"新建预约不能落在未来会设置的关闭时段"之外的场景（这类场景已由 `computeAvailableSlots` 在生成候选槛位时排除，只是没有数据库级约束）。工作室设置自己的营业时间是低频、单人操作，应用层检查足够，不为此再加一个排他约束。
- **营销日历不可复用**：`src/lib/marketing-calendar/`、`src/lib/db/calendar.ts` 是内容发布计划，字段和语义都与预约不同（已在 `CONTINUE.md` 里确认），本包不复用其表或代码，只参照 `studios.ts` 的 RLS 事务写法。
- **默认营业时间懒加载**：首次访问 `/nails/appointments` 时若 `BusinessHours` 为空会在同一事务内自动按周一至周五 9:00–18:00、周末关闭写入默认值（`skipDuplicates`，并发安全），用户可随时修改；这是信息缺失时取的合理默认值，写进假设清单。
- **预约可以不落在营业时间内**：允许手动创建营业时间外的"加急/例外"预约（只挡重叠预约，不挡营业时间外），因为 WORK-PACKAGES.md 没有要求强制拒绝营业时间外预约，强行拒绝反而可能不符合美甲师的真实使用习惯（临时加班接单）；若后续用户反馈不对，再加开关。

## 附录 A：技术验收标准（`verify.sh` 范围之外，复用 `nails-probe.ts` 模式）

- `npx tsc --noEmit`、`npx eslint`、`npx prisma validate && npx prisma migrate status` 通过，新迁移本地应用成功、无数据重置。
- `scripts/nails-probe.ts` 新增项全部 PASS：
  - 三张新表的 RLS 隔离（跨 studio 读/改/删全部被拒绝）。
  - 并发冲突探针：同一时间槛并发两次创建，恰好一个成功。
  - `computeAvailableSlots`/`time.ts` 的夏令时边界确定性断言（北美春季缺失小时、秋季重复小时均不产出异常槛位）。
  - 新建预约后目标槛位从可用列表消失；取消后恢复；跨天边界正确。
- 浏览器实际操作（390px，Playwright）：设置营业时间、新建/编辑/取消预约、Today/Week 切换、另一账号隔离，全部截图存档于 `docs/nails/shots/`。
- 无命令输出的条目标记 ⚠️ 未验证，不写入"符合"。

## 歧义清单

- WORK-PACKAGES.md 未说明预约是否必须落在营业时间内 → 按保守解释处理：营业时间只用于生成"推荐空档"，不强制拒绝营业时间外的手动预约（见风险点最后一条）。
- 未说明关闭时段与已有预约冲突时应如何处理 → 按保守解释处理：拒绝创建会与现有确认预约重叠的关闭时段，不静默覆盖或取消已有预约。

## 假设清单

- 默认预约时长取 60 分钟，可在营业时间设置里修改；首次访问自动写入周一至周五 9:00–18:00 的默认营业时间，周末默认关闭。
- 预约不记录联系方式/手机号等敏感字段，只记录称呼与备注（WORK-PACKAGES.md 未要求存更多字段，先按最小字段集实现，需要时再加迁移）。
- 空档粒度与默认预约时长相同（不单独做"15 分钟网格"之类更细粒度设置），因为验收标准没有要求比"默认预约时长"更细的空档颗粒度。
