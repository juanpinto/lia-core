import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { fail } from "./result.js";

export function toMcpErrorResult(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.code, error.message, error.details);
  }

  if (error instanceof ZodError) {
    return fail("VALIDATION_ERROR", "Invalid tool input.", error.flatten());
  }

  if (error instanceof Error) {
    return fail("INTERNAL_ERROR", error.message);
  }

  return fail("INTERNAL_ERROR", "Unknown error.");
}
