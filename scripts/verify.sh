#!/usr/bin/env bash
# 技术验收：退出码 0 = 全部通过
set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${VERIFY_PORT:-3010}"
STRIPE_WHSEC="whsec_verify_local_only"
BASE="http://localhost:$PORT"
FAIL=0
step() { printf '\n==== %s ====\n' "$1"; }
run() {
  local name="$1"; shift
  if "$@"; then echo "PASS  $name"; else echo "FAIL  $name"; FAIL=1; fi
}

step "类型检查 / Lint"
run "tsc --noEmit" npm run -s typecheck
run "eslint" npx eslint src scripts --quiet

step "双语文案"
run "check-i18n（key 一致 / 无空值 / 无残留中文）" node scripts/check-i18n.mjs

step "数据库迁移"
run "prisma migrate status" npx prisma migrate status
DB="$(grep DATABASE_URL .env.local | cut -d'"' -f2 | sed 's/?schema=public//')"
EXPECTED=$(node -e 'console.log(require("./src/data/catalog.json").length)')
TPL=$(psql "$DB" -Atc 'select count(*) from "Template"')
EDITABLE=$(psql "$DB" -Atc 'select count(*) from "Template" where editable')
run "Template 数量 = catalog.json（期望 ${EXPECTED}，实际 ${TPL}）" test "$TPL" = "$EXPECTED"
run "模板全部可编辑（${EDITABLE}/${TPL}）" test "$EDITABLE" = "$TPL"

step "生产构建"
run "next build" npm run -s build

step "启动生产服务 :$PORT"
lsof -iTCP:"$PORT" -sTCP:LISTEN -t | xargs -r kill 2>/dev/null
AI_PROVIDER=fake FAKE_AI_DELAY_MS=50 STORAGE=local STRIPE_MODE=fake STRIPE_WEBHOOK_SECRET="$STRIPE_WHSEC" AYRSHARE_MODE=fake APP_URL="$BASE" npx next start -p "$PORT" > .next/verify-server.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for _ in $(seq 1 60); do curl -s -o /dev/null "$BASE/login" && break; sleep 0.5; done

COOKIE=$(npx tsx -e 'import "./scripts/load-env"; import { signSession, SESSION_COOKIE } from "./src/lib/auth/token"; import { prisma } from "./src/lib/db/client"; (async()=>{const u=await prisma.user.findUniqueOrThrow({where:{phone:"13900000000"}}); console.log(`${SESSION_COOKIE}=${await signSession({userId:u.id,role:u.role})}`); await prisma.$disconnect();})()')

step "双语路由探针（NEXT_LOCALE=zh/en → <html lang> 与状态码）"
for path in "/" "/legal/terms" "/legal/privacy" "/legal/refund" "/login" "/register" "/forgot-password" "/plans" "/templates" "/templates?platform=instagram-post" "/templates/orshot-2427" "/designs" "/profile" "/membership" "/membership/success" "/membership/cancel" "/create" "/generations"; do
  for loc in zh en; do
    want=$([ "$loc" = zh ] && echo "zh-CN" || echo "en")
    SESSION=$( [[ "$path" == / || "$path" == /legal/* || "$path" == /login || "$path" == /register || "$path" == /forgot-password || "$path" == /plans ]] || echo "; $COOKIE" )
    RES=$(curl -s -w '\n%{http_code}' -H "Cookie: NEXT_LOCALE=$loc$SESSION" "$BASE$path")
    CODE=$(tail -n1 <<<"$RES")
    OK=0; [[ "$CODE" == 200 ]] && grep -q "<html lang=\"$want\"" <<<"$RES" && OK=1
    run "$loc $path → $CODE lang=$want" test "$OK" = 1
  done
done

step "路由 + 鉴权 + 资源约束探针"
run "probes" npx tsx scripts/probes.ts "$BASE"

step "邮箱注册 / 验证码 / 找回密码探针"
run "auth-probe" npx tsx scripts/auth-probe.ts "$BASE"

step "后台：客户方案 / 线下开通 / 调整 credit / 会员等级"
run "admin-probe" npx tsx scripts/admin-probe.ts "$BASE"

step "付费墙：导出 / 发布计划扣费、平台权益"
run "paywall-probe" npx tsx scripts/paywall-probe.ts "$BASE"

step "Ayrshare 发布：加密存储、多租户隔离、连接 + 真实（fake）发布流程"
run "social-probe" env AYRSHARE_MODE=fake NODE_OPTIONS="--conditions=react-server" npx tsx scripts/social-probe.ts "$BASE"

step "AI 生图：扣费 / 失败退款 / 限流 / 送到编辑器"
run "gen-probe" npx tsx scripts/gen-probe.ts "$BASE"

step "Stripe：Checkout 金额 / webhook 验签与幂等 / 充值 / 改价同步"
run "stripe-probe" env STRIPE_WEBHOOK_SECRET="$STRIPE_WHSEC" npx tsx scripts/stripe-probe.ts "$BASE"

step "公开页与受保护页"
for path in / /plans /legal/terms /legal/privacy /legal/refund; do
  C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
  run "$path 未登录 200（实际 ${C}）" test "$C" = 200
done
C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/legal/nope")
run "/legal/不存在 → 404（实际 ${C}）" test "$C" = 404
for path in /membership /membership/success /create /generations; do
  C=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")
  run "$path 未登录 → 307 跳登录（实际 ${C}）" test "$C" = 307
done

step "Credit 账本不变量"
run "ledger-probe" env NODE_OPTIONS="--conditions=react-server" npx tsx scripts/ledger-probe.ts

step "查询探针"
run "query-probe" env PRISMA_QUERY_COUNT=1 NODE_OPTIONS="--conditions=react-server" npx tsx scripts/query-probe.ts

step "密钥不进浏览器端代码"
LEAK=$(grep -rlE "STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|OPENAI_API_KEY|AYRSHARE_API_KEY|ENCRYPTION_KEY|sk_(live|test)_[A-Za-z0-9]|whsec_" .next/static 2>/dev/null | wc -l | tr -d ' ')
run ".next/static 中无 Stripe / OpenAI 密钥（命中文件数=${LEAK}）" test "$LEAK" = "0"

step "密码存储"
PLAIN=$(psql "$DB" -Atc "select count(*) from \"User\" where \"passwordHash\" not like '\$2%'")
run "User.passwordHash 全部为 bcrypt（非 bcrypt 数=${PLAIN}）" test "$PLAIN" = "0"

step "性能基线（autocannon 10s，/templates、/templates/[id]、/generations、/membership）"
for path in "/templates" "/templates/orshot-2427" "/generations" "/membership"; do
  OUT=$(npx autocannon -d 10 -c 10 -j -H "cookie=$COOKIE" "$BASE$path" 2>/dev/null)
  read -r P50 P97 RPS NON2XX <<<"$(echo "$OUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);console.log(r.latency.p50,r.latency.p97_5,Math.round(r.requests.average),r.non2xx)})')"
  echo "INFO  $path  p50=${P50}ms  p97.5=${P97}ms  req/s=${RPS}  non2xx=${NON2XX}"
  run "性能 $path p97.5 < 300ms 且无非 2xx" test "$P97" -lt 300 -a "$NON2XX" = "0"
done

printf '\n==== 结论 ====\n'
if [ "$FAIL" = 0 ]; then echo "VERIFY PASS"; else echo "VERIFY FAIL"; fi
exit "$FAIL"
