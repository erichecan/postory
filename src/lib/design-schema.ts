import { z } from "zod";

const MAX_IMAGE_DATA_URL = 2.8 * 1024 * 1024;

const contentSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URL, "图片不能超过 2MB")
  .refine((v) => !/^\s*javascript:/i.test(v), "不允许的内容");

const elementSchema = z.object({
  id: z.string().max(64),
  type: z.enum(["text", "shape", "image"]),
  name: z.string().max(128).nullish(),
  x: z.number().finite(),
  y: z.number().finite(),
  w: z.number().finite().min(0),
  h: z.number().finite().min(0),
  z: z.number().finite(),
  rotation: z.number().finite(),
  style: z.record(z.string(), z.union([z.string().max(512), z.number()])),
  content: contentSchema.optional(),
  shapeType: z.enum(["rectangle", "circle", "line"]).optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const designPagesSchema = z
  .array(
    z.object({
      name: z.string().max(64),
      width: z.number().int().min(1).max(5000),
      height: z.number().int().min(1).max(5000),
      background: z.string().max(256),
      elements: z.array(elementSchema).max(300),
    }),
  )
  .min(1)
  .max(20);
