/**
 * Schema Types Index
 * ═══════════════════════════════════════════════════════════════
 * Export all schema types for Sanity Studio.
 * 
 * To add a new document type:
 * 1. Create the schema file in this folder
 * 2. Import and add it to the schemaTypes array below
 */

import siteSettings from './siteSettings';
import page from './page';

export const schemaTypes = [
  // Singletons
  siteSettings,

  // Documents
  page,

  // Add more schema types here as needed:
  // post,
  // author,
  // category,
];

// Re-export for external use
export { siteSettings, page };
