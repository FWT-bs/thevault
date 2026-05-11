import { z } from "zod";

import { ApiSuccessSchema } from "./common";

export const CatalogCategorySchema = z.enum(["in-app", "external", "surveys"]);

export const CatalogItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: CatalogCategorySchema,
  badge: z.string().optional(),
  rewardLabel: z.string(),
  route: z.string(),
  active: z.boolean().default(true),
});

export const CatalogListResponseSchema = ApiSuccessSchema(
  z.object({
    items: z.array(CatalogItemSchema),
  }),
);

export type CatalogItem = z.infer<typeof CatalogItemSchema>;
