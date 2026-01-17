#!/usr/bin/env node

/**
 * Script to create bookbright database on Neon Postgres
 * Uses node-postgres to connect and create the database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(process.cwd(), '.env');

function readDatabaseUrl() {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error('.env file not found');
  }
  
  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  const match = content.match(/^DATABASE_URL=(.+)$/m);
  
  if (!match) {
    throw new Error('DATABASE_URL not found in .env');
  }
  
  let url = match[1].trim();
  // Remove quotes
  url = url.replace(/^["']|["']$/g, '');
  
  return url;
}

function getAdminConnectionUrl(url) {
  // Parse URL and connect to 'postgres' database instead
  const urlObj = new URL(url);
  
  // For Neon, we need to connect to the default database (usually 'neondb' or 'postgres')
  // Extract the database name from the original URL
  const originalDb = urlObj.pathname.replace(/^\//, '');
  
  // Try connecting to 'postgres' first, fallback to original database
  urlObj.pathname = '/postgres';
  
  return urlObj.toString();
}

async function createDatabase() {
  const currentUrl = readDatabaseUrl();
  console.log('📋 Current DATABASE_URL found\n');
  
  // Parse current URL to get connection details
  const urlObj = new URL(currentUrl);
  const host = urlObj.hostname;
  const port = urlObj.port || 5432;
  const user = urlObj.username;
  const password = urlObj.password;
  const ssl = urlObj.searchParams.get('sslmode') === 'require';
  
  // Try to connect to 'postgres' database to create new database
  // For Neon, we might need to use the main database
  const adminConfig = {
    host,
    port: parseInt(port),
    user,
    password,
    database: 'postgres', // Try postgres first
    ssl: ssl ? { rejectUnauthorized: false } : false,
  };
  
  console.log(`🔌 Connecting to Postgres server...`);
  console.log(`   Host: ${host}`);
  console.log(`   User: ${user}`);
  
  let client;
  let connected = false;
  
  // Try connecting to 'postgres' database
  try {
    client = new Client(adminConfig);
    await client.connect();
    connected = true;
    console.log('✅ Connected to postgres database\n');
  } catch (error) {
    // If postgres database doesn't exist, try the original database
    console.log('⚠️  Could not connect to postgres database, trying original database...');
    
    const originalDb = urlObj.pathname.replace(/^\//, '');
    adminConfig.database = originalDb;
    
    try {
      client = new Client(adminConfig);
      await client.connect();
      connected = true;
      console.log(`✅ Connected to ${originalDb} database\n`);
    } catch (error2) {
      throw new Error(`Could not connect to database: ${error2.message}`);
    }
  }
  
  if (!connected || !client) {
    throw new Error('Failed to establish database connection');
  }
  
  try {
    // Check if database already exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'bookbright'"
    );
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Database "bookbright" already exists!\n');
      await client.end();
      return;
    }
    
    // Create the database
    console.log('📦 Creating database "bookbright"...');
    await client.query('CREATE DATABASE bookbright');
    console.log('✅ Database "bookbright" created successfully!\n');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Database "bookbright" already exists!\n');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Creating BookBright database...\n');
  
  try {
    await createDatabase();
    console.log('✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npx prisma generate');
    console.log('   2. Run: npx prisma migrate deploy (or migrate dev for dev)');
    console.log('   3. Run: npm run seed (optional)');
    console.log('   4. Restart dev server: npm run dev');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Alternative: Create database manually in Neon Dashboard:');
    console.error('   1. Go to https://console.neon.tech');
    console.error('   2. Select your project');
    console.error('   3. Go to "Databases" section');
    console.error('   4. Click "Create Database"');
    console.error('   5. Name it: bookbright');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createDatabase };

