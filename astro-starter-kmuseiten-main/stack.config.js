/**
 * Stack Configuration
 * ═══════════════════════════════════════════════════════════════
 * Configure which modules are enabled for this project.
 * 
 * TIERS:
 * - 'basic'     → Astro + Resend only (static sites)
 * - 'cms'       → Astro + Sanity + Resend (content-managed sites)
 * - 'fullstack' → Astro + Sanity + Supabase + Resend (full apps)
 * 
 * Run `pnpm init:project` to configure interactively.
 */

export default {
  // Project tier - determines which modules are available
  tier: 'cms', // 'basic' | 'cms' | 'fullstack'

  // Module toggles (auto-set based on tier, but can be overridden)
  modules: {
    sanity: true,      // CMS - enabled for tier >= 'cms'
    supabase: false,   // Backend - enabled for tier = 'fullstack'
    resend: true,      // Email - always enabled
    netlify: true,     // Hosting - always enabled
  },

  // Project metadata
  project: {
    name: 'my-project',
    client: 'Client Name',
    domain: '', // e.g., 'example.com'
    description: 'A modern web application',
  },

  // GitHub configuration
  github: {
    username: '',
    repoName: '',
    isPrivate: true,
  },

  // Regional settings (Swiss B2B defaults)
  locale: {
    defaultLanguage: 'de-CH',
    supportedLanguages: ['de', 'en', 'fr'],
    formalAddress: true, // Use "Sie" in German
  },
};

