import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST() {
  const token = createToken({
    sub: "demo",
    email: "demo@contentos.app",
    name: "Демо",
    role: "demo",
    plan: "demo",
    plan_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  const res = NextResponse.json({ redirectTo: "/dashboard" });
  res.cookies.set("contentOS_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  return res;
}
