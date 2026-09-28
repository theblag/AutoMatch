import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not set in environment variables.");
}

// Connect to Neon serverless postgres
export const sql = neon(databaseUrl || "");

/**
 * Initializes and migrates the Neon DB schema.
 * Supports Google OAuth users with progressive profile completion.
 */
export async function ensureDbSchema() {
  if (!databaseUrl) return;

  try {
    // 1. Enable pgvector
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    // 2. Users Table (with profile_completed flag for one-time onboarding)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        auth_provider VARCHAR(50) DEFAULT 'google',
        profile_completed BOOLEAN DEFAULT false,
        age INT,
        marital_status VARCHAR(50),
        location_type VARCHAR(50),
        primary_usage VARCHAR(50),
        budget_max BIGINT DEFAULT 2500000,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Ensure migration columns exist if table was created previously
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'google';`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;`;
    await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN age DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN marital_status DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN location_type DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN primary_usage DROP NOT NULL;`;

    // 3. User Vectors Table (pgvector 7-dimensional embedding)
    await sql`
      CREATE TABLE IF NOT EXISTS user_vectors (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        preference_vector vector(7) NOT NULL,
        affordability FLOAT NOT NULL DEFAULT 0.5,
        family_safety FLOAT NOT NULL DEFAULT 0.5,
        terrain_clearance FLOAT NOT NULL DEFAULT 0.5,
        urban_agility FLOAT NOT NULL DEFAULT 0.5,
        performance_power FLOAT NOT NULL DEFAULT 0.5,
        fuel_efficiency FLOAT NOT NULL DEFAULT 0.5,
        tech_comfort FLOAT NOT NULL DEFAULT 0.5,
        interaction_count INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Search History Table
    await sql`
      CREATE TABLE IF NOT EXISTS search_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        filters JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 5. User Interactions Table
    await sql`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        car_id VARCHAR(100) NOT NULL,
        car_name VARCHAR(255),
        action_type VARCHAR(50) NOT NULL,
        dwell_time_seconds INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 6. Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id, created_at DESC);`;

    console.log("✅ Neon DB schema and OAuth progressive migration verified.");
  } catch (error) {
    console.error("❌ Error initializing Neon DB schema:", error);
    throw error;
  }
}
