# 🤖 AI Agent Onboarding Guide

> **READ THIS FIRST** when starting work on a project forked from this starter.

---

## What Is This Repository?

This is a **modular Astro starter** with three tiers:

| Tier | Stack |
|------|-------|
| **Basic** | Astro + Tailwind + Resend |
| **CMS** | Basic + Sanity CMS + Visual Editing |
| **FullStack** | CMS + Supabase (Auth, Database) |

---

## Your First Steps (In Order)

### 1. Read the Stack Configuration

```bash
# Check current tier and enabled modules
cat stack.config.js
```

This tells you:
- What tier (`basic`, `cms`, `fullstack`)
- Which modules are enabled (`sanity`, `supabase`, `resend`)
- Project metadata (name, client, domain)

### 2. Check Environment Variables

```bash
# See what's configured
cat .env  # or env.example.txt if .env doesn't exist
```

If `.env` doesn't exist, you need to tell the user to create one.

### 3. Understand Module Availability

**CRITICAL RULE**: Only import from modules that are enabled!

```javascript
// In stack.config.js:
modules: {
  sanity: true,    // Can use @/lib/sanity and sanity:client
  supabase: false, // DO NOT import from @/lib/supabase
  resend: true,    // Can use @/lib/resend
}
```

### 4. Review Existing Content

If Sanity is enabled:
```typescript
import { sanityClient } from 'sanity:client';
const settings = await sanityClient.fetch(`*[_type == "siteSettings"][0]`);
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `stack.config.js` | Module configuration - **check first** |
| `astro.config.mjs` | Astro + integrations setup |
| `sanity.config.ts` | Embedded Sanity Studio config |
| `src/lib/sanity.ts` | Sanity client + queries |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/resend.ts` | Email templates |
| `netlify/functions/` | Serverless functions |

---

## Sanity Integration (CMS Tier)

This starter uses the **official @sanity/astro** integration:

### Embedded Studio
- Access at `/studio` route
- No separate `sanity dev` needed

### Visual Editing
- Enabled via `PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true`
- Click-to-edit overlays appear on content

### Importing the Client
```typescript
// ✅ CORRECT - use the official integration
import { sanityClient } from 'sanity:client';

// ❌ WRONG - don't create a new client manually
import { createClient } from '@sanity/client';
```

### Schemas
Located in `sanity/schemas/`:
- `siteSettings.ts` - Global settings singleton
- `page.ts` - Generic pages

---

## GitHub Commands

The user can say natural language commands:

| User Says | You Run |
|-----------|---------|
| "save to github" | `pnpm github:save` |
| "push changes" | `pnpm github:save` |
| "setup github" | `pnpm github:setup` |
| "commit with message X" | `pnpm github:save --message "X"` |

---

## Swiss B2B Standards

This is designed for Swiss B2B websites:

- **Language**: Formal German ("Sie" not "du")
- **Locale**: `de-CH`
- **Tone**: Professional, trustworthy, precise
- **Avoid**: Marketing fluff, slang, emojis in content

---

## Module Commands

| User Says | You Run |
|-----------|---------|
| "enable sanity" | `pnpm module:toggle sanity enable` |
| "disable supabase" | `pnpm module:toggle supabase disable` |
| "this is a basic project" | Update tier to `basic` in stack.config.js |
| "this is a cms project" | Update tier to `cms` in stack.config.js |
| "this is a fullstack project" | Update tier to `fullstack` in stack.config.js |

---

## Context7 MCP

You have access to **Context7** for latest documentation:

```
// To get latest Astro docs:
Use resolve-library-id with "astro" → /withastro/docs
Then get-library-docs with topic

// To get latest Sanity docs:
Use resolve-library-id with "sanity" → /websites/sanity_io

// To get latest Supabase docs:
Use resolve-library-id with "supabase" → /supabase/supabase-js
```

**Use Context7** when:
- Implementing new features
- Unsure about current API patterns
- User asks for "latest" or "best practice"

---

## Common Tasks

### Adding a New Page
1. Create `src/pages/your-page.astro`
2. Use `BaseLayout` wrapper
3. Add to navigation in `Header.astro`

### Adding a Sanity Schema
1. Create schema in `sanity/schemas/`
2. Export from `sanity/schemas/index.ts`
3. Run `pnpm sanity:typegen` for types

### Adding a Netlify Function
1. Create `netlify/functions/your-function.ts`
2. API available at `/api/your-function`

### Sending Email
```typescript
import { sendLeadNotification } from '@/lib/resend';
await sendLeadNotification({ name, email, message });
```

---

## Deployment Checklist

Before deploying, verify:

- [ ] `.env` has all required variables
- [ ] `stack.config.js` has correct tier
- [ ] Sanity Studio deployed (if CMS tier)
- [ ] Supabase migrations applied (if FullStack tier)
- [ ] Build succeeds: `pnpm build`

---

## When User Gives Project Brief

When the user describes a new project:

1. **Update `stack.config.js`** with:
   - Project name
   - Client name
   - Domain (if known)
   - Correct tier

2. **Check module needs** - Enable/disable as needed

3. **Create Sanity schemas** (if CMS) for the content types they describe

4. **Set up pages** based on their sitemap

5. **Configure email templates** in `src/lib/resend.ts`

---

## Error Handling

### "Module not found: sanity:client"
- Sanity is disabled in stack.config.js
- Or missing `@sanity/astro` integration

### "Cannot read properties of undefined"
- Check if Sanity data exists
- Always use optional chaining: `settings?.title`

### Build fails on Netlify
- Check all env vars are set in Netlify dashboard
- Verify `netlify.toml` is correct

---

## Remember

1. **Stack config is truth** - Always check `stack.config.js` first
2. **Don't guess modules** - Only use what's enabled
3. **Use official integrations** - `sanity:client`, not manual setup
4. **Context7 for docs** - Get latest patterns when unsure
5. **Swiss formal** - "Sie" address, professional tone

