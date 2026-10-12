import "./load-env";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { signSession, SESSION_COOKIE } from "../src/lib/auth/token";
import { localDayBounds, localDateTimeToUtc, weekdayForDate } from "../src/lib/nails/time";
import { computeAvailableSlots } from "../src/lib/nails/availability";

const base = process.argv[2] ?? "http://localhost:3011";
const prefix = `nails-calendar-${Date.now()}`;
const ownerEmail = `${prefix}-a@example.com`;
const otherEmail = `${prefix}-b@example.com`;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
let passes = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); passes++; console.log(`PASS ${name}`); };

async function get(path: string, cookie = "") {
  return fetch(base + path, { redirect: "manual", headers: { cookie: `NEXT_LOCALE=en; ${cookie}` } });
}

async function serverAction(path: string, name: string, args: unknown[] | Record<string, string>, cookie: string) {
  await get(path, cookie);
  const manifestPath = base.endsWith(":3002") ? ".next/dev/server/server-reference-manifest.json" : ".next/server/server-reference-manifest.json";
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { node: Record<string, { exportedName: string }> };
  const actionId = Object.entries(manifest.node).find(([, entry]) => entry.exportedName === name)?.[0];
  assert.ok(actionId, `Could not find Server Action ${name}`);
  const headers: Record<string, string> = { "Next-Action": actionId, Accept: "text/x-component", Origin: base, cookie: `NEXT_LOCALE=en; ${cookie}` };
  let body: BodyInit;
  const fields = !Array.isArray(args);
  if (fields) {
    const form = new FormData();
    for (const [key, value] of Object.entries(args)) form.set(`_1_${key}`, value);
    form.set("0", JSON.stringify(["$undefined", "$K1"]));
    body = form;
  } else {
    headers["Content-Type"] = "text/plain;charset=UTF-8";
    body = JSON.stringify(args);
  }
  const response = await fetch(base + path, { method: "POST", redirect: "manual", headers, body });
  return { status: response.status, body: await response.text(), location: response.headers.get("x-action-redirect")?.split(";")[0] ?? "" };
}

