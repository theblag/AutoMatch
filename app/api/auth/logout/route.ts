import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out" });
  res.cookies.set("automatch_session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return res;
}
