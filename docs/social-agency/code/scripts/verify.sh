#!/usr/bin/env bash
# social-agency 技术验收脚本
#
# 状态:计划阶段草稿。项目脚手架(Next.js + Prisma)尚未建立,本脚本目前无法整体跑通,
# 标记为 ⚠️ 未验证。执行阶段(npx create-next-app 等步骤完成后)需要回来把每一段的
# 占位路径/命令替换成真实值,并确保全部通过后才允许出 DEV-REPORT.md。
#
# 用法: bash scripts/verify.sh [--scope <module>]

set -euo pipefail

FAIL=0
pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; FAIL=1; }
warn() { echo "⚠️  $1 (未验证,占位)"; }

echo "== 1. 类型检查 =="
if [ -f package.json ]; then
  npx tsc --noEmit && pass "tsc --noEmit" || fail "tsc --noEmit"
else
  warn "项目尚未初始化(无 package.json),跳过 tsc 检查"
fi

echo "== 2. 构建 =="
if [ -f package.json ]; then
  npm run build && pass "npm run build" || fail "npm run build"
else
  warn "项目尚未初始化,跳过构建"
fi

echo "== 3. 数据库迁移状态 =="
if [ -f prisma/schema.prisma ]; then
  npx prisma migrate status && pass "prisma migrate status" || fail "prisma migrate status"
else
  warn "prisma/schema.prisma 不存在,跳过迁移检查"
fi

echo "== 4. 路由探针(非 404/500) =="
BASE_URL="${VERIFY_BASE_URL:-http://localhost:3000}"
ROUTES=(
  "/login"
  "/dashboard"
  "/dashboard/connect"
  "/dashboard/templates"
  "/dashboard/history"
  "/admin/login"
  "/admin"
  "/admin/clients"
  "/admin/templates"
)
if curl -sf -o /dev/null "$BASE_URL" 2>/dev/null; then
  for r in "${ROUTES[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$r")
    if [ "$code" = "404" ] || [ "$code" = "500" ]; then
      fail "路由探针 $r 返回 $code"
    else
      pass "路由探针 $r 返回 $code"
    fi
  done
else
  warn "服务未启动($BASE_URL 不可达),跳过路由探针。执行阶段先 npm run dev 再跑本脚本"
fi

echo "== 5. 鉴权探针(401/401/403) =="
# 写操作(发布)与敏感读取(客户列表)分别用「无 token / 错 token / 低权限」请求
declare -A AUTH_CASES=(
  ["无 token 访问 /admin/clients"]="401"
  ["错 token 访问 /admin/clients"]="401"
  ["client 角色 token 访问 /admin/clients"]="403"
  ["无 token 调用发布接口"]="401"
)
for case_name in "${!AUTH_CASES[@]}"; do
  warn "鉴权探针 [$case_name] 期望 ${AUTH_CASES[$case_name]} — 需要执行阶段接入真实测试账号后补全 curl 断言"
done

echo "== 6. 查询探针(N+1 / 分页) =="
warn "需要在执行阶段开启 Prisma query log,断言 /dashboard/history 与 /admin/clients 列表接口的查询数不随数据量线性增长"

echo "== 7. 资源约束(上传限制 / 高频接口缓存) =="
warn "需要在执行阶段验证:Logo/照片上传大小限制生效;/dashboard/templates 列表接口有合理缓存"

echo "== 8. 性能基线(autocannon) =="
if command -v autocannon >/dev/null 2>&1 && curl -sf -o /dev/null "$BASE_URL" 2>/dev/null; then
  autocannon -c 10 -d 10 "$BASE_URL/dashboard/templates" || fail "autocannon 压测执行失败"
  echo "-> 数值需人工写入台账,阈值由开发者自定并在超标时自行修复"
else
  warn "autocannon 未安装或服务未启动,跳过性能基线"
fi

echo "== 9. 第三方 Provider 契约测试 =="
warn "需要执行阶段跑单元测试套件: npm run test -- services/__tests__/generateContent.test.ts services/__tests__/publish.test.ts"

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "❌ verify.sh 未通过,禁止出具 DEV-REPORT.md"
  exit 1
else
  echo "⚠️  当前多数检查项因项目尚未初始化而标记为未验证,不是全部通过。"
  echo "   本脚本会在执行阶段(项目脚手架建立后)被回填为可完整运行的版本。"
fi
