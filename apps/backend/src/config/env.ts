import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default('lift_saas_refresh_token'),

  AWS_REGION: z.string().default('ap-south-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),

  AWS_SES_FROM_EMAIL: z.string().optional(),
  AWS_SES_REGION: z.string().default('ap-south-1'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('debug'),

  // Phase 1 static tenant defaults — consumed ONLY by the TenantContext middleware.
  // Business logic must never read these directly; see common/middlewares/tenant.middleware.ts
  DEFAULT_TENANT_ID: z.coerce.number().default(1),
  DEFAULT_ORGANIZATION_ID: z.coerce.number().default(1)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
