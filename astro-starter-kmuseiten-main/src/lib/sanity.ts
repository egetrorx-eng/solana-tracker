/**
 * Sanity Client & Utilities
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Sanity integration using official @sanity/astro package.
 * Provides client access, image URL builder, and query helpers.
 * 
 * Visual Editing is automatically enabled via @sanity/astro integration.
 */

import { sanityClient } from 'sanity:client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Re-export the configured client from @sanity/astro
export { sanityClient };

// Image URL builder using the pre-configured client
const builder = imageUrlBuilder(sanityClient);

/**
 * Generate optimized image URLs from Sanity assets
 * @example
 * urlFor(image).width(800).height(600).url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Common image size presets
 */
export const imageSizes = {
  thumbnail: (source: SanityImageSource) =>
    urlFor(source).width(150).height(150).fit('crop').url(),

  card: (source: SanityImageSource) =>
    urlFor(source).width(400).height(300).fit('crop').url(),

  hero: (source: SanityImageSource) =>
    urlFor(source).width(1920).height(1080).fit('crop').url(),

  og: (source: SanityImageSource) =>
    urlFor(source).width(1200).height(630).fit('crop').url(),
};

/**
 * GROQ query helper with error handling
 * Uses the pre-configured client from @sanity/astro
 */
export async function fetchSanity<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  try {
    return await sanityClient.fetch<T>(query, params);
  } catch (error) {
    console.error('Sanity fetch error:', error);
    return null;
  }
}

/**
 * Common GROQ queries
 */
export const queries = {
  // Site settings singleton
  siteSettings: `*[_type == "siteSettings"][0]{
    title,
    description,
    logo,
    heroTitle,
    heroSubtitle,
    email,
    phone,
    address,
    ogImage,
    socialLinks
  }`,

  // All pages
  allPages: `*[_type == "page"] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    seoTitle,
    seoDescription
  }`,

  // Single page by slug
  pageBySlug: `*[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    heroImage,
    content,
    seoTitle,
    seoDescription,
    noIndex
  }`,

  // All posts with author
  allPosts: `*[_type == "post"] | order(publishedAt desc){
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    mainImage,
    author->{
      name,
      image
    }
  }`,

  // Single post by slug
  postBySlug: `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    mainImage,
    body,
    author->{
      name,
      image,
      bio
    }
  }`,
};

/**
 * Type definitions for common Sanity document types
 * These provide basic typing - use sanity typegen for full types
 */
export interface SiteSettings {
  title: string;
  description?: string;
  logo?: SanityImageSource;
  heroTitle?: string;
  heroSubtitle?: string;
  email?: string;
  phone?: string;
  address?: string;
  ogImage?: SanityImageSource;
  socialLinks?: Array<{ platform: string; url: string }>;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  heroImage?: SanityImageSource;
  content?: unknown[]; // Portable Text
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
}
