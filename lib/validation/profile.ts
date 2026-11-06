import { z } from "zod";

export const DAILY_GOALS = [10, 15, 20, 30] as const;
export const ACCENTS = ["en-US", "en-GB"] as const;
export const PLAYBACK_RATES = [0.75, 1] as const;
export const INTERESTS = [
  "technology",
  "work",
  "travel",
  "daily_life",
  "culture",
] as const;
export const DEFAULT_TIMEZONE = "America/Mexico_City";

export function isValidTimezone(tz: string): boolean {
  return tz === "UTC" || Intl.supportedValuesOf("timeZone").includes(tz);
}

export const settingsSchema = z.object({
  displayName: z.string().trim().max(60),
  timezone: z
    .string()
    .trim()
    .refine(isValidTimezone, "Zona horaria no válida."),
  dailyGoal: z.coerce.number().pipe(z.literal(DAILY_GOALS)),
  accent: z.enum(ACCENTS),
  playbackRate: z.coerce.number().pipe(z.literal(PLAYBACK_RATES)),
  interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
