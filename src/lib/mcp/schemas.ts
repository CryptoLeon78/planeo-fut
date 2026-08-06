import { z } from "zod";

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format.");

export const uuid = z.string().uuid("Provide a valid record identifier.");

export const shortText = (max = 160) => z.string().trim().min(1).max(max);
export const longText = (max = 2000) => z.string().trim().min(1).max(max);

export const limitField = (max: number, fallback: number) =>
  z
    .number()
    .int()
    .min(1)
    .max(max)
    .optional()
    .describe(`Maximum records to return (1-${max}, defaults to ${fallback}).`);

export const intensityEnum = z.enum(["baja", "media", "alta", "muy_alta"]);
export const entityEnum = z.enum(["exercise", "session", "microcycle"]);
