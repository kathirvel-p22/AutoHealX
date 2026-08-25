import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'autohealx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Create connection pool
const pool = new Pool(dbConfig);

/**
 * Execute a migration file
 */
async function executeMigration(filename: string): Promise<void> {
  const filePath = path.join(__dirname, 'migrations', filename);
  
  console.log(`\n📄 Executing migration: ${filename}`);
  console.log(`   File: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`✅ Migration successful: ${filename}`);
  } catch (error: any) {
    console.error(`❌ Migration failed: ${filename}`);
    throw error;
  }
}

/**
 * Run all migrations
 */
async function runMigrations(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║     AutoHealX Database Migration         ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  console.log('📊 Database Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  
  try {
    // Test connection
    console.log('\n🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensure migrations run in order
    
    console.log(`\n📋 Found ${files.length} migration file(s):`);
    files.forEach(f => console.log(`   - ${f}`));
    
    // Execute migrations
    console.log('\n🚀 Running migrations...');
    for (const file of files) {
      await executeMigration(file);
    }
    
    // Verify migrations
    console.log('\n🔍 Verifying migrations...');
    
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log(`✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row: any) => console.log(`   - ${row.tablename}`));
    
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     ✅ All Migrations Complete!          ║');
    console.log('╚══════════════════════════════════════════╝\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration Error:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Run a specific migration
 */
async function runSpecificMigration(filename: string): Promise<void> {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║     AutoHealX Database Migration         ║');
  console.log('╚══════════════════════════════════════════╝\n');
  
  console.log('📊 Database Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  
  try {
    // Test connection
    console.log('\n🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Execute migration
    await executeMigration(filename);
    
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     ✅ Migration Complete!               ║');
    console.log('╚══════════════════════════════════════════╝\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration Error:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  // Run all migrations
  runMigrations();
} else if (args[0] === '--file' && args[1]) {
  // Run specific migration
  runSpecificMigration(args[1]);
} else {
  console.error('Usage:');
  console.error('  npm run migrate              # Run all migrations');
  console.error('  npm run migrate --file <filename>  # Run specific migration');
  process.exit(1);
}
