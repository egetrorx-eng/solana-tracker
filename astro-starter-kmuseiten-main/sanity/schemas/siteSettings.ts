import { defineType, defineField } from 'sanity';

/**
 * Site Settings Schema
 * ═══════════════════════════════════════════════════════════════
 * Global settings for the website.
 * This is a singleton - only one document should exist.
 */

export default defineType({
  name: 'siteSettings',
  title: 'Website-Einstellungen',
  type: 'document',
  
  // Prevent creating multiple instances
  __experimental_actions: ['update', 'publish'],
  
  groups: [
    { name: 'general', title: 'Allgemein', default: true },
    { name: 'contact', title: 'Kontakt' },
    { name: 'seo', title: 'SEO' },
    { name: 'social', title: 'Social Media' },
  ],

  fields: [
    // General
    defineField({
      name: 'title',
      title: 'Website-Titel',
      type: 'string',
      group: 'general',
      validation: (Rule) => Rule.required(),
    }),
    
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
      group: 'general',
      description: 'Kurze Beschreibung der Website (für SEO)',
    }),

    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'general',
      options: {
        hotspot: true,
      },
    }),

    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Titel',
      type: 'string',
      group: 'general',
    }),

    defineField({
      name: 'heroSubtitle',
      title: 'Hero Untertitel',
      type: 'text',
      rows: 2,
      group: 'general',
    }),

    // Contact
    defineField({
      name: 'email',
      title: 'E-Mail',
      type: 'email',
      group: 'contact',
    }),

    defineField({
      name: 'phone',
      title: 'Telefon',
      type: 'string',
      group: 'contact',
    }),

    defineField({
      name: 'address',
      title: 'Adresse',
      type: 'text',
      rows: 3,
      group: 'contact',
    }),

    // SEO
    defineField({
      name: 'ogImage',
      title: 'Open Graph Bild',
      type: 'image',
      group: 'seo',
      description: 'Bild für Social Media Shares (1200x630px empfohlen)',
    }),

    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'seo',
      options: {
        layout: 'tags',
      },
    }),

    // Social Media
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'array',
      group: 'social',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'platform', title: 'Plattform', type: 'string' },
            { name: 'url', title: 'URL', type: 'url' },
          ],
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: 'title',
      media: 'logo',
    },
  },
});


