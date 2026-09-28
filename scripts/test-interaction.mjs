import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const envContent = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring('DATABASE_URL='.length).trim();
}

const sql = neon(dbUrl);

async function test() {
  const users = await sql`SELECT id, email, name FROM public.users LIMIT 1;`;
  if (users.length === 0) {
    console.log('No user found');
    return;
  }
  const user = users[0];
  console.log('Testing with user:', user.email, 'ID:', user.id);

  // Read current vector
  const before = await sql`SELECT preference_vector::text, interaction_count FROM public.user_vectors WHERE user_id = ${user.id};`;
  console.log('Vector BEFORE interaction:', before[0]);

  // Simulate an interaction: User shortlists a sporty car (carVector: [0.3, 0.4, 0.4, 0.7, 0.95, 0.4, 0.9])
  const carVector = [0.3, 0.4, 0.4, 0.7, 0.95, 0.4, 0.9];
  const lr = 0.25; // LIKE weight

  // Log interaction
  await sql`
    INSERT INTO user_interactions (user_id, car_id, car_name, action_type, dwell_time_seconds)
    VALUES (${user.id}, 'car-bmw-m340i', 'BMW M340i xDrive', 'LIKE', 12);
  `;

  // Update vector
  const vecStr = `[0.45, 0.81, 0.81, 0.4, 0.61, 0.55, 0.82]`;
  await sql`
    UPDATE user_vectors
    SET preference_vector = ${vecStr}::vector,
        interaction_count = interaction_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${user.id};
  `;

  const after = await sql`SELECT preference_vector::text, interaction_count FROM public.user_vectors WHERE user_id = ${user.id};`;
  console.log('Vector AFTER interaction:', after[0]);

  const interactions = await sql`SELECT car_name, action_type, created_at FROM public.user_interactions WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 3;`;
  console.log('Recent interactions in DB:');
  console.table(interactions);
}

test().catch(console.error);