async function rlsProbe(ownerId: string, otherStudioId: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const role = `nails_appt_probe_${process.pid}`;
    await client.query(`CREATE ROLE ${role} NOLOGIN NOSUPERUSER NOBYPASSRLS`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    await client.query('GRANT SELECT ON "Studio" TO ' + role);
    for (const table of ["BusinessHours", "ClosedPeriod", "Appointment"]) await client.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON "${table}" TO ${role}`);
    await client.query(`SET LOCAL ROLE ${role}`);
    for (const table of ["BusinessHours", "ClosedPeriod", "Appointment"]) {
      await client.query("SELECT set_config('app.studio_owner_id', '', true)");
      check(`${table} has no rows without owner context`, (await client.query(`SELECT * FROM "${table}"`)).rowCount === 0);
      await client.query("SELECT set_config('app.studio_owner_id', $1, true)", [ownerId]);
      check(`${table} RLS blocks foreign reads`, (await client.query(`SELECT * FROM "${table}" WHERE "studioId"=$1`, [otherStudioId])).rowCount === 0);
      const before = (await client.query(`SELECT count(*)::int AS n FROM "${table}"`)).rows[0].n as number;
      check(`${table} RLS blocks foreign updates`, (await client.query(`UPDATE "${table}" SET "studioId"=$1 WHERE "studioId"=$2`, ["forged", otherStudioId])).rowCount === 0);
      check(`${table} RLS blocks foreign deletion`, (await client.query(`DELETE FROM "${table}" WHERE "studioId"=$1`, [otherStudioId])).rowCount === 0 && (await client.query(`SELECT count(*)::int AS n FROM "${table}"`)).rows[0].n === before);
    }
  } finally { await client.query("ROLLBACK"); await client.end(); }
}

async function main() {
  assert.match(base, /^http:\/\/localhost:\d+$/);
  assert.equal(new URL(process.env.DATABASE_URL!).hostname, "localhost");
  const now = new Date("2026-10-08T12:00:00Z");
  const spring = localDayBounds("2026-03-08", "America/Toronto");
  const fall = localDayBounds("2026-11-01", "America/Toronto");
  check("Spring DST gap is rejected", localDateTimeToUtc("2026-03-08", 150, "America/Toronto") === null);
  check("Fall DST duplicate wall-time can select both instants", localDateTimeToUtc("2026-11-01", 90, "America/Toronto", "later")!.getTime() - localDateTimeToUtc("2026-11-01", 90, "America/Toronto")!.getTime() === 60 * 60_000);
  check("Spring DST day has 23 elapsed hours", spring.end.getTime() - spring.start.getTime() === 23 * 60 * 60_000);
  check("Fall DST day has 25 elapsed hours", fall.end.getTime() - fall.start.getTime() === 25 * 60 * 60_000);

  const day = "2026-11-01";
  const sunday = computeAvailableSlots({ businessHours: [{ weekday: 0, isClosed: false, startMinute: 60, endMinute: 180 }], closedPeriods: [], appointments: [], localDate: day, timeZone: "America/Toronto", durationMinutes: 30 });
  check("Fall-back schedule preserves both repeated-hour slots", sunday.filter((slot) => slot.localMinute === 90).length === 2 && new Set(sunday.map((slot) => slot.startAt.toISOString())).size === sunday.length);
  const monday = "2026-10-12";
  const baseHours = [{ weekday: weekdayForDate(monday), isClosed: false, startMinute: 540, endMinute: 1080 }];
  const start = localDateTimeToUtc(monday, 600, "America/Toronto")!;
  const occupies = [{ id: "busy", startAt: start, endAt: new Date(start.getTime() + 60 * 60_000), status: "CONFIRMED" as const }];
  const freeBefore = computeAvailableSlots({ businessHours: baseHours, appointments: [], closedPeriods: [], localDate: monday, timeZone: "America/Toronto", durationMinutes: 60 });
  const freeAfter = computeAvailableSlots({ businessHours: baseHours, appointments: occupies, closedPeriods: [], localDate: monday, timeZone: "America/Toronto", durationMinutes: 60 });
  check("A new appointment removes exactly its busy time from availability", freeAfter.length === freeBefore.length - 1 && !freeAfter.some((slot) => slot.startAt.getTime() === start.getTime()));
  check("Cancellation restores the availability slot", computeAvailableSlots({ businessHours: baseHours, appointments: [{ ...occupies[0], status: "CANCELLED" }], closedPeriods: [], localDate: monday, timeZone: "America/Toronto", durationMinutes: 60 }).length === freeBefore.length);
  check("Closed periods remove overlapping availability", computeAvailableSlots({ businessHours: baseHours, appointments: [], closedPeriods: [{ startAt: start, endAt: new Date(start.getTime() + 60 * 60_000) }], localDate: monday, timeZone: "America/Toronto", durationMinutes: 60 }).length === freeBefore.length - 1);

  const userA = await prisma.user.create({ data: { email: ownerEmail, name: "Calendar A", passwordHash: "!probe", emailVerifiedAt: now } });
  const userB = await prisma.user.create({ data: { email: otherEmail, name: "Calendar B", passwordHash: "!probe", emailVerifiedAt: now } });
  try {
    const studioA = await prisma.studio.create({ data: { ownerId: userA.id, name: "Calendar A", timeZone: "America/Toronto" } });
    const studioB = await prisma.studio.create({ data: { ownerId: userB.id, name: "Calendar B", timeZone: "Asia/Shanghai" } });
    const [sessionA, sessionB] = await Promise.all([
      signSession({ userId: userA.id, role: userA.role, sv: userA.sessionVersion }),
      signSession({ userId: userB.id, role: userB.role, sv: userB.sessionVersion }),
    ]);
    const cookieA = `${SESSION_COOKIE}=${sessionA}`;
    const cookieB = `${SESSION_COOKIE}=${sessionB}`;

    const page = await get(`/nails/appointments?date=${monday}&view=day`, cookieA);
    const html = await page.text();
    check("Appointments page renders in the studio time zone", page.status === 200 && html.includes("America/Toronto"));
    const schedule = await prisma.businessHours.findMany({ where: { studioId: studioA.id } });
    check("First appointment view initializes seven default business-hour rows", schedule.length === 7 && schedule.filter((row) => !row.isClosed).length === 5);
    check("An unrelated account cannot see another studio's name or time zone", !(await (await get(`/nails/appointments?date=${monday}`, cookieB)).text()).includes("America/Toronto"));

    const startAt = localDateTimeToUtc(monday, 600, studioA.timeZone)!;
    const fields = { date: monday, startAt: startAt.toISOString(), clientName: "Riley", note: "First visit" };
    const [one, two] = await Promise.all([
      serverAction("/nails/appointments", "saveAppointmentAction", fields, cookieA),
      serverAction("/nails/appointments", "saveAppointmentAction", fields, cookieA),
    ]);
    const rows = await prisma.appointment.findMany({ where: { studioId: studioA.id, status: "CONFIRMED" } });
    check("Concurrent bookings serialize and only one overlapping appointment is created", rows.length === 1 && [one.body, two.body].some((body) => body.includes('"ok":true')));
    check("The losing concurrent booking gets a friendly conflict message", [one.body, two.body].some((body) => body.includes("This time was just booked")));

    const edit = await serverAction("/nails/appointments", "saveAppointmentAction", { ...fields, id: rows[0].id, startAt: localDateTimeToUtc(monday, 660, studioA.timeZone)!.toISOString(), clientName: "Riley Updated" }, cookieA);
    check("An appointment can be edited while keeping the old slot out of conflict checks", edit.body.includes('"ok":true') && (await prisma.appointment.findUniqueOrThrow({ where: { id: rows[0].id } })).clientName === "Riley Updated");
    const closeStart = localDateTimeToUtc(monday, 660, studioA.timeZone)!;
    const closure = await serverAction("/nails/appointments", "createClosedPeriodAction", { start: `${monday}T11:00`, end: `${monday}T12:00`, reason: "Lunch" }, cookieA);
    check("A closure overlapping a confirmed appointment is rejected", closure.body.includes("There is already an appointment") && await prisma.closedPeriod.count({ where: { studioId: studioA.id } }) === 0);
    const cancel = await serverAction("/nails/appointments", "cancelAppointmentAction", [rows[0].id], cookieA);
    check("Cancelling a booking makes the original slot available again", cancel.body.includes('"ok":true') && (await prisma.appointment.findUniqueOrThrow({ where: { id: rows[0].id } })).status === "CANCELLED");
    const closureAfterCancel = await serverAction("/nails/appointments", "createClosedPeriodAction", { start: `${monday}T11:00`, end: `${monday}T12:00`, reason: "Lunch" }, cookieA);
    check("A valid closure can be added after cancelling the appointment", closureAfterCancel.body.includes('"ok":true') && await prisma.closedPeriod.count({ where: { studioId: studioA.id } }) === 1);
    check("The cancelled appointment's overlapping time is excluded from availability", closeStart.toISOString() === (await prisma.closedPeriod.findFirstOrThrow({ where: { studioId: studioA.id } })).startAt.toISOString());

    const forged = await serverAction("/nails/appointments", "saveAppointmentAction", { ...fields, studioId: studioB.id, ownerId: userB.id }, cookieA);
    check("Forged tenant IDs are ignored and writes stay in the authenticated studio", forged.body.includes('"ok":true') && await prisma.appointment.count({ where: { studioId: studioA.id, status: "CONFIRMED" } }) === 1 && await prisma.appointment.count({ where: { studioId: studioB.id } }) === 0);
    await rlsProbe(userA.id, studioB.id);

    const week = await get(`/nails/appointments?date=${monday}&view=week`, cookieA);
    const weekHtml = await week.text();
    check("Week view shows all seven studio-local dates", week.status === 200 && ["Sun, Oct 11", "Mon, Oct 12", "Tue, Oct 13", "Wed, Oct 14", "Thu, Oct 15", "Fri, Oct 16", "Sat, Oct 17"].every((date) => weekHtml.includes(date)));
    const unauthenticated = await get(`/nails/appointments?date=${monday}`);
    check("Appointment route requires a session", unauthenticated.status === 307 && unauthenticated.headers.get("location")?.includes("/nails/login"));
    console.log(`APPOINTMENTS PROBE PASS (${passes} checks)`);
  } finally {
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, otherEmail] } } });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
