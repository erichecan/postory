import { z } from "zod";
import { safeNext } from "@/lib/safe-next";

export const studioSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(64, "nameTooLong"),
  timeZone: z.string().trim().min(1, "timeZoneInvalid").max(64, "timeZoneInvalid").refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "timeZoneInvalid"),
});

export type StudioInput = z.infer<typeof studioSchema>;
export const NAILS_PATHS = ["/nails", "/nails/create", "/nails/appointments", "/nails/me", "/nails/onboarding"];

export function nailsReturnPath(value: unknown) {
  const path = safeNext(value);
  return NAILS_PATHS.includes(path) ? path : "/nails";
}
