import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser, type AuthUser, type UserVectorData } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Fetch user details from Neon DB
    const users = await sql`
      SELECT id, email, name, profile_completed, age, marital_status, location_type, primary_usage, budget_max
      FROM users
      WHERE id = ${session.id}
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const userRow = users[0];
    const user: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileCompleted: Boolean(userRow.profile_completed),
      age: userRow.age,
      maritalStatus: userRow.marital_status,
      locationType: userRow.location_type,
      primaryUsage: userRow.primary_usage,
      budgetMax: Number(userRow.budget_max),
    };

    // Fetch User Vector from Neon DB
    const vectorRows = await sql`
      SELECT affordability, family_safety, terrain_clearance, urban_agility,
             performance_power, fuel_efficiency, tech_comfort, interaction_count
      FROM user_vectors
      WHERE user_id = ${user.id}
      LIMIT 1;
    `;

    let vector: UserVectorData = {
      affordability: 0.5,
      familySafety: 0.5,
      terrainClearance: 0.5,
      urbanAgility: 0.5,
      performancePower: 0.5,
      fuelEfficiency: 0.5,
      techComfort: 0.5,
    };

    let interactionCount = 0;
    if (vectorRows.length > 0) {
      const v = vectorRows[0];
      vector = {
        affordability: Number(v.affordability),
        familySafety: Number(v.family_safety),
        terrainClearance: Number(v.terrain_clearance),
        urbanAgility: Number(v.urban_agility),
        performancePower: Number(v.performance_power),
        fuelEfficiency: Number(v.fuel_efficiency),
        techComfort: Number(v.tech_comfort),
      };
      interactionCount = v.interaction_count || 0;
    }

    // Fetch shortlisted cars from interactions
    const shortlistRows = await sql`
      SELECT DISTINCT car_id
      FROM user_interactions
      WHERE user_id = ${user.id} AND action_type = 'LIKE';
    `;
    const shortlistedCarIds = shortlistRows.map((r) => r.car_id);

    // Fetch recent searches
    const recentSearches = await sql`
      SELECT id, query, filters, created_at
      FROM search_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 15;
    `;

    return NextResponse.json({
      authenticated: true,
      user,
      needsProfileSetup: !user.profileCompleted,
      vector,
      interactionCount,
      recentSearches,
      shortlistedCarIds,
    });
  } catch (err: any) {
    console.error("Session verification error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to verify session" },
      { status: 500 },
    );
  }
}
