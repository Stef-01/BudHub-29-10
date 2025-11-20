// scripts/verifyDeployment.ts
// Verify Supabase deployment and data integrity

import { supabase } from '../lib/supabase';

interface VerificationResult {
  table: string;
  exists: boolean;
  count?: number;
  error?: string;
}

async function checkTable(tableName: string): Promise<VerificationResult> {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        table: tableName,
        exists: false,
        error: error.message
      };
    }

    return {
      table: tableName,
      exists: true,
      count: count || 0
    };
  } catch (error) {
    return {
      table: tableName,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkView(viewName: string): Promise<VerificationResult> {
  try {
    const { data, error } = await supabase
      .from(viewName)
      .select('*')
      .limit(1);

    if (error) {
      return {
        table: viewName,
        exists: false,
        error: error.message
      };
    }

    return {
      table: viewName,
      exists: true,
      count: data?.length || 0
    };
  } catch (error) {
    return {
      table: viewName,
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getSampleData() {
  console.log('\n📋 Sample Data:\n');

  // Get sample markets
  const { data: markets } = await supabase
    .from('markets')
    .select('name, type, suburb, has_indian_produce')
    .limit(3);

  if (markets && markets.length > 0) {
    console.log('🏪 Markets:');
    markets.forEach((m: any) => {
      console.log(`   - ${m.name} (${m.type}) - ${m.suburb}`);
    });
  }

  // Get sample produce
  const { data: produce } = await supabase
    .from('produce_items')
    .select('name, emoji, is_indian_staple')
    .eq('is_indian_staple', true)
    .limit(5);

  if (produce && produce.length > 0) {
    console.log('\n🥬 Indian Staples:');
    produce.forEach((p: any) => {
      console.log(`   ${p.emoji} ${p.name}`);
    });
  }

  // Get sample resources
  const { data: resources } = await supabase
    .from('resources')
    .select('title, organization, is_local')
    .eq('is_local', true)
    .limit(3);

  if (resources && resources.length > 0) {
    console.log('\n📚 Logan Resources:');
    resources.forEach((r: any) => {
      console.log(`   - ${r.title} (${r.organization})`);
    });
  }

  // Get cheapest prices
  const { data: prices } = await supabase
    .from('cheapest_prices')
    .select('produce_name, market_name, price_per_kg, is_indian_staple')
    .eq('is_indian_staple', true)
    .limit(3);

  if (prices && prices.length > 0) {
    console.log('\n💰 Cheapest Prices:');
    prices.forEach((p: any) => {
      console.log(`   - ${p.produce_name}: $${p.price_per_kg?.toFixed(2)}/kg @ ${p.market_name}`);
    });
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   BudHub Deployment Verification          ║');
  console.log('║   Logan-Specific Features                 ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('🔍 Checking Supabase Tables and Views...\n');

  // Tables to check
  const tables = [
    'markets',
    'market_tags',
    'produce_items',
    'price_snapshots',
    'resources',
    'game_progress_weekly',
    'game_activity_daily',
    'budget_missions',
    'user_mission_attempts',
    'mission_leaderboard'
  ];

  // Views to check
  const views = [
    'latest_prices',
    'cheapest_prices'
  ];

  const results: VerificationResult[] = [];

  // Check tables
  console.log('📊 Tables:');
  for (const table of tables) {
    const result = await checkTable(table);
    results.push(result);

    if (result.exists) {
      console.log(`   ✅ ${table.padEnd(25)} (${result.count} rows)`);
    } else {
      console.log(`   ❌ ${table.padEnd(25)} ${result.error || 'Not found'}`);
    }
  }

  // Check views
  console.log('\n👁️  Views:');
  for (const view of views) {
    const result = await checkView(view);
    results.push(result);

    if (result.exists) {
      console.log(`   ✅ ${view.padEnd(25)} (accessible)`);
    } else {
      console.log(`   ❌ ${view.padEnd(25)} ${result.error || 'Not found'}`);
    }
  }

  // Summary
  const existingTables = results.filter(r => r.exists);
  const missingTables = results.filter(r => !r.exists);

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📈 Summary: ${existingTables.length}/${results.length} tables/views accessible`);

  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing Tables/Views:');
    missingTables.forEach(t => {
      console.log(`   - ${t.table}: ${t.error}`);
    });
    console.log('\n💡 Run migrations in Supabase SQL Editor:');
    console.log('   supabase/complete_migration.sql');
  }

  // Get sample data if deployment successful
  if (existingTables.length >= 8) {
    await getSampleData();
  }

  // Final status
  console.log('\n' + '═'.repeat(50));

  if (missingTables.length === 0) {
    console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
    console.log('   All tables and views are accessible.');
    console.log('   The homepage should now display real Logan data.');
  } else {
    console.log('\n⚠️  DEPLOYMENT INCOMPLETE');
    console.log('   Some tables/views are missing.');
    console.log('   Please run the migrations in Supabase SQL Editor.');
  }

  console.log('\n╚════════════════════════════════════════════╝\n');
}

main().catch(console.error);
