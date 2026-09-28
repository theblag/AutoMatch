import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const envContent = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.substring('DATABASE_URL='.length).trim();
  }
}

const sql = neon(dbUrl);

async function check() {
  const searches = await sql`SELECT id, user_id, query, filters, created_at FROM public.search_history ORDER BY created_at DESC LIMIT 5;`;
  console.log('search_history in Neon DB:');
  console.table(searches);
}

check().catch(console.error);
