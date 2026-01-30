# Product Requirements Document (PRD)

## Project: [Project Name]
**Client:** [Client Name]  
**Version:** 1.0  
**Last Updated:** [Date]  
**Author:** [Your Name]

---

## 1. Executive Summary

[2-3 sentences describing the project purpose and primary value proposition]

---

## 2. Project Overview

### 2.1 Business Context
[Who is the client? What problem are we solving?]

### 2.2 Target Users
| User Type | Description | Primary Goals |
|-----------|-------------|---------------|
| [User 1] | [Description] | [Goals] |
| [User 2] | [Description] | [Goals] |

### 2.3 Success Metrics
- [ ] [Metric 1: e.g., "Launch by [date]"]
- [ ] [Metric 2: e.g., "Contact form submissions > 10/month"]
- [ ] [Metric 3: e.g., "Page load time < 2s"]

---

## 3. Technical Stack

### 3.1 Stack Tier
- [ ] **Basic** - Astro + Resend (static site)
- [ ] **CMS** - Astro + Sanity + Resend (content-managed)
- [ ] **FullStack** - Astro + Sanity + Supabase + Resend (full app)

### 3.2 Modules Enabled
- [ ] Sanity CMS
- [ ] Supabase (Auth/Database)
- [x] Resend Email (always enabled)
- [x] Netlify Functions (always enabled)

### 3.3 Third-Party Integrations
| Integration | Purpose | Credentials Location |
|-------------|---------|---------------------|
| [e.g., Google Analytics] | [Tracking] | [.env / client dashboard] |

---

## 4. Functional Requirements

### 4.1 Pages & Routes

| Route | Page Name | Description | Priority |
|-------|-----------|-------------|----------|
| `/` | Home | Landing page with hero, features, contact form | P0 |
| `/about` | About | Company information | P1 |
| `/contact` | Contact | Contact form and details | P0 |

### 4.2 Features

#### Feature: [Feature Name]
**Priority:** P0 / P1 / P2  
**User Story:** As a [user], I want to [action] so that [benefit].

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Technical Notes:**
[Any implementation details]

---

## 5. Content Structure (CMS)

> Skip this section for Basic tier projects.

### 5.1 Document Types

| Type | Description | Fields |
|------|-------------|--------|
| `siteSettings` | Global settings (singleton) | title, description, logo, contact |
| `page` | Generic content pages | title, slug, content, seo |

### 5.2 Content Workflow
- [ ] Client edits directly in Sanity Studio
- [ ] Changes require developer approval
- [ ] Draft → Review → Publish

---

## 6. Backend Logic (FullStack Only)

> Skip this section for Basic and CMS tier projects.

### 6.1 Database Schema
See [SCHEMA.md](./SCHEMA.md) for full database design.

### 6.2 Authentication
- [ ] Email/Password
- [ ] Magic Link
- [ ] OAuth (specify providers)
- [ ] No authentication needed

### 6.3 API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/...` | POST | [Description] | Yes/No |

---

## 7. Design Requirements

### 7.1 Brand Guidelines
- **Primary Color:** [Hex code]
- **Secondary Color:** [Hex code]
- **Fonts:** [Font names]
- **Logo:** [Location of logo files]

### 7.2 Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### 7.3 Reference Designs
[Links to Figma, screenshots, or reference sites]

---

## 8. Localization

### 8.1 Languages
- [x] German (de-CH) - Primary
- [ ] English (en)
- [ ] French (fr)

### 8.2 Localization Approach
- [ ] Separate URLs (e.g., `/de/`, `/en/`)
- [ ] Language switcher
- [ ] Browser detection

---

## 9. Timeline & Milestones

| Milestone | Description | Target Date | Status |
|-----------|-------------|-------------|--------|
| Kickoff | Project start | [Date] | ✅ |
| Design Approval | UI/UX signed off | [Date] | ⏳ |
| Development Complete | All features implemented | [Date] | ⏳ |
| Client Review | Client testing period | [Date] | ⏳ |
| Launch | Go live | [Date] | ⏳ |

---

## 10. Handoff Checklist

### 10.1 Frontend → Backend
- [ ] UI prototype complete on `frontend-prototype` branch
- [ ] All pages have mock data
- [ ] PRD.md finalized
- [ ] SCHEMA.md finalized
- [ ] Credentials shared securely

### 10.2 Backend → Deployment
- [ ] All API endpoints functional
- [ ] Database migrations complete
- [ ] Environment variables documented
- [ ] Security audit passed

### 10.3 Launch
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Client training complete

---

## Appendix

### A. Glossary
[Define any project-specific terms]

### B. Related Documents
- [SCHEMA.md](./SCHEMA.md) - Database schema
- [BACKEND-BRIEFING.md](./BACKEND-BRIEFING.md) - Backend developer handoff


