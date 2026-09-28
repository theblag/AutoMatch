import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name required for Google sign-in" },
        { status: 400 },
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already exists in Neon DB
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
      // 2. First-time Google user: Create account with profile_completed = false
      const [newRow] = await sql`
        INSERT INTO users (
          email, name, auth_provider, profile_completed
        ) VALUES (
          ${cleanEmail}, ${name.trim()}, 'google', false
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

    // 3. Create Session Token
    const token = await createSessionToken(user);

    const res = NextResponse.json({
      success: true,
      user,
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
    console.error("Google sign-in error:", err);
    return NextResponse.json(
      { error: err.message || "Failed Google authentication" },
      { status: 500 },
    );
  }
}
