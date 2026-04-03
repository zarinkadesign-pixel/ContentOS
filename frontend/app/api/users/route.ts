import { NextRequest, NextResponse } from "next/server";
import { verifyToken, isAdmin } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/kv";

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get("contentOS_token")?.value;
  if (!token) return false;
  const payload = verifyToken(token);
  return payload && isAdmin(payload);
}

// GET — list all users (admin only)
export async function GET(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await getUsers();
  // Don't return password hashes
  return NextResponse.json(
    users.map(({ password_hash, password_salt, ...u }) => u)
  );
}

// PATCH — update user plan_active or plan_expires_at (admin only)
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, plan_active, plan_expires_at, plan } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (typeof plan_active === "boolean") users[idx].plan_active = plan_active;
  if (plan_expires_at !== undefined) users[idx].plan_expires_at = plan_expires_at;
  if (plan !== undefined) {
    users[idx].plan = plan;
    users[idx].role = plan?.startsWith("hub") ? "hub" : plan?.startsWith("studio") ? "studio" : users[idx].role;
  }

  await saveUsers(users);
  const { password_hash, password_salt, ...safe } = users[idx];
  return NextResponse.json(safe);
}

// DELETE — delete a user (admin only)
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const users = await getUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  await saveUsers(filtered);
  return NextResponse.json({ ok: true });
}
