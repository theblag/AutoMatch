import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim();
      }
    }
  }
}

const dbUrl = process.env.DATABASE_URL;
const sql = neon(dbUrl);

async function runMigration() {
  try {
    console.log("Applying OAuth and profile_completed migrations in Neon DB...");
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'google';`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;`;
    await sql`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN age DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN marital_status DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN location_type DROP NOT NULL;`;
    await sql`ALTER TABLE users ALTER COLUMN primary_usage DROP NOT NULL;`;

    const cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `;
    console.log("✅ Users table updated with OAuth & profile_completed columns:", cols.map(c => c.column_name));
  } catch (err) {
    console.error("Migration error:", err);
  }
}

runMigration();
