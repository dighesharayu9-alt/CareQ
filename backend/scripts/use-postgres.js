const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '..');
const schemaPgPath = path.join(backendDir, 'prisma', 'schema.pg.prisma');
const targetSchemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
const envPath = path.join(backendDir, '.env');

console.log('[CareQ] Switching schema to PostgreSQL...');
if (fs.existsSync(schemaPgPath)) {
  fs.copyFileSync(schemaPgPath, targetSchemaPath);
  console.log('[CareQ] Restored prisma/schema.prisma from schema.pg.prisma');
} else {
  console.log('[CareQ] schema.pg.prisma not found.');
}

console.log('[CareQ] Ensure your .env has a valid PostgreSQL DATABASE_URL, for example:');
console.log('DATABASE_URL="postgresql://postgres:postgres@localhost:5432/careq?schema=public"');
console.log('Then run: npx prisma migrate dev or npx prisma db push');
