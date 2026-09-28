import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  hashPassword,
  computeColdStartVector,
  vectorDataToArray,
  createSessionToken,
  type UserDemographics,
  type AuthUser,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      name,
      age,
      maritalStatus,
      locationType,
      primaryUsage,
      budgetMax,
    } = body;

    if (!email || !password || !name || !age || !maritalStatus || !locationType) {
      return NextResponse.json(
        { error: "Missing required registration fields" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1;
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const parsedAge = parseInt(age, 10) || 28;
    const parsedBudget = parseInt(budgetMax, 10) || 2500000;

    // 1. Insert User
    const [userRow] = await sql`
      INSERT INTO users (
        email, password_hash, name, age, marital_status, location_type, primary_usage, budget_max, profile_completed
      ) VALUES (
        ${email.toLowerCase().trim()},
        ${passwordHash},
        ${name.trim()},
        ${parsedAge},
        ${maritalStatus},
        ${locationType},
        ${primaryUsage || "Daily Commute"},
        ${parsedBudget},
        true
      )
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

    // 2. Compute Cold-Start Demographic Prior Vector
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

    // 3. Store initial vector in Neon DB using pgvector
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
      );
    `;

    // 4. Generate JWT session token
    const token = await createSessionToken(user);

    const res = NextResponse.json({
      success: true,
      user,
      vector: vectorData,
      message: "Account created and initialized with demographic priors in Neon DB",
    });

    // Set HTTP-only secure cookie
    res.cookies.set("automatch_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to register user" },
      { status: 500 },
    );
  }
}
