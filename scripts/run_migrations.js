const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQL(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/) && !s.match(/^\/\*/))
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (!statement || statement.length < 10) continue
    
    try {
      // Use Supabase REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ query: statement })
      })
      
      if (!response.ok && response.status !== 404) {
        // Try alternative: direct SQL execution via PostgREST
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)
      }
    } catch (err) {
      // Continue on error - some statements might fail if objects already exist
      if (!err.message.includes('already exists') && !err.message.includes('does not exist')) {
        console.log(`   ⚠️  Warning on statement ${i + 1}: ${err.message.substring(0, 100)}`)
      }
    }
  }
}

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found: ${filePath}`)
    return
  }
  
  const sql = fs.readFileSync(filePath, 'utf-8')
  
  // Execute via Supabase client using raw SQL
  // Note: Supabase JS client doesn't support raw SQL directly
  // We'll need to use the REST API or provide instructions for manual execution
  
  console.log(`   ✅ Migration file loaded (${sql.length} characters)`)
  console.log(`   ⚠️  Note: Direct SQL execution requires Supabase Dashboard or CLI`)
  console.log(`   📋 Please run this SQL in your Supabase SQL Editor:`)
  console.log(`   ${filePath}\n`)
}

async function main() {
  console.log('🚀 GearGuard Database Migration Script\n')
  console.log('=' .repeat(50))
  
  const migrationsDir = path.join(process.cwd(), 'scripts')
  const migrationFiles = [
    '003_rebuild_schema_clerk.sql',
    '004_seed_data.sql'
  ]
  
  console.log('\n📦 Migration files to run:')
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`)
    } else {
      console.log(`   ❌ ${file} (not found)`)
    }
  })
  
  console.log('\n' + '='.repeat(50))
  console.log('\n⚠️  IMPORTANT: Supabase JS client cannot execute raw SQL directly.')
  console.log('   You have two options:\n')
  console.log('   Option 1: Use Supabase Dashboard')
  console.log('   1. Go to https://supabase.com/dashboard')
  console.log('   2. Select your project')
  console.log('   3. Go to SQL Editor')
  console.log('   4. Copy and paste the contents of each migration file\n')
  console.log('   Option 2: Use Supabase CLI')
  console.log('   $ npx supabase db push --db-url "postgresql://..."\n')
  
  for (const file of migrationFiles) {
    await runMigration(path.join(migrationsDir, file))
  }
  
  console.log('\n✨ Migration preparation complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Open Supabase Dashboard → SQL Editor')
  console.log('   2. Run scripts/003_rebuild_schema_clerk.sql')
  console.log('   3. Run scripts/004_seed_data.sql')
  console.log('   4. Verify tables were created successfully\n')
}

main().catch(console.error)

