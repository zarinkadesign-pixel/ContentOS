import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("contentOS_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });
  }

  return NextResponse.json({
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    plan: payload.plan,
    plan_expires_at: payload.plan_expires_at,
  });
}
