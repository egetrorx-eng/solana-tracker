# Backend Developer Briefing

## Project: [Project Name]
**Frontend Developer:** [Name]  
**Backend Developer:** [Name]  
**Date:** [Date]

---

## 1. Project Context

### What We're Building
[2-3 sentences describing the project]

### The Shell is Ready
The frontend prototype is complete with:
- All pages rendered with mock data
- UI/UX finalized and approved by client
- React islands for interactive elements
- Forms connected to placeholder handlers

**Your task:** Wire the engine — connect real data, implement business logic, ensure security.

---

## 2. Repository Access

### Branch Structure
```
main              ← Production
└── develop       ← Integration
    └── frontend-prototype  ← UI complete, mock data
    └── feature/backend     ← Your work goes here
```

### Getting Started
```bash
git clone [repo-url]
git checkout frontend-prototype
git checkout -b feature/backend
pnpm install
```

---

## 3. Credentials & Access

### Project Email
All services are registered under: `[project-email]@[domain]`

### Service Credentials
| Service | Access Method | Notes |
|---------|--------------|-------|
| Supabase | [Share method] | Project: [name] |
| Sanity | [Share method] | Project ID: [id] |
| Resend | [Share method] | |
| GitHub | Repo invite sent | |

⚠️ **Security Protocol:**
- Never commit credentials to git
- Use `.env` for local development
- Netlify env vars for production
- Rotate keys after audit

---

## 4. Technical Requirements

### Stack Configuration
```javascript
// stack.config.js
{
  tier: 'fullstack',
  modules: {
    sanity: true,
    supabase: true,
    resend: true,
  }
}
```

### Environment Variables Needed
```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Sanity
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_TOKEN=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# App
SITE_URL=https://[domain]
ADMIN_EMAIL=
```

---

## 5. Implementation Scope

### Database (Supabase)
See [SCHEMA.md](./SCHEMA.md) for full schema.

**Key tables to implement:**
- [ ] `profiles` - User profiles with RLS
- [ ] `[table_2]` - [Description]
- [ ] `[table_3]` - [Description]

**Security requirements:**
- [ ] RLS policies on all tables
- [ ] Tenant isolation (if multi-tenant)
- [ ] Input validation
- [ ] Rate limiting

### API Endpoints (Netlify Functions)

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `submit-lead` | POST | Contact form | ✅ Done |
| `[endpoint-2]` | [Method] | [Description] | ⏳ |
| `[endpoint-3]` | [Method] | [Description] | ⏳ |

### CMS Integration (Sanity)
Schema types are pre-configured in `sanity/schemas/`.

**Tasks:**
- [ ] Verify schema matches frontend queries
- [ ] Set up preview mode (if needed)
- [ ] Configure webhooks for revalidation

---

## 6. Frontend Integration Points

### Where Data is Fetched
| File | Data Source | Current State |
|------|-------------|---------------|
| `src/pages/index.astro` | Sanity: siteSettings | Mock data |
| `src/components/react/ContactForm.tsx` | API: submit-lead | Placeholder |
| `[file]` | [source] | [state] |

### React Islands Requiring Backend
| Component | Functionality | Backend Needs |
|-----------|---------------|---------------|
| `ContactForm.tsx` | Form submission | API endpoint |
| `[Component]` | [Function] | [Needs] |

---

## 7. Acceptance Criteria

### Functional
- [ ] All API endpoints return correct data
- [ ] Authentication flow works end-to-end
- [ ] Form submissions are stored and notified
- [ ] CMS content displays correctly
- [ ] Error states handled gracefully

### Security
- [ ] RLS policies prevent cross-user data access
- [ ] API endpoints validate input
- [ ] No sensitive data in client bundles
- [ ] CORS configured correctly

### Performance
- [ ] API responses < 500ms (p95)
- [ ] Database queries optimized (no N+1)
- [ ] Edge functions used where beneficial

---

## 8. Delivery Protocol

### Code Submission
1. Push to `feature/backend` branch
2. Create PR to `develop`
3. Request review

### Security Audit
Before merge:
- [ ] AI security scan (Claude/GPT review)
- [ ] Manual credential check
- [ ] RLS policy verification
- [ ] Input validation review

### Post-Audit
- [ ] Credentials rotated
- [ ] Payment released

---

## 9. Communication

### Questions?
Contact: [Frontend dev contact method]

### Daily Updates
[Preferred method: WhatsApp/Slack/etc.]

### Blockers
Immediately communicate if:
- Schema changes needed
- Missing information
- Security concerns
- Timeline issues

---

## 10. Resources

### Documentation
- [PRD.md](./PRD.md) - Full requirements
- [SCHEMA.md](./SCHEMA.md) - Database design
- Supabase Docs: https://supabase.com/docs
- Sanity Docs: https://www.sanity.io/docs

### Design References
- [Figma/Design link]
- [Staging URL if available]

---

## Checklist Before Starting

- [ ] Repository access confirmed
- [ ] All credentials received
- [ ] Local environment running
- [ ] Schema reviewed
- [ ] Questions clarified

**Ready to build! 🚀**


