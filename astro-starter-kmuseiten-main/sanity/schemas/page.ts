import { defineType, defineField } from 'sanity';

/**
 * Page Schema
 * ═══════════════════════════════════════════════════════════════
 * Generic page type for static content pages.
 */

export default defineType({
  name: 'page',
  title: 'Seite',
  type: 'document',

  groups: [
    { name: 'content', title: 'Inhalt', default: true },
    { name: 'seo', title: 'SEO' },
  ],

  fields: [
    // Content
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'URL-Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'heroImage',
      title: 'Hero Bild',
      type: 'image',
      group: 'content',
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: 'content',
      title: 'Inhalt',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule) =>
                      Rule.uri({
                        scheme: ['http', 'https', 'mailto', 'tel'],
                      }),
                  },
                  {
                    name: 'blank',
                    type: 'boolean',
                    title: 'In neuem Tab öffnen',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Bildunterschrift',
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alt-Text',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    }),

    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Titel',
      type: 'string',
      group: 'seo',
      description: 'Überschreibt den Seitentitel für Suchmaschinen',
    }),

    defineField({
      name: 'seoDescription',
      title: 'SEO Beschreibung',
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (Rule) => Rule.max(160),
    }),

    defineField({
      name: 'noIndex',
      title: 'Von Suchmaschinen ausschliessen',
      type: 'boolean',
      group: 'seo',
      initialValue: false,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      media: 'heroImage',
    },
    prepare({ title, slug, media }) {
      return {
        title,
        subtitle: slug ? `/${slug}` : 'Kein Slug',
        media,
      };
    },
  },
});


