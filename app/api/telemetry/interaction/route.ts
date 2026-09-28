import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  adaptUserVector,
  vectorDataToArray,
  type UserVectorData,
} from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { carId, carName, actionType, carVector, currentVector, dwellTimeSeconds } = body;

    if (!carId || !actionType) {
      return NextResponse.json(
        { error: "carId and actionType required" },
        { status: 400 },
      );
    }

    const session = await getSessionUser();

    // Guest Mode: User is browsing anonymously
    if (!session) {
      const base: UserVectorData = currentVector || {
        affordability: 0.6,
        familySafety: 0.6,
        terrainClearance: 0.6,
        urbanAgility: 0.6,
        performancePower: 0.6,
        fuelEfficiency: 0.6,
        techComfort: 0.6,
      };

      const updated = adaptUserVector(
        base,
        carVector || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        actionType,
      );

      return NextResponse.json({
        success: true,
        guest: true,
        updatedVector: updated,
        message: "Vector adapted locally (sign in to persist to Neon DB)",
      });
    }

    // Authenticated User: Commit interaction & updated vector to Neon DB
    if (actionType === "UNLIKE") {
      await sql`
        DELETE FROM user_interactions
        WHERE user_id = ${session.id} AND car_id = ${carId} AND action_type = 'LIKE';
      `;
      return NextResponse.json({
        success: true,
        message: "Removed car from shortlist in Neon DB",
      });
    }

    // 1. Log to user_interactions table
    await sql`
      INSERT INTO user_interactions (user_id, car_id, car_name, action_type, dwell_time_seconds)
      VALUES (${session.id}, ${carId}, ${carName || ""}, ${actionType}, ${dwellTimeSeconds || 0});
    `;

    // 2. Fetch current vector from Neon DB
    const vectorRows = await sql`
      SELECT affordability, family_safety, terrain_clearance, urban_agility,
             performance_power, fuel_efficiency, tech_comfort, interaction_count
      FROM user_vectors
      WHERE user_id = ${session.id}
      LIMIT 1;
    `;

    let currentVec: UserVectorData;
    let interactionCount = 1;

    if (vectorRows.length > 0) {
      currentVec = {
        affordability: Number(vectorRows[0].affordability),
        familySafety: Number(vectorRows[0].family_safety),
        terrainClearance: Number(vectorRows[0].terrain_clearance),
        urbanAgility: Number(vectorRows[0].urban_agility),
        performancePower: Number(vectorRows[0].performance_power),
        fuelEfficiency: Number(vectorRows[0].fuel_efficiency),
        techComfort: Number(vectorRows[0].tech_comfort),
      };
      interactionCount = (vectorRows[0].interaction_count || 0) + 1;
    } else {
      currentVec = currentVector || {
        affordability: 0.6,
        familySafety: 0.6,
        terrainClearance: 0.6,
        urbanAgility: 0.6,
        performancePower: 0.6,
        fuelEfficiency: 0.6,
        techComfort: 0.6,
      };
    }

    // 3. Adapt vector using Exponential Moving Average
    const updatedVector = adaptUserVector(
      currentVec,
      carVector || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      actionType,
    );

    const vectorArray = vectorDataToArray(updatedVector);
    const vectorString = `[${vectorArray.join(",")}]`;

    // 4. Update Neon DB user_vectors with pgvector
    await sql`
      INSERT INTO user_vectors (
        user_id, preference_vector,
        affordability, family_safety, terrain_clearance, urban_agility,
        performance_power, fuel_efficiency, tech_comfort, interaction_count
      ) VALUES (
        ${session.id},
        ${vectorString}::vector,
        ${updatedVector.affordability},
        ${updatedVector.familySafety},
        ${updatedVector.terrainClearance},
        ${updatedVector.urbanAgility},
        ${updatedVector.performancePower},
        ${updatedVector.fuelEfficiency},
        ${updatedVector.techComfort},
        ${interactionCount}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        preference_vector = ${vectorString}::vector,
        affordability = ${updatedVector.affordability},
        family_safety = ${updatedVector.familySafety},
        terrain_clearance = ${updatedVector.terrainClearance},
        urban_agility = ${updatedVector.urbanAgility},
        performance_power = ${updatedVector.performancePower},
        fuel_efficiency = ${updatedVector.fuelEfficiency},
        tech_comfort = ${updatedVector.techComfort},
        interaction_count = ${interactionCount},
        updated_at = CURRENT_TIMESTAMP;
    `;

    return NextResponse.json({
      success: true,
      guest: false,
      updatedVector,
      interactionCount,
      message: "Vector updated in Neon PostgreSQL via pgvector",
    });
  } catch (err: any) {
    console.error("Interaction telemetry error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to log interaction" },
      { status: 500 },
    );
  }
}
