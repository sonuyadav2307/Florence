import { z } from "zod";
import { isNormalizedHex } from "@/lib/color/hex";
import { proportionsAreValid } from "@/lib/color/proportions";
import type { FlowerVariant, ProjectPayload } from "@/lib/types";

export const swatchRoleSchema = z.enum([
  "primary",
  "support",
  "accent",
  "neutral",
  "foliage",
]);
export const flowerRoleSchema = z.enum([
  "focal",
  "support",
  "filler",
  "line",
  "foliage",
]);
export const harmonySchema = z.enum([
  "analogous",
  "complementary",
  "splitComplementary",
  "triadic",
  "monochromatic",
]);
export const eventTypeSchema = z.enum([
  "wedding",
  "corporate",
  "birthday",
  "social",
  "other",
]);
export const environmentSchema = z.enum([
  "indoor",
  "outdoor",
  "mixed",
  "unknown",
]);
export const styleSchema = z.enum([
  "romantic",
  "garden",
  "modern",
  "classic",
  "vibrant",
]);
export const statusSchema = z.enum(["draft", "ready", "archived"]);
export const availabilitySchema = z.enum([
  "unknown",
  "confirmed",
  "unavailable",
]);
export const practicalKindSchema = z.enum([
  "scent",
  "exposure",
  "conditioning",
  "supplier",
]);

const hexSchema = z
  .string()
  .refine(isNormalizedHex, "HEX must be an uppercase six-digit value.");

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD calendar date.")
  .nullable();

export const swatchSchema = z.strictObject({
  id: z.string().min(1).max(80),
  role: swatchRoleSchema,
  name: z.string().min(1).max(40),
  hex: hexSchema,
  locked: z.boolean(),
  proportion: z.number().int().min(0).max(100),
});

export const selectedFlowerSchema = z.strictObject({
  id: z.string().min(1).max(80),
  variantId: z.string().min(1).max(80),
  role: flowerRoleSchema,
  snapshot: z.strictObject({
    commonName: z.string().min(1).max(120),
    variantName: z.string().min(1).max(120),
    approximateHex: hexSchema,
    imagePath: z.string().max(300).nullable(),
    catalogVersion: z.number().int().nonnegative(),
  }),
  availability: availabilitySchema,
  availabilityNote: z.string().max(500),
  availabilityContext: z
    .strictObject({
      eventDate: dateSchema,
      location: z.string().max(150).nullable(),
      recordedAt: z.string().min(1),
    })
    .nullable(),
  practicalChecks: z
    .array(
      z.strictObject({
        kind: practicalKindSchema,
        status: z.enum(["needsReview", "reviewed"]),
        note: z.string().max(500),
      }),
    )
    .length(4),
});

export const elementSchema = z.strictObject({
  key: z.enum([
    "backdrop",
    "linen",
    "floralEmphasis",
    "stationery",
    "accents",
  ]),
  swatchId: z.string().min(1).max(80),
  materialNote: z.string().max(200),
});

export const projectPayloadSchema: z.ZodType<ProjectPayload> = z
  .strictObject({
    schemaVersion: z.literal(1),
    brief: z.strictObject({
      clientDisplayName: z.string().max(150),
      eventType: eventTypeSchema,
      eventDate: dateSchema,
      location: z.string().max(150),
      environment: environmentSchema,
      style: styleSchema.nullable(),
      internalNotes: z.string().max(4000),
    }),
    palette: z.strictObject({
      mode: harmonySchema,
      generationIndex: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      swatches: z.array(swatchSchema).length(5),
    }),
    selectedFlowers: z.array(selectedFlowerSchema).max(8),
    elements: z.array(elementSchema).length(5),
    presentationNotes: z.string().max(2000),
  })
  .superRefine((payload, ctx) => {
    const roles = payload.palette.swatches.map((swatch) => swatch.role);
    if (new Set(roles).size !== 5) {
      ctx.addIssue({
        code: "custom",
        message: "A palette needs one swatch for each role.",
        path: ["palette", "swatches"],
      });
    }
    const swatchIds = payload.palette.swatches.map((swatch) => swatch.id);
    if (new Set(swatchIds).size !== 5) {
      ctx.addIssue({
        code: "custom",
        message: "Swatch IDs must be unique.",
        path: ["palette", "swatches"],
      });
    }
    if (
      !proportionsAreValid(
        payload.palette.swatches.map((swatch) => swatch.proportion),
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Proportions must be integers that total 100.",
        path: ["palette", "swatches"],
      });
    }
    const elementKeys = payload.elements.map((element) => element.key);
    if (new Set(elementKeys).size !== 5) {
      ctx.addIssue({
        code: "custom",
        message: "Each event element must be assigned once.",
        path: ["elements"],
      });
    }
    for (const element of payload.elements) {
      if (!swatchIds.includes(element.swatchId)) {
        ctx.addIssue({
          code: "custom",
          message: "Element colors must reference a palette swatch.",
          path: ["elements"],
        });
      }
    }
    const variantIds = payload.selectedFlowers.map((flower) => flower.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "A variant can only be added once.",
        path: ["selectedFlowers"],
      });
    }
    const selectionIds = payload.selectedFlowers.map((flower) => flower.id);
    if (new Set(selectionIds).size !== selectionIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Selected flower IDs must be unique.",
        path: ["selectedFlowers"],
      });
    }
  });

export const createProjectSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  brief: z
    .strictObject({
      clientDisplayName: z.string().max(150).optional(),
      eventType: eventTypeSchema.optional(),
      eventDate: dateSchema.optional(),
      location: z.string().max(150).optional(),
      environment: environmentSchema.optional(),
      style: styleSchema.nullable().optional(),
      internalNotes: z.string().max(4000).optional(),
    })
    .optional(),
});

export const patchProjectSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
  name: z.string().trim().min(1).max(100).optional(),
  status: statusSchema.optional(),
  payload: projectPayloadSchema.optional(),
});

export const duplicateProjectSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
});

export function validateChosenRole(
  variant: FlowerVariant,
  role: ProjectPayload["selectedFlowers"][number]["role"],
): boolean {
  return variant.allowedRoles.includes(role);
}

export function canMarkReady(payload: ProjectPayload): boolean {
  return (
    payload.palette.swatches.length === 5 &&
    payload.selectedFlowers.length >= 1 &&
    payload.elements.length === 5
  );
}

export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "payload";
    if (!fieldErrors[path]) {
      fieldErrors[path] = issue.message;
    }
  }
  return fieldErrors;
}
