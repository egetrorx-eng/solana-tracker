/// <reference types="astro/client" />
/// <reference types="@sanity/astro/module" />

/**
 * Environment Variable Types
 * ═══════════════════════════════════════════════════════════════
 * Type definitions for environment variables used in the project.
 */

interface ImportMetaEnv {
  // Stack configuration
  readonly STACK_TIER: 'basic' | 'cms' | 'fullstack';
  readonly SANITY_ENABLED: boolean;
  readonly SUPABASE_ENABLED: boolean;

  // Sanity
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly PUBLIC_SANITY_VISUAL_EDITING_ENABLED: string;
  readonly SANITY_API_TOKEN: string;

  // Supabase
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  // Resend
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;

  // Site
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

