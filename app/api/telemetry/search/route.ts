import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  vectorDataToArray,
  type UserVectorData,
} from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, filters, currentVector: clientVector } = body;

    if (!query && !filters) {
      return NextResponse.json({ error: "Query or filters required" }, { status: 400 });
    }

    const session = await getSessionUser();
    const lowerQuery = (query || "").toLowerCase();

    // 1. Fetch current vector (from DB if logged in, or from client payload if guest)
    let currentVector: UserVectorData = clientVector || {
      affordability: 0.6,
      familySafety: 0.6,
      terrainClearance: 0.6,
      urbanAgility: 0.6,
      performancePower: 0.6,
      fuelEfficiency: 0.6,
      techComfort: 0.6,
    };

    if (session) {
      const vectorRows = await sql`
        SELECT affordability, family_safety, terrain_clearance, urban_agility,
               performance_power, fuel_efficiency, tech_comfort, interaction_count
        FROM user_vectors
        WHERE user_id = ${session.id}
        LIMIT 1;
      `;
      if (vectorRows.length > 0) {
        const row = vectorRows[0];
        currentVector = {
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

    // 2. Semantic Intent & Brand Association Mapping
    const lr = 0.15; // Learning rate for searches
    let targetVector = { ...currentVector };

    // Fuel Efficiency & Eco
    if (/electric|ev|hybrid|cng|mileage|efficient|diesel|economy/i.test(lowerQuery)) {
      targetVector.fuelEfficiency = Math.min(0.99, targetVector.fuelEfficiency + 0.25);
    }
    // Urban & Compact
    if (/automatic|amt|cvt|city|compact|hatchback|traffic/i.test(lowerQuery)) {
      targetVector.urbanAgility = Math.min(0.99, targetVector.urbanAgility + 0.25);
    }
    // High Ground Clearance & Rugged
    if (/suv|4x4|awd|clearance|offroad|hill|ground clearance|thar|scorpio|safari/i.test(lowerQuery)) {
      targetVector.terrainClearance = Math.min(0.99, targetVector.terrainClearance + 0.25);
    }
    // Family & Safety
    if (/safety|airbags|isofix|family|7 seater|6 seater|spacious|tata|innova/i.test(lowerQuery)) {
      targetVector.familySafety = Math.min(0.99, targetVector.familySafety + 0.25);
    }
    // Performance & Speed
    if (/turbo|sport|horsepower|power|fast|performance|v6|v8|v10|v12|ferrari|lamborghini|porsche|bugatti|supercar|m340i|bmw/i.test(lowerQuery)) {
      targetVector.performancePower = Math.min(0.99, targetVector.performancePower + 0.35);
    }
    // Luxury & Comfort
    if (/luxury|sunroof|leather|ventilated|cruise|audi|mercedes|ferrari|rolls|bentley|lamborghini|premium/i.test(lowerQuery)) {
      targetVector.techComfort = Math.min(0.99, targetVector.techComfort + 0.25);
    }

    // Brand Affinities
    if (/maruti|suzuki/i.test(lowerQuery)) {
      targetVector.fuelEfficiency = Math.min(0.99, targetVector.fuelEfficiency + 0.2);
      targetVector.urbanAgility = Math.min(0.99, targetVector.urbanAgility + 0.18);
    }
    if (/tata|mahindra/i.test(lowerQuery)) {
      targetVector.familySafety = Math.min(0.99, targetVector.familySafety + 0.2);
      targetVector.terrainClearance = Math.min(0.99, targetVector.terrainClearance + 0.18);
    }
    if (/ferrari|lamborghini|porsche|bugatti/i.test(lowerQuery)) {
      targetVector.performancePower = Math.min(0.99, targetVector.performancePower + 0.4);
      targetVector.techComfort = Math.min(0.99, targetVector.techComfort + 0.25);
      targetVector.affordability = Math.max(0.1, targetVector.affordability - 0.3); // High willingness to spend
    }

    // 3. Apply Exponential Moving Average
    const clamp = (v: number) => Math.max(0.05, Math.min(0.99, Number(v.toFixed(3))));
    const updatedVector: UserVectorData = {
      affordability: clamp(currentVector.affordability * (1 - lr) + targetVector.affordability * lr),
      familySafety: clamp(currentVector.familySafety * (1 - lr) + targetVector.familySafety * lr),
      terrainClearance: clamp(currentVector.terrainClearance * (1 - lr) + targetVector.terrainClearance * lr),
      urbanAgility: clamp(currentVector.urbanAgility * (1 - lr) + targetVector.urbanAgility * lr),
      performancePower: clamp(currentVector.performancePower * (1 - lr) + targetVector.performancePower * lr),
      fuelEfficiency: clamp(currentVector.fuelEfficiency * (1 - lr) + targetVector.fuelEfficiency * lr),
      techComfort: clamp(currentVector.techComfort * (1 - lr) + targetVector.techComfort * lr),
    };

    // 4. If logged in, commit search to Neon DB
    if (session) {
      await sql`
        INSERT INTO search_history (user_id, query, filters)
        VALUES (${session.id}, ${query || "Filter adjustment"}, ${JSON.stringify(filters || {})});
      `;

      const vectorArray = vectorDataToArray(updatedVector);
      const vectorString = `[${vectorArray.join(",")}]`;

      await sql`
        UPDATE user_vectors
        SET preference_vector = ${vectorString}::vector,
            affordability = ${updatedVector.affordability},
            family_safety = ${updatedVector.familySafety},
            terrain_clearance = ${updatedVector.terrainClearance},
            urban_agility = ${updatedVector.urbanAgility},
            performance_power = ${updatedVector.performancePower},
            fuel_efficiency = ${updatedVector.fuelEfficiency},
            tech_comfort = ${updatedVector.techComfort},
            interaction_count = interaction_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${session.id};
      `;
    }

    return NextResponse.json({
      success: true,
      guest: !session,
      updatedVector,
      query,
      message: session
        ? "Search logged to Neon DB and vector updated via pgvector"
        : "Search applied to in-memory vector",
    });
  } catch (err: any) {
    console.error("Search telemetry error:", err);
    return NextResponse.json({ error: err.message || "Failed to log search" }, { status: 500 });
  }
}
