/**
 * Sanity Configuration (Root Level)
 * ═══════════════════════════════════════════════════════════════
 * This config is used by the embedded Sanity Studio at /studio.
 * For standalone Studio, see sanity/sanity.config.ts
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './sanity/schemas';
import { deskStructure } from './sanity/deskStructure';

// Get environment variables
const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

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

