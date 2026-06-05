import { z } from 'zod';

// Schema de validation des variables d'environnement
export const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // FedaPay
  FEDAPAY_SECRET_KEY: z.string().optional(),
  FEDAPAY_WEBHOOK_SECRET: z.string().optional(),
  
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type inféré du schema
export type Env = z.infer<typeof envSchema>;

// Fonction de validation des variables d'environnement
export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// Export des variables validées
export const env = validateEnv();
