import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser, type UserVectorData } from "@/lib/auth";
import { getVectorRecommendations } from "@/lib/vectorRecommender";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const budget = Number(searchParams.get("budget")) || 0;
    const typesParam = searchParams.get("types");
    const fuelsParam = searchParams.get("fuels");
    const types = typesParam ? typesParam.split(",").filter(Boolean) : [];
    const fuels = fuelsParam ? fuelsParam.split(",").filter(Boolean) : [];

    // 1. Check if user is logged in
    const session = await getSessionUser();
    let userVector: UserVectorData = {
      affordability: 0.6,
      familySafety: 0.6,
      terrainClearance: 0.6,
      urbanAgility: 0.6,
      performancePower: 0.6,
      fuelEfficiency: 0.6,
      techComfort: 0.6,
    };
    let userProfile = null;
    let interactionCount = 0;

    if (session) {
      // Fetch from Neon DB
      const userRows = await sql`
        SELECT u.id, u.name, u.email, u.age, u.marital_status, u.location_type, u.primary_usage, u.budget_max,
               v.affordability, v.family_safety, v.terrain_clearance, v.urban_agility,
               v.performance_power, v.fuel_efficiency, v.tech_comfort, v.interaction_count
        FROM users u
        LEFT JOIN user_vectors v ON u.id = v.user_id
        WHERE u.id = ${session.id}
        LIMIT 1;
      `;

      if (userRows.length > 0) {
        const row = userRows[0];
        userProfile = {
          id: row.id,
          name: row.name,
          email: row.email,
          age: row.age,
          maritalStatus: row.marital_status,
          locationType: row.location_type,
          primaryUsage: row.primary_usage,
          budgetMax: Number(row.budget_max),
        };
        interactionCount = row.interaction_count || 0;

        if (row.affordability !== null) {
          userVector = {
            affordability: Number(row.affordability),
            familySafety: Number(row.family_safety),
            terrainClearance: Number(row.terrain_clearance),
            urbanAgility: Number(row.urban_agility),
            performancePower: Number(row.performance_power),
            fuelEfficiency: Number(row.fuel_efficiency),
            techComfort: Number(row.tech_comfort),
          };
        }
      }
    }

    // 2. Run Vector Recommendation Engine
    const results = getVectorRecommendations(userVector, {
      budgetLimit: budget || userProfile?.budgetMax || 0,
      types,
      fuels,
    });

    return NextResponse.json({
      success: true,
      user: userProfile,
      vector: userVector,
      interactionCount,
      totalMatches: results.length,
      recommendations: results,
    });
  } catch (err: any) {
    console.error("Recommendations API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to compute recommendations" },
      { status: 500 },
    );
  }
}
