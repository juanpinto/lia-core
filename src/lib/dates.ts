import { DateTime } from "luxon";
import { ValidationError } from "./errors.js";

/**
 * Converts a naive local datetime string (no timezone offset) to a UTC ISO string,
 * interpreting the input as being in the given IANA timezone.
 *
 * Example: localToUtcIso("2026-04-23T20:00:00", "America/Argentina/Buenos_Aires")
 *          → "2026-04-23T23:00:00.000Z"
 */
export function localToUtcIso(localDatetime: string, timezone: string): string {
  const dt = DateTime.fromISO(localDatetime, { zone: timezone });
  if (!dt.isValid) {
    throw new ValidationError(
      `Invalid local datetime "${localDatetime}": ${dt.invalidExplanation ?? "unknown error"}.`,
    );
  }
  return dt.toUTC().toISO()!;
}
