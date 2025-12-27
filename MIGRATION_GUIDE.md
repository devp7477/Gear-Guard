# 🚀 Database Migration Guide

## Quick Start

Since Supabase requires SQL execution through their dashboard, follow these steps:

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/gklcqfmsmfzzrsbmneiy**
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Run Schema Migration

1. Open the file: `scripts/003_rebuild_schema_clerk.sql`
2. **Copy the entire contents** of the file
3. **Paste** into the SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. Wait for success message: ✅ "Success. No rows returned"

### Step 3: Run Seed Data

1. Open the file: `scripts/004_seed_data.sql`
2. **Copy the entire contents** of the file
3. **Paste** into the SQL Editor (or create a new query)
4. Click **"Run"**
5. Wait for success message

### Step 4: Verify Tables

1. Go to **"Table Editor"** in the left sidebar
2. You should see these tables:
   - ✅ `profiles`
   - ✅ `maintenance_teams`
   - ✅ `team_members`
   - ✅ `equipment`
   - ✅ `maintenance_requests`
   - ✅ `maintenance_history`
   - ✅ `maintenance_comments`
   - ✅ `maintenance_notifications`

### Step 5: Verify Seed Data

1. In **"Table Editor"**, click on `maintenance_teams`
2. You should see 3 teams: Mechanics, Electricians, IT Support
3. Click on `equipment`
4. You should see 5 sample equipment records

## ✅ Migration Complete!

Your database is now ready. You can:
- Start your app: `npm run dev`
- Sign up/login through Clerk
- Your profile will be automatically created when you first log in!

## Troubleshooting

### Error: "relation already exists"
- This means tables already exist. The migration will drop and recreate them.
- If you have important data, back it up first!

### Error: "permission denied"
- Make sure you're using the correct Supabase project
- Check that your API keys are correct in `.env.local`

### Error: "foreign key constraint"
- Run migrations in order: schema first, then seed data
- Make sure the schema migration completed successfully

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
npx supabase link --project-ref gklcqfmsmfzzrsbmneiy

# Run migrations
npx supabase db push
```

## Alternative: Using psql

If you have database connection credentials:

```bash
psql "postgresql://postgres:[PASSWORD]@db.gklcqfmsmfzzrsbmneiy.supabase.co:5432/postgres" -f scripts/003_rebuild_schema_clerk.sql
psql "postgresql://postgres:[PASSWORD]@db.gklcqfmsmfzzrsbmneiy.supabase.co:5432/postgres" -f scripts/004_seed_data.sql
```

---

**Need help?** Check the migration files in the `scripts/` directory.

