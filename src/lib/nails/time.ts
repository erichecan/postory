export type LocalDateParts = { year: number; month: number; day: number };
export type LocalDateTimeParts = LocalDateParts & { hour: number; minute: number };
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function localDateParts(date: string): LocalDateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [, y, mo, d] = m;
  const parts = { year: Number(y), month: Number(mo), day: Number(d) };
  const check = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return check.getUTCFullYear() === parts.year && check.getUTCMonth() === parts.month - 1 && check.getUTCDate() === parts.day ? parts : null;
}

export function localDateString(parts: LocalDateParts) {
  return `${parts.year.toString().padStart(4, "0")}-${parts.month.toString().padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

export function addLocalDays(date: string, amount: number) {
  const parts = localDateParts(date);
  if (!parts || !Number.isInteger(amount)) throw new RangeError("Invalid local date or day offset");
  const result = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount));
  return localDateString({ year: result.getUTCFullYear(), month: result.getUTCMonth() + 1, day: result.getUTCDate() });
}

export function weekdayForDate(date: string) {
  const parts = localDateParts(date);
  if (!parts) throw new RangeError("Invalid local date");
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function localPartsAt(instant: Date, timeZone: string): LocalDateTimeParts {
  const parts = formatter(timeZone).formatToParts(instant);
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(v.year), month: Number(v.month), day: Number(v.day), hour: Number(v.hour), minute: Number(v.minute) };
}

/** Convert studio wall time to UTC. Ambiguous fall-back time picks the earlier occurrence by default. */
export function localDateTimeToUtc(date: string, minute: number, timeZone: string, disambiguation: "earlier" | "later" = "earlier"): Date | null {
  const day = localDateParts(date);
  if (!day || !Number.isInteger(minute) || minute < 0 || minute > 1440) return null;
  const target = new Date(Date.UTC(day.year, day.month - 1, day.day, Math.floor(minute / 60), minute % 60));
  const targetEpoch = target.getTime();
  const offsets = new Set<number>();
  // Sample both sides of the wall time. This discovers both offsets at a DST fold.
  for (let delta = -48; delta <= 48; delta += 3) {
    const instant = new Date(targetEpoch + delta * 60 * 60 * 1000);
    const local = localPartsAt(instant, timeZone);
    const localEpoch = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    offsets.add(localEpoch - Math.floor(instant.getTime() / 60_000) * 60_000);
  }
  const matches = [...offsets]
    .map((offset) => new Date(targetEpoch - offset))
    .filter((instant) => {
      const local = localPartsAt(instant, timeZone);
      return local.year === day.year && local.month === day.month && local.day === day.day &&
        local.hour === Math.floor(minute / 60) && local.minute === minute % 60;
    })
    .sort((a, b) => a.getTime() - b.getTime());
  return matches.length ? matches[disambiguation === "later" ? matches.length - 1 : 0] : null;
}

export function localMinutesAt(instant: Date, timeZone: string) {
  const p = localPartsAt(instant, timeZone);
  return { date: localDateString(p), minute: p.hour * 60 + p.minute };
}

export function dateTimeInputValue(instant: Date, timeZone: string) {
  const p = localPartsAt(instant, timeZone);
  return `${localDateString(p)}T${p.hour.toString().padStart(2, "0")}:${p.minute.toString().padStart(2, "0")}`;
}

export function localDayBounds(date: string, timeZone: string) {
  const start = localDateTimeToUtc(date, 0, timeZone, "earlier") ??
    Array.from({ length: 180 }, (_, i) => i + 1).map((minute) => localDateTimeToUtc(date, minute, timeZone, "earlier")).find((value) => value !== null) ?? null;
  const nextDate = addLocalDays(date, 1);
  const end = localDateTimeToUtc(nextDate, 0, timeZone, "earlier") ??
    Array.from({ length: 180 }, (_, i) => i + 1).map((minute) => localDateTimeToUtc(nextDate, minute, timeZone, "earlier")).find((value) => value !== null) ?? null;
  if (!start || !end) throw new RangeError(`Cannot resolve local day ${date} in ${timeZone}`);
  return { start, end };
}

export function todayInZone(timeZone: string) {
  const p = localPartsAt(new Date(), timeZone);
  return localDateString(p);
}

export function minuteLabel(minute: number) {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
