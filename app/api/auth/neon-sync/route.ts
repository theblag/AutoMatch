import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";
import type { AuthUser, UserVectorData } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to sync user" },
        { status: 400 },
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = (name && name.trim()) || cleanEmail.split("@")[0];

    // 1. Check if user already exists in public.users
    let userRow;
    const existing = await sql`
      SELECT id, email, name, profile_completed, age, marital_status, location_type, primary_usage, budget_max
      FROM users
      WHERE email = ${cleanEmail}
      LIMIT 1;
    `;

    if (existing.length > 0) {
      userRow = existing[0];
    } else {
      // 2. New Neon Auth user: Create account with profile_completed = false
      const [newRow] = await sql`
        INSERT INTO users (
          email, name, auth_provider, profile_completed
        ) VALUES (
          ${cleanEmail}, ${displayName}, 'neon_auth', false
        )
        RETURNING id, email, name, profile_completed, age, marital_status, location_type, primary_usage, budget_max;
      `;
      userRow = newRow;
    }

    const user: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileCompleted: Boolean(userRow.profile_completed),
      age: userRow.age,
      maritalStatus: userRow.marital_status,
      locationType: userRow.location_type,
      primaryUsage: userRow.primary_usage,
      budgetMax: Number(userRow.budget_max) || 2500000,
    };

    // 3. If profile completed, load their vector
    let vector: UserVectorData | null = null;
    if (user.profileCompleted) {
      const vecRows = await sql`
        SELECT affordability, family_safety, terrain_clearance, urban_agility,
               performance_power, fuel_efficiency, tech_comfort, interaction_count
        FROM user_vectors
        WHERE user_id = ${user.id}
        LIMIT 1;
      `;
      if (vecRows.length > 0) {
        vector = {
          affordability: Number(vecRows[0].affordability),
          familySafety: Number(vecRows[0].family_safety),
          terrainClearance: Number(vecRows[0].terrain_clearance),
          urbanAgility: Number(vecRows[0].urban_agility),
          performancePower: Number(vecRows[0].performance_power),
          fuelEfficiency: Number(vecRows[0].fuel_efficiency),
          techComfort: Number(vecRows[0].tech_comfort),
        };
      }
    }

    // 4. Create Session Token
    const token = await createSessionToken(user);

    const res = NextResponse.json({
      success: true,
      user,
      vector,
      needsProfileSetup: !user.profileCompleted,
    });

    res.cookies.set("automatch_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Neon Auth sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync Neon Auth user" },
      { status: 500 },
    );
  }
}
