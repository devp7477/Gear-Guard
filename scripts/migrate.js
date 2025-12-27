#!/usr/bin/env node

/**
 * GearGuard Database Migration Helper
 * 
 * This script provides instructions for running database migrations.
 * Since Supabase requires SQL execution through their dashboard,
 * this script validates your setup and provides clear instructions.
 */

const fs = require('fs')
const path = require('path')

console.log('\n🚀 GearGuard Database Migration Helper\n')
console.log('='.repeat(60))

// Check for migration files
const migrationsDir = path.join(process.cwd(), 'scripts')
const migrationFiles = [
  { file: '003_rebuild_schema_clerk.sql', name: 'Schema Setup (Clerk-compatible)', required: true },
  { file: '004_seed_data.sql', name: 'Seed Data', required: false }
]

console.log('\n📋 Checking Migration Files:')
let allFilesExist = true
migrationFiles.forEach((migration, index) => {
  const filePath = path.join(migrationsDir, migration.file)
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    console.log(`   ${index + 1}. ✅ ${migration.name}`)
    console.log(`      File: ${migration.file} (${(stats.size / 1024).toFixed(2)} KB)`)
  } else {
    console.log(`   ${index + 1}. ❌ ${migration.name} - FILE NOT FOUND`)
    if (migration.required) allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('\n❌ Required migration files are missing!')
  process.exit(1)
}

console.log('\n' + '='.repeat(60))
console.log('\n📝 HOW TO RUN MIGRATIONS:\n')
console.log('Since Supabase requires SQL execution through their dashboard,')
console.log('please follow these steps:\n')
console.log('STEP 1: Open Supabase Dashboard')
console.log('  → Go to: https://supabase.com/dashboard/project/gklcqfmsmfzzrsbmneiy')
console.log('  → Click on "SQL Editor" in the left sidebar')
console.log('  → Click "New query"\n')
console.log('STEP 2: Run Schema Migration')
migrationFiles.forEach((migration, index) => {
  const filePath = path.join(migrationsDir, migration.file)
  if (fs.existsSync(filePath)) {
    console.log(`  ${index + 1}. Open: scripts/${migration.file}`)
    console.log(`     Copy the entire file contents`)
    console.log(`     Paste into SQL Editor`)
    console.log(`     Click "Run" (or Cmd/Ctrl + Enter)`)
    console.log(`     Wait for: ✅ "Success. No rows returned"\n`)
  }
})

console.log('STEP 3: Verify Tables')
console.log('  → Go to "Table Editor" in left sidebar')
console.log('  → You should see: profiles, maintenance_teams, equipment, etc.\n')

console.log('STEP 4: Start Your App')
console.log('  → Run: npm run dev')
console.log('  → Sign up/login through Clerk')
console.log('  → Your profile will be automatically created!\n')

// Display SQL preview
console.log('='.repeat(60))
console.log('\n📄 SQL Preview (first 300 chars of schema):\n')
const schemaFile = path.join(migrationsDir, '003_rebuild_schema_clerk.sql')
if (fs.existsSync(schemaFile)) {
  const sql = fs.readFileSync(schemaFile, 'utf-8')
  const lines = sql.split('\n').slice(0, 10)
  lines.forEach(line => console.log('   ' + line))
  console.log('   ...\n')
  console.log(`   Full file location: ${schemaFile}\n`)
}

console.log('='.repeat(60))
console.log('\n✨ For detailed instructions, see: MIGRATION_GUIDE.md\n')
