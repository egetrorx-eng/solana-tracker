/**
 * Supabase Client Configuration
 * ═══════════════════════════════════════════════════════════════
 * Pre-configured Supabase clients for server and browser use.
 * Only used when supabase module is enabled in stack.config.js
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not set. Database queries will fail.');
}

/**
 * Public Supabase client (uses anon key)
 * Safe to use in browser - respects RLS policies
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

/**
 * Server-side Supabase client (uses service role key)
 * ONLY use in server-side code (Astro pages, API routes, Netlify functions)
 * Bypasses RLS - use with caution!
 */
export function getServiceClient(): SupabaseClient {
  if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set. Using anon client.');
    return supabase;
  }

  return createClient(supabaseUrl || '', supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Database type definitions
 * Generate with: npx supabase gen types typescript --project-id YOUR_PROJECT_ID
 */
export type Database = {
  public: {
    Tables: {
      // Add your table types here after generating them
      // Example:
      // users: {
      //   Row: { id: string; email: string; created_at: string; }
      //   Insert: { id?: string; email: string; created_at?: string; }
      //   Update: { id?: string; email?: string; created_at?: string; }
      // }
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

/**
 * Auth helpers
 */
export const auth = {
  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Send magic link
   */
  async sendMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${import.meta.env.SITE_URL}/auth/callback`,
      },
    });
    if (error) throw error;
  },
};

/**
 * Query helper with error handling
 */
export async function query<T>(
  tableName: string,
  options: {
    select?: string;
    filter?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<T | null> {
  try {
    let queryBuilder = supabase.from(tableName).select(options.select || '*');

    // Apply filters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    // Apply ordering
    if (options.order) {
      queryBuilder = queryBuilder.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    // Apply limit
    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    // Execute query
    const result = options.single
      ? await queryBuilder.single()
      : await queryBuilder;

    if (result.error) throw result.error;
    return result.data as T;
  } catch (error) {
    console.error(`Supabase query error (${tableName}):`, error);
    return null;
  }
}


