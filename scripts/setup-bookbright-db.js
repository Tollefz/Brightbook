#!/usr/bin/env node

/**
 * Script to separate BookBright database from Electrohype
 * 
 * This script:
 * 1. Reads current DATABASE_URL from .env
 * 2. Creates a new database "bookbright" on the same Postgres server
 * 3. Updates .env with new DATABASE_URL and generates new NEXTAUTH_SECRET
 * 4. Runs Prisma migrations on the new database
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const ENV_FILE = path.join(process.cwd(), '.env');
const NEW_DB_NAME = 'bookbright';

function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error('.env file not found');
  }
  return fs.readFileSync(ENV_FILE, 'utf-8');
}

function writeEnvFile(content) {
  fs.writeFileSync(ENV_FILE, content, 'utf-8');
}

function parseDatabaseUrl(url) {
  // Remove quotes if present
  url = url.replace(/^["']|["']$/g, '');
  
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      username: urlObj.username,
      password: urlObj.password,
      host: urlObj.hostname,
      port: urlObj.port || '5432',
      database: urlObj.pathname.replace(/^\//, ''),
      searchParams: urlObj.searchParams,
      original: url
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error.message}`);
  }
}

function buildDatabaseUrl(parsed, newDbName) {
  const { protocol, username, password, host, port, searchParams } = parsed;
  const portPart = port ? `:${port}` : '';
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return `${protocol}//${username}:${password}@${host}${portPart}/${newDbName}${queryString}`;
}

function generateNextAuthSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function createDatabase(parsedUrl) {
  // Build connection URL to postgres database (default database for creating new databases)
  const { protocol, username, password, host, port, searchParams } = parsedUrl;
  const portPart = port ? `:${port}` : '';
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  
  // Try to connect to 'postgres' database to create new database
  // For Neon, we might need to use the main database instead
  const adminUrl = `${protocol}//${username}:${password}@${host}${portPart}/postgres${queryString}`;
  
  console.log('📦 Attempting to create database...');
  console.log(`   Database: ${NEW_DB_NAME}`);
  console.log(`   Host: ${host}`);
  
  try {
    // Try using psql if available
    const psqlCommand = `psql "${adminUrl}" -c "CREATE DATABASE ${NEW_DB_NAME};"`;
    execSync(psqlCommand, { stdio: 'inherit' });
    console.log('✅ Database created successfully via psql');
    return true;
  } catch (error) {
    // If psql fails, try using node-postgres or provide manual instructions
    console.log('⚠️  Could not create database via psql');
    console.log('   This might be a Neon database which requires manual creation.');
    console.log('\n📝 Manual steps for Neon:');
    console.log('   1. Go to https://console.neon.tech');
    console.log('   2. Select your project');
    console.log('   3. Go to "Databases" section');
    console.log('   4. Click "Create Database"');
    console.log(`   5. Name it: ${NEW_DB_NAME}`);
    console.log('   6. Copy the connection string');
    console.log('   7. Update DATABASE_URL in .env manually');
    console.log('\n   Or continue with this script to update .env with the expected URL.');
    return false;
  }
}

function updateEnvFile(currentUrl, newUrl, newSecret) {
  const content = readEnvFile();
  
  // Replace DATABASE_URL
  const updatedContent = content.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL="${newUrl}"`
  );
  
  // Update or add NEXTAUTH_SECRET
  const finalContent = updatedContent.includes('NEXTAUTH_SECRET=')
    ? updatedContent.replace(/^NEXTAUTH_SECRET=.*$/m, `NEXTAUTH_SECRET="${newSecret}"`)
    : updatedContent + `\nNEXTAUTH_SECRET="${newSecret}"`;
  
  writeEnvFile(finalContent);
  console.log('✅ .env file updated');
}

function main() {
  console.log('🚀 Setting up BookBright database separation...\n');
  
  try {
    // Read current .env
    const envContent = readEnvFile();
    const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
    
    if (!dbUrlMatch) {
      throw new Error('DATABASE_URL not found in .env');
    }
    
    const currentUrl = dbUrlMatch[1].trim();
    console.log('📋 Current DATABASE_URL found');
    
    // Parse current URL
    const parsed = parseDatabaseUrl(currentUrl);
    console.log(`   Current database: ${parsed.database}`);
    console.log(`   Host: ${parsed.host}`);
    
    // Check if already using bookbright
    if (parsed.database === NEW_DB_NAME) {
      console.log(`\n✅ Already using ${NEW_DB_NAME} database!`);
      return;
    }
    
    // Build new URL
    const newUrl = buildDatabaseUrl(parsed, NEW_DB_NAME);
    console.log(`\n📦 New DATABASE_URL will be:`);
    console.log(`   ${newUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    
    // Generate new NEXTAUTH_SECRET
    const newSecret = generateNextAuthSecret();
    console.log(`\n🔐 Generated new NEXTAUTH_SECRET (64 chars)`);
    
    // Try to create database
    const dbCreated = createDatabase(parsed);
    
    if (!dbCreated) {
      console.log('\n⚠️  Database creation skipped (manual step required)');
      console.log('   The script will still update .env with the expected URL.');
      console.log('   After creating the database manually, run:');
      console.log('   npx prisma migrate deploy');
      console.log('   npm run seed');
    }
    
    // Update .env
    console.log('\n📝 Updating .env file...');
    updateEnvFile(currentUrl, newUrl, newSecret);
    
    console.log('\n✅ Environment variables updated!');
    console.log('\n📋 Next steps:');
    
    if (!dbCreated) {
      console.log('   1. Create the database manually in Neon Dashboard');
      console.log('   2. Update DATABASE_URL in .env if different from expected');
    }
    
    console.log('   3. Run: npx prisma generate');
    console.log('   4. Run: npx prisma migrate deploy (or migrate dev for dev)');
    console.log('   5. Run: npm run seed (optional)');
    console.log('   6. Restart dev server: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseDatabaseUrl, buildDatabaseUrl, generateNextAuthSecret };

