import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  computeColdStartVector,
  vectorDataToArray,
  type UserDemographics,
  type AuthUser,
} from "@/lib/types";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { age, maritalStatus, locationType, primaryUsage, budgetMax } = body;

    if (!age || !maritalStatus || !locationType) {
      return NextResponse.json(
        { error: "Age, marital status, and location type are required" },
        { status: 400 },
      );
    }

    const parsedAge = parseInt(age, 10) || 29;
    const parsedBudget = parseInt(budgetMax, 10) || 2500000;

    // 1. Update user record in Neon DB
    const [userRow] = await sql`
      UPDATE users
      SET age = ${parsedAge},
          marital_status = ${maritalStatus},
          location_type = ${locationType},
          primary_usage = ${primaryUsage || "Daily Commute"},
          budget_max = ${parsedBudget},
          profile_completed = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.id}
      RETURNING id, email, name, profile_completed, age, marital_status, location_type, primary_usage, budget_max;
    `;

    const user: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      profileCompleted: true,
      age: userRow.age,
      maritalStatus: userRow.marital_status,
      locationType: userRow.location_type,
      primaryUsage: userRow.primary_usage,
      budgetMax: Number(userRow.budget_max),
    };

    // 2. Compute cold-start demographic prior vector
    const demo: UserDemographics = {
      age: parsedAge,
      maritalStatus,
      locationType,
      primaryUsage: primaryUsage || "Daily Commute",
      budgetMax: parsedBudget,
    };
    const vectorData = computeColdStartVector(demo);
    const vectorArray = vectorDataToArray(vectorData);
    const vectorString = `[${vectorArray.join(",")}]`;

    // 3. Upsert into user_vectors table with pgvector
    await sql`
      INSERT INTO user_vectors (
        user_id, preference_vector,
        affordability, family_safety, terrain_clearance, urban_agility,
        performance_power, fuel_efficiency, tech_comfort, interaction_count
      ) VALUES (
        ${user.id},
        ${vectorString}::vector,
        ${vectorData.affordability},
        ${vectorData.familySafety},
        ${vectorData.terrainClearance},
        ${vectorData.urbanAgility},
        ${vectorData.performancePower},
        ${vectorData.fuelEfficiency},
        ${vectorData.techComfort},
        0
      )
      ON CONFLICT (user_id) DO UPDATE SET
        preference_vector = ${vectorString}::vector,
        affordability = ${vectorData.affordability},
        family_safety = ${vectorData.familySafety},
        terrain_clearance = ${vectorData.terrainClearance},
        urban_agility = ${vectorData.urbanAgility},
        performance_power = ${vectorData.performancePower},
        fuel_efficiency = ${vectorData.fuelEfficiency},
        tech_comfort = ${vectorData.techComfort},
        updated_at = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({
      success: true,
      user,
      vector: vectorData,
      message: "Driving profile completed and vector seeded in Neon DB",
    });
  } catch (err: any) {
    console.error("Complete profile error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 },
    );
  }
}
