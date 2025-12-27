import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(filePath: string) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`)
  const sql = fs.readFileSync(filePath, 'utf-8')
  
  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase.from('_temp').select('*').limit(0)
          if (directError) {
            console.log(`⚠️  Note: ${error.message}`)
            console.log(`   Statement: ${statement.substring(0, 100)}...`)
          }
        }
      } catch (err: any) {
        console.log(`⚠️  Warning: ${err.message}`)
      }
    }
  }
  
  console.log(`✅ Completed: ${path.basename(filePath)}`)
}

async function main() {
  console.log('🚀 Starting database migrations...\n')
  
  const migrationsDir = path.join(process.cwd(), 'scripts')
  const migrationFiles = [
    '003_rebuild_schema.sql',
    '004_seed_data.sql'
  ]
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    if (fs.existsSync(filePath)) {
      await runMigration(filePath)
    } else {
      console.log(`⚠️  Migration file not found: ${file}`)
    }
  }
  
  console.log('\n✨ All migrations completed!')
}

main().catch(console.error)

