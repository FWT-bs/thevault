import { z } from "zod";

export const EnvSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function readEnv(source: Record<string, string | undefined>): AppEnv {
  return EnvSchema.parse(source);
}
