import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

interface CustomProcessEnv extends z.infer<typeof envSchema> {}

declare global {
  interface ProcessEnv extends CustomProcessEnv {}
}

try {
  envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    throw new Error(
      `Missing or invalid environment variables: ${err.errors.map((e) => e.path.join('.')).join(', ')}`
    );
  }
  throw err;
}

export const env = process.env;
