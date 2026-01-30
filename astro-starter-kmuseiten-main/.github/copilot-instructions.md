# Agency Astro Starter - AI Assistant Instructions

## Project Overview

This is a modular Astro starter for Swiss B2B web development with:
- **Astro** - Static site generation with React islands
- **Sanity** - Headless CMS (CMS and FullStack tiers)
- **Supabase** - PostgreSQL backend (FullStack tier only)
- **Resend** - Transactional email (all tiers)
- **Netlify** - Hosting and serverless functions

## Stack Configuration

Always check `stack.config.js` to understand which modules are enabled:

```javascript
{
  tier: 'basic' | 'cms' | 'fullstack',
  modules: {
    sanity: boolean,
    supabase: boolean,
    resend: true, // Always enabled
  }
}
```

## Key Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm github:setup` - One-time GitHub configuration
- `pnpm github:save` - Commit and push all changes
- `pnpm init:project` - Interactive project setup
- `pnpm module:toggle <module> <enable|disable>` - Toggle modules

## Directory Structure

```
src/
├── components/
│   ├── astro/     # Static components (prefer these)
│   └── react/     # Interactive islands only
├── layouts/       # Page layouts
├── lib/           # Client libraries
│   ├── sanity.ts  # CMS client (if enabled)
│   ├── supabase.ts # DB client (if enabled)
│   └── resend.ts  # Email utilities
├── pages/         # Astro routes
└── styles/        # Global CSS

sanity/            # CMS Studio (if enabled)
supabase/          # Database migrations (if enabled)
netlify/functions/ # Serverless functions
```

## Coding Standards

### Swiss B2B Requirements
- Use formal German ("Sie") in user-facing content
- Locale: `de-CH`
- Professional, trustworthy tone
- No marketing fluff

### Component Selection
- **Astro components**: For static content (default choice)
- **React islands**: Only for interactive elements (forms, maps, galleries)

### Data Fetching
- Server-side in Astro frontmatter
- Use provided client libraries from `src/lib/`

## Environment Variables

Required variables depend on tier:

### All Tiers
- `RESEND_API_KEY` - Email service
- `GITHUB_TOKEN` - Version control

### CMS Tier+
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN`

### FullStack Tier
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## GitHub Workflow

The user prefers simple GitHub commands:
- "save to github" → `pnpm github:save`
- "setup github" → `pnpm github:setup`

Always use the npm scripts, not raw git commands.


