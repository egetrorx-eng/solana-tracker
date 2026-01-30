import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './schemas';
import { deskStructure } from './deskStructure';

/**
 * Standalone Sanity Studio Configuration
 * ═══════════════════════════════════════════════════════════════
 * This config is for running Sanity Studio standalone via:
 *   cd sanity && sanity dev
 * 
 * For embedded studio at /studio, see ../sanity.config.ts
 */

// Get config from environment
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'your-project-id';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineConfig({
  name: 'default',
  title: 'Content Studio',

  projectId,
  dataset,

  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool({ defaultApiVersion: '2025-01-01' }),
  ],

  schema: {
    types: schemaTypes,
  },
});
