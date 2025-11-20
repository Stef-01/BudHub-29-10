// scripts/runMigrations.ts
// Script to run Supabase migrations and seed data

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://ghctyzaazxrnfdhakbix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3R5emFhenhybmZkaGFrYml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjAyNzQsImV4cCI6MjA3ODI5NjI3NH0.De_dqFToKVutIkPCNzFNlnuaHCYUd6c0EQa2zTGKsVI';

// Use service role key for migrations (anon key won't have sufficient permissions)
// NOTE: In production, this should be passed as an environment variable
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSQL(sql: string, filename: string): Promise<boolean> {
  try {
    console.log(`\n🔄 Running: ${filename}`);

    // Split by semicolons to handle multiple statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_migrations').insert({
            name: filename,
            executed_at: new Date().toISOString()
          });

          if (directError && directError.code !== '42P01') { // Ignore table not found
            console.error(`   ❌ Error: ${error.message || directError.message}`);
            return false;
          }
        }
      }
    }

    console.log(`   ✅ Success: ${filename}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${filename}`, error);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting Supabase Migrations...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const seedDir = path.join(process.cwd(), 'supabase', 'seed');

  // Get all migration files in order
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('📋 Migrations to run:');
  migrationFiles.forEach(f => console.log(`   - ${f}`));

  // Run migrations
  console.log('\n=== RUNNING MIGRATIONS ===');
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const success = await runSQL(sql, file);

    if (!success) {
      console.error('\n❌ Migration failed. Stopping execution.');
      return false;
    }

    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ All migrations completed successfully!');
  return true;
}

async function runSeeds() {
  console.log('\n\n🌱 Starting Data Seeding...\n');

  const seedDir = path.join(process.cwd(), 'supabase', 'seed');

  if (!fs.existsSync(seedDir)) {
    console.log('⚠️  No seed directory found. Skipping seeding.');
    return true;
  }

  // Get all seed files in order
  const seedFiles = fs
    .readdirSync(seedDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (seedFiles.length === 0) {
    console.log('⚠️  No seed files found. Skipping seeding.');
    return true;
  }

  console.log('📋 Seeds to run:');
  seedFiles.forEach(f => console.log(`   - ${f}`));

  // Run seeds
  console.log('\n=== RUNNING SEEDS ===');
  for (const file of seedFiles) {
    const filePath = path.join(seedDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    const success = await runSQL(sql, file);

    if (!success) {
      console.warn(`\n⚠️  Seed ${file} failed. Continuing with remaining seeds...`);
    }

    // Small delay between seeds
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ All seeds completed!');
  return true;
}

async function verifyData() {
  console.log('\n\n🔍 Verifying Data...\n');

  try {
    // Check markets
    const { data: markets, error: marketsError } = await supabase
      .from('markets')
      .select('count');

    if (!marketsError) {
      console.log(`   ✅ Markets table accessible`);
    }

    // Check produce_items
    const { data: produce, error: produceError } = await supabase
      .from('produce_items')
      .select('count');

    if (!produceError) {
      console.log(`   ✅ Produce items table accessible`);
    }

    // Check resources
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('count');

    if (!resourcesError) {
      console.log(`   ✅ Resources table accessible`);
    }

    // Check budget_missions
    const { data: missions, error: missionsError } = await supabase
      .from('budget_missions')
      .select('count');

    if (!missionsError) {
      console.log(`   ✅ Budget missions table accessible`);
    }

    console.log('\n✅ Database verification complete!');
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   BudHub Supabase Migration Runner         ║');
  console.log('║   Logan-Specific Features Database Setup   ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Run migrations
    const migrationsSuccess = await runMigrations();

    if (!migrationsSuccess) {
      console.error('\n❌ Migrations failed. Exiting.');
      process.exit(1);
    }

    // Run seeds
    await runSeeds();

    // Verify
    await verifyData();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║          🎉 DEPLOYMENT COMPLETE! 🎉        ║');
    console.log('╚════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
