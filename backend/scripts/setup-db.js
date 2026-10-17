const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDir = path.resolve(__dirname, '..');
const envPath = path.join(backendDir, '.env');
const envExamplePath = path.join(backendDir, '.env.example');
const schemaPgPath = path.join(backendDir, 'prisma', 'schema.pg.prisma');
const schemaSqlitePath = path.join(backendDir, 'prisma', 'schema.sqlite.prisma');
const targetSchemaPath = path.join(backendDir, 'prisma', 'schema.prisma');

// Ensure schema.pg.prisma backup exists
if (fs.existsSync(targetSchemaPath) && !fs.existsSync(schemaPgPath)) {
  const content = fs.readFileSync(targetSchemaPath, 'utf8');
  if (content.includes('provider = "postgresql"')) {
    fs.writeFileSync(schemaPgPath, content);
  }
}

// 1. Ensure .env exists
if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('[CareQ DB Setup] Created .env from .env.example');
  } else {
    fs.writeFileSync(envPath, `DATABASE_URL="file:./dev.db"\nPORT=5000\nJWT_SECRET="careq-super-secret-jwt-key-2025"\nFRONTEND_URL="http://localhost:5173"\nNODE_ENV="development"\n`);
    console.log('[CareQ DB Setup] Created default .env');
  }
}

const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
let dbUrl = '';
for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    dbUrl = trimmed.split('=')[1].replace(/['"]/g, '').trim();
    break;
  }
}

const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

console.log(`[CareQ DB Setup] Detected active DATABASE_URL: ${dbUrl}`);
console.log(`[CareQ DB Setup] Target Database: ${isPostgres ? 'PostgreSQL' : 'SQLite (Local Zero-Config Dev)'}`);

if (isPostgres) {
  // Use PostgreSQL schema
  if (fs.existsSync(schemaPgPath)) {
    fs.copyFileSync(schemaPgPath, targetSchemaPath);
  }
} else {
  // Use SQLite schema
  if (fs.existsSync(schemaSqlitePath)) {
    fs.copyFileSync(schemaSqlitePath, targetSchemaPath);
  }
}

try {
  console.log('[CareQ DB Setup] Generating Prisma Client...');
  execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });

  console.log('[CareQ DB Setup] Synchronizing database schema (prisma db push)...');
  execSync('npx prisma db push --accept-data-loss', { cwd: backendDir, stdio: 'inherit' });

  console.log('[CareQ DB Setup] Seeding database with demo hospital data...');
  execSync('npm run seed', { cwd: backendDir, stdio: 'inherit' });

  console.log('[CareQ DB Setup] Database setup and seeding completed successfully!');
} catch (err) {
  console.error('[CareQ DB Setup] Error setting up database:', err.message);
  process.exit(1);
}
