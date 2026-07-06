// Server-side validation for saved-dish snapshots. The client is unauthenticated
// (anonymous device cookie), so POST /api/dishes must not trust the body: this
// bounds every string and array so a hostile client can't store arbitrary blobs.
// zod objects strip unknown keys by default, which also drops transient client
// fields (e.g. `estimating`) instead of persisting them.
import { z } from "zod";
import { AXES, ROLES, TEMPERATURES, TEXTURES } from "./domain";

const shortStr = z.string().max(80);
const axis01 = z.number().min(0).max(1);

// Exactly the 7 taste axes, each 0..1.
export const axisMapSchema = z.object(
  Object.fromEntries(AXES.map((k) => [k, axis01])) as Record<(typeof AXES)[number], typeof axis01>,
);

const roleSchema = z.enum(ROLES as unknown as [string, ...string[]]);
const textureSchema = z.enum(TEXTURES as unknown as [string, ...string[]]);
const temperatureSchema = z.enum(TEMPERATURES as unknown as [string, ...string[]]);
const magnitudeSchema = z.enum(["trace", "supporting", "dominant"]);

const componentSchema = z.object({
  id: shortStr,
  name: z.string().max(80),
  notes: z.string().max(5000).optional(),
});

const committedRowSchema = z.object({
  uid: z.number().int().min(0).max(1_000_000),
  ingredientId: shortStr,
  magnitude: magnitudeSchema,
  role: roleSchema,
  componentId: shortStr,
  axes: axisMapSchema.optional(),
  aromas: z.array(z.string().max(40)).max(20).optional(),
  texture: textureSchema.optional(),
  temperature: temperatureSchema.optional(),
  amount: z.string().max(80).optional(),
});

const ingredientSchema = z.object({
  id: shortStr,
  name: z.string().max(80),
  roles: z.array(roleSchema).max(6),
  aromas: z.array(z.string().max(40)).max(20),
  novelty: axis01,
  axes: axisMapSchema,
  texture: textureSchema,
  temperature: temperatureSchema,
  custom: z.boolean().optional(),
  unprofiled: z.boolean().optional(),
});

const customFormSchema = z.object({
  id: shortStr,
  label: z.string().max(80),
  kicker: z.string().max(80),
  blurb: z.string().max(400),
  leanRoles: z.array(roleSchema).max(11),
  typicalComponents: z.array(z.string().max(80)).max(10),
});

export const dishSnapshotSchema = z.object({
  name: z.string().max(120),
  intentId: shortStr.nullable(),
  customIntent: axisMapSchema.nullable(),
  formId: shortStr.nullable(),
  customForm: customFormSchema.nullable(),
  components: z.array(componentSchema).max(40),
  committed: z.array(committedRowSchema).max(300),
  customIngredients: z.array(ingredientSchema).max(150),
  activeComp: shortStr.nullable(),
  risk: axis01,
  method: z.string().max(20_000),
  servings: z.number().int().min(1).max(99),
  cid: z.number().int().min(0).max(1_000_000),
  uid: z.number().int().min(0).max(1_000_000),
  custId: z.number().int().min(0).max(1_000_000),
});

// Hard cap on the serialized request body — well above any legitimate dish
// (a large one is ~30KB) and well below anything worth hoarding in a row.
export const MAX_DISH_BYTES = 300_000;
