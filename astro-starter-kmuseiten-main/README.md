# Agency Astro Starter

A modular, production-ready starter for Swiss B2B web development.

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?logo=astro)](https://astro.build)
[![Sanity](https://img.shields.io/badge/Sanity-3.x-F03E2F?logo=sanity)](https://sanity.io)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?logo=netlify)](https://netlify.com)

---

## ✨ Features

- **Modular Architecture** - Enable only what you need
- **Three Tiers** - Basic, CMS, or FullStack
- **Official @sanity/astro** - Visual Editing, embedded Studio at `/studio`
- **Context7 MCP** - Always latest documentation for your stack
- **GitHub Integration** - One-command saves
- **Swiss B2B Ready** - Formal German templates
- **AI-Optimized** - Cursor rules for consistent code

---

## 🏗️ Stack Tiers

### Basic
Static sites with contact forms.
- Astro + Tailwind
- Resend for email
- Netlify Functions

### CMS
Content-managed websites.
- Everything in Basic +
- Sanity CMS with Visual Editing
- Embedded Sanity Studio at `/studio`
- PortableText rendering

### FullStack
Complete web applications.
- Everything in CMS +
- Supabase (Auth, Database)
- Edge Functions

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/agency-astro-starter.git my-project
cd my-project

# Install dependencies
pnpm install

# Interactive setup
pnpm init:project

# Start development
pnpm dev
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

---

## 📁 Project Structure

```
├── .cursor/rules/       # AI assistant rules
├── docs/                # Project documentation
│   ├── PRD-TEMPLATE.md
│   ├── SCHEMA-TEMPLATE.md
│   └── BACKEND-BRIEFING.md
├── netlify/functions/   # Serverless functions
├── sanity/              # CMS (tier >= cms)
├── scripts/             # Utility scripts
├── src/
│   ├── components/
│   │   ├── astro/       # Static components
│   │   └── react/       # Interactive islands
│   ├── layouts/
│   ├── lib/             # Client libraries
│   ├── pages/
│   └── styles/
├── supabase/            # Database (tier = fullstack)
└── stack.config.js      # Module configuration
```

---

## ⚙️ Configuration

### stack.config.js

```javascript
export default {
  tier: 'cms', // 'basic' | 'cms' | 'fullstack'
  
  modules: {
    sanity: true,
    supabase: false,
    resend: true,
  },
  
  project: {
    name: 'my-project',
    client: 'Client Name',
    domain: 'example.com',
  },
};
```

---

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm github:save` | Commit & push |
| `pnpm github:setup` | Configure GitHub |
| `pnpm init:project` | Project setup |
| `pnpm module:toggle <module> <enable\|disable>` | Toggle modules |

---

## 🤖 AI Integration

This starter includes Cursor rules and onboarding for AI-assisted development:

- **Agent Onboarding** - `.cursor/AGENT-ONBOARDING.md` guides AI on first run
- **Stack Rules** - Ensures code matches your tier
- **GitHub Commands** - Natural language version control
- **Project Brief** - `docs/PROJECT-BRIEF-TEMPLATE.md` for new projects

### Starting a New Project with AI

1. Fork this repo
2. Fill in `docs/PROJECT-BRIEF-TEMPLATE.md`
3. Paste the brief to your AI agent
4. Agent reads onboarding docs and sets up the project

Example prompts:
- "Save to GitHub"
- "Enable Supabase"
- "This is a CMS project"
- "Use Context7 to get latest Astro docs"

---

## 📧 Email Templates

Pre-built Swiss B2B email templates:
- Lead notification (admin)
- Contact confirmation (user)
- Welcome email
- Password reset

All use formal German ("Sie") by default.

---

## 🔐 Security

- Row Level Security (RLS) templates for Supabase
- Input validation in Netlify Functions
- Environment variable management
- Security audit checklist in docs

---

## 📄 Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Get started in 5 minutes
- [.cursor/AGENT-ONBOARDING.md](./.cursor/AGENT-ONBOARDING.md) - AI agent instructions
- [docs/PROJECT-BRIEF-TEMPLATE.md](./docs/PROJECT-BRIEF-TEMPLATE.md) - New project brief
- [docs/PRD-TEMPLATE.md](./docs/PRD-TEMPLATE.md) - Requirements template
- [docs/SCHEMA-TEMPLATE.md](./docs/SCHEMA-TEMPLATE.md) - Database design
- [docs/BACKEND-BRIEFING.md](./docs/BACKEND-BRIEFING.md) - Developer handoff

---

## 🚢 Deployment

### Netlify (Recommended)
1. Connect GitHub repo to Netlify
2. Build command: `pnpm build`
3. Publish directory: `dist`
4. Add environment variables

### Manual
```bash
pnpm build
# Upload dist/ to your host
```

---

## 📝 License

MIT - Use freely for client projects.

---

## 🙏 Credits

Built for Swiss B2B web development agencies.

Stack: [Astro](https://astro.build) • [Sanity](https://sanity.io) • [Supabase](https://supabase.com) • [Resend](https://resend.com) • [Netlify](https://netlify.com)


