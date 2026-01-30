# 🚀 Quick Start Guide

Get your project running in 5 minutes with the latest @sanity/astro integration and Visual Editing.

---

## Step 1: Install Dependencies

```bash
pnpm install
```

---

## Step 2: Initialize Your Project

Run the interactive setup:

```bash
pnpm init:project
```

This will ask for:
- **Project name** (kebab-case, e.g., `client-website`)
- **Client name** (e.g., `Acme GmbH`)
- **Domain** (optional, e.g., `acme.ch`)
- **Tier** (Basic / CMS / FullStack)
- **GitHub token** (for version control)

The script automatically:
- ✅ Configures `stack.config.js`
- ✅ Removes unused module folders
- ✅ Creates GitHub repository
- ✅ Makes initial commit

---

## Step 3: Configure Environment

Copy the example env file:

```bash
cp env.example.txt .env
```

Then fill in the required values based on your tier:

### All Tiers
```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### CMS Tier (add these)
```env
PUBLIC_SANITY_PROJECT_ID=your-project-id
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true
SANITY_API_TOKEN=sk_xxxxx
```

### FullStack Tier (add these)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

---

## Step 4: Start Development

```bash
pnpm dev
```

Your site is now running at:
- **Frontend**: `http://localhost:4321`
- **Sanity Studio**: `http://localhost:4321/studio` (CMS tier)

---

## Step 5: Save Your Work

Whenever you want to save to GitHub, just tell your AI assistant:

> "Save to GitHub"

Or run manually:

```bash
pnpm github:save
```

---

## 🆕 Visual Editing (CMS Tier)

The official `@sanity/astro` integration enables:

1. **Embedded Studio** - Access Sanity Studio at `/studio`
2. **Visual Editing** - Click-to-edit overlays on your live site
3. **TypeScript Types** - Full type safety with `sanity:client`

### Enable Visual Editing

Set in your `.env`:
```env
PUBLIC_SANITY_VISUAL_EDITING_ENABLED=true
```

Then visit your site - you'll see edit buttons on content managed by Sanity.

### Using the Sanity Client

```typescript
// Import the pre-configured client
import { sanityClient } from 'sanity:client';

// Fetch data with full typing
const posts = await sanityClient.fetch(`*[_type == "post"]`);
```

---

## Tier Comparison

| Feature | Basic | CMS | FullStack |
|---------|-------|-----|-----------|
| Static Pages | ✅ | ✅ | ✅ |
| Contact Form | ✅ | ✅ | ✅ |
| Email Notifications | ✅ | ✅ | ✅ |
| Content Management | ❌ | ✅ | ✅ |
| Embedded Sanity Studio | ❌ | ✅ | ✅ |
| Visual Editing | ❌ | ✅ | ✅ |
| User Authentication | ❌ | ❌ | ✅ |
| Database | ❌ | ❌ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |

---

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm github:save` | Commit and push to GitHub |
| `pnpm github:setup` | Configure GitHub (one-time) |
| `pnpm init:project` | Interactive project setup |
| `pnpm module:toggle sanity enable` | Enable Sanity CMS |
| `pnpm module:toggle supabase disable` | Disable Supabase |
| `pnpm sanity:dev` | Run Sanity Studio standalone |
| `pnpm sanity:typegen` | Generate TypeScript types for Sanity |

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── astro/       # Static components (PortableText.astro)
│   │   └── react/       # Interactive islands
│   ├── layouts/         # Page layouts (with Visual Editing)
│   ├── lib/             # Client libraries (sanity.ts, supabase.ts)
│   ├── pages/           # Routes
│   └── styles/          # CSS
├── sanity/              # Sanity schemas (if enabled)
├── sanity.config.ts     # Embedded Studio config (root)
├── supabase/            # Database (if enabled)
├── netlify/functions/   # Serverless functions
├── docs/                # Project documentation
├── scripts/             # Utility scripts
└── stack.config.js      # Module configuration
```

---

## Need Help?

- **Stack Rules**: Check `.cursor/rules/` for AI instructions
- **Context7 MCP**: Ask "Use Context7 to get latest Astro docs"
- **Documentation**: See `docs/` folder
- **Issues**: Create GitHub issue or contact team

---

## Next Steps

1. **Design**: Customize `src/styles/global.css` with brand colors
2. **Content**: Update page content in `src/pages/`
3. **CMS**: Configure Sanity schemas in `sanity/schemas/`
4. **Studio**: Visit `/studio` to add content
5. **Deploy**: Push to GitHub, Netlify auto-deploys

Happy building! 🛠️
