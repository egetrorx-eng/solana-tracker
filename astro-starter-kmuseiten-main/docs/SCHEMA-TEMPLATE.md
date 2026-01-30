# Database Schema

## Project: [Project Name]
**Last Updated:** [Date]  
**Stack Tier:** FullStack

---

## Overview

This document defines the database schema for the Supabase PostgreSQL database.

---

## Tables

### 1. profiles
Extends Supabase Auth with additional user data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, FK → auth.users | User ID from auth |
| `email` | text | NOT NULL | User email |
| `full_name` | text | | Display name |
| `avatar_url` | text | | Profile image URL |
| `role` | text | DEFAULT 'user' | user, admin, superadmin |
| `created_at` | timestamptz | DEFAULT NOW() | |
| `updated_at` | timestamptz | DEFAULT NOW() | |

**RLS Policies:**
- Users can view/update own profile
- Admins can view all profiles

---

### 2. contact_submissions
Stores contact form submissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | |
| `name` | text | NOT NULL | Submitter name |
| `email` | text | NOT NULL | Submitter email |
| `phone` | text | | Optional phone |
| `message` | text | NOT NULL | Message content |
| `source` | text | DEFAULT 'website' | Form source |
| `status` | text | DEFAULT 'new' | new, read, replied, archived |
| `created_at` | timestamptz | DEFAULT NOW() | |

**RLS Policies:**
- Service role can insert
- Admins can view/update

---

### 3. [Your Custom Table]

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | |
| | | | |

**RLS Policies:**
- [Define who can read/write]

---

## Enums

### status_enum
```sql
CREATE TYPE status_enum AS ENUM ('draft', 'active', 'archived');
```

---

## Relationships

```
┌──────────────┐       ┌──────────────────────┐
│  auth.users  │──1:1──│      profiles        │
└──────────────┘       └──────────────────────┘
                                │
                               1:N
                                │
                       ┌────────┴────────┐
                       │  [your_table]   │
                       └─────────────────┘
```

---

## Row Level Security (RLS)

### General Patterns

**User owns resource:**
```sql
CREATE POLICY "Users can view own data"
  ON public.table_name FOR SELECT
  USING (auth.uid() = user_id);
```

**Admin access:**
```sql
CREATE POLICY "Admins can view all"
  ON public.table_name FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
```

**Tenant isolation:**
```sql
CREATE POLICY "Tenant isolation"
  ON public.table_name FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
```

---

## Indexes

```sql
-- Example: Index for common queries
CREATE INDEX idx_table_user_id ON public.table_name(user_id);
CREATE INDEX idx_table_created_at ON public.table_name(created_at DESC);
```

---

## Functions & Triggers

### Auto-update `updated_at`
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER table_updated_at
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Auto-create profile on signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Migration Files

Migrations are stored in `supabase/migrations/` with naming convention:
```
XXXXX_description.sql
```

Example:
- `00001_initial_schema.sql`
- `00002_add_orders_table.sql`

---

## Backup & Recovery

- Supabase handles automatic daily backups (Pro plan)
- For manual backups: `pg_dump` via Supabase CLI
- Point-in-time recovery available on Pro plan


