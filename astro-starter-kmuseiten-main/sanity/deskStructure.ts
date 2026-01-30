import type { StructureBuilder } from 'sanity/structure';

/**
 * Custom Desk Structure
 * ═══════════════════════════════════════════════════════════════
 * Organize content types in the Studio sidebar.
 */

export const deskStructure = (S: StructureBuilder) =>
  S.list()
    .title('Inhalt')
    .items([
      // Site Settings (singleton)
      S.listItem()
        .title('Website-Einstellungen')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Website-Einstellungen')
        ),

      S.divider(),

      // Pages
      S.listItem()
        .title('Seiten')
        .schemaType('page')
        .child(S.documentTypeList('page').title('Seiten')),

      // Blog posts (if you have them)
      // S.listItem()
      //   .title('Blog')
      //   .schemaType('post')
      //   .child(S.documentTypeList('post').title('Blog Beiträge')),

      S.divider(),

      // All other document types
      ...S.documentTypeListItems().filter(
        (listItem) =>
          !['siteSettings', 'page', 'post'].includes(listItem.getId() as string)
      ),
    ]);


