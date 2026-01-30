import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
import sanity from '@sanity/astro';
import { loadEnv } from 'vite';

// Stack config for conditional integrations
import stackConfig from './stack.config.js';

// Load environment variables
const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  PUBLIC_SANITY_VISUAL_EDITING_ENABLED,
} = loadEnv(import.meta.env.MODE, process.cwd(), '');

// Build integrations array based on stack config
const integrations = [
  tailwind(),
  react(),
  sitemap(),
];

// Add Sanity integration if enabled
if (stackConfig.modules.sanity) {
  integrations.push(
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
      dataset: PUBLIC_SANITY_DATASET || 'production',
      useCdn: false, // Set to true for production static builds
      apiVersion: '2025-01-01',
      // Enable embedded Sanity Studio at /studio route
      studioBasePath: '/studio',
      // Visual Editing configuration
      stega: {
        studioUrl: '/studio',
      },
    })
  );
}

// https://astro.build/config
export default defineConfig({
  site: stackConfig.project.domain ? `https://${stackConfig.project.domain}` : 'https://example.com',
  output: 'server',
  adapter: netlify(),
  integrations,
  vite: {
    define: {
      'import.meta.env.STACK_TIER': JSON.stringify(stackConfig.tier),
      'import.meta.env.SANITY_ENABLED': JSON.stringify(stackConfig.modules.sanity),
      'import.meta.env.SUPABASE_ENABLED': JSON.stringify(stackConfig.modules.supabase),
    },
  },
});
