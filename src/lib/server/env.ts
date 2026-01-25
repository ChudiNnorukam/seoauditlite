/**
 * Environment variable validation.
 * Import this module early to fail fast if required env vars are missing.
 */

import { env } from '$env/dynamic/private';

interface EnvConfig {
  // Required - app will not function without these
  required: string[];
  // Required for specific features
  requiredForAuth: string[];
  requiredForBilling: string[];
  // Optional with defaults
  optional: string[];
}

const ENV_CONFIG: EnvConfig = {
  required: [
    'TURSO_DATABASE_URL',
  ],
  requiredForAuth: [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'ORIGIN',
  ],
  requiredForBilling: [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
  ],
  optional: [
    'TURSO_AUTH_TOKEN', // Optional for local SQLite
    'REPLICATE_API_TOKEN', // Optional for OG image generation
  ],
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  features: {
    auth: boolean;
    billing: boolean;
    ogImages: boolean;
  };
}

function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const key of ENV_CONFIG.required) {
    if (!env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Check auth vars
  const authMissing = ENV_CONFIG.requiredForAuth.filter(k => !env[k]);
  const authEnabled = authMissing.length === 0;
  if (authMissing.length > 0 && authMissing.length < ENV_CONFIG.requiredForAuth.length) {
    // Partial config is an error - all or nothing
    errors.push(`Incomplete auth configuration. Missing: ${authMissing.join(', ')}`);
  } else if (!authEnabled) {
    warnings.push('Google OAuth not configured. Authentication will be disabled.');
  }

  // Check billing vars
  const billingMissing = ENV_CONFIG.requiredForBilling.filter(k => !env[k]);
  const billingEnabled = billingMissing.length === 0;
  if (billingMissing.length > 0 && billingMissing.length < ENV_CONFIG.requiredForBilling.length) {
    errors.push(`Incomplete billing configuration. Missing: ${billingMissing.join(', ')}`);
  } else if (!billingEnabled) {
    warnings.push('LemonSqueezy not configured. Billing will be disabled.');
  }

  // Check optional feature vars
  const ogImagesEnabled = !!env.REPLICATE_API_TOKEN;
  if (!ogImagesEnabled) {
    warnings.push('REPLICATE_API_TOKEN not set. OG image generation will be disabled.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    features: {
      auth: authEnabled,
      billing: billingEnabled,
      ogImages: ogImagesEnabled,
    },
  };
}

// Run validation at module load time
const validation = validateEnv();

// Log warnings in all environments
for (const warning of validation.warnings) {
  console.warn(`[env] ${warning}`);
}

// Throw on errors (fail fast)
if (!validation.valid) {
  const errorMessage = `Environment validation failed:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`;
  throw new Error(errorMessage);
}

// Export feature flags for use in application
export const ENV_FEATURES = validation.features;

// Export for testing
export { validateEnv, type ValidationResult };
