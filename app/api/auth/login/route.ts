import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  type AuthUser,
  type UserVectorData,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // 1. Fetch user from Neon DB
    const users = await sql`
      SELECT id, email, password_hash, name, profile_completed, age, marital_status, location_type, primary_usage, budget_max
      FROM users
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const userRow = users[0];
    const isPasswordValid = await verifyPassword(
      password,
      userRow.password_hash,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
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
      budgetMax: Number(userRow.budget_max),
    };

    // 2. Fetch User Vector from Neon DB
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
    }

    // 3. Fetch recent search history
    const recentSearches = await sql`
      SELECT query, filters, created_at
      FROM search_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 10;
    `;

    // 4. Create Session
    const token = await createSessionToken(user);

    const res = NextResponse.json({
      success: true,
      user,
      vector,
      recentSearches,
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
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to log in" },
      { status: 500 },
    );
  }
}
