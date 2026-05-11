import { z } from "zod";

export const EnvSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_PROJECT_ID: z.string().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function readEnv(source: Record<string, string | undefined>): AppEnv {
  return EnvSchema.parse(source);
}
