/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/api/admin/setup/route.ts
 *
 * One-time admin account creation.
 * Works ONLY when no admin user exists yet.
 * POST { email, password, name }
 */
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getUsers, saveUsers } from "@/lib/kv";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const users = await getUsers();

  // Block if an admin already exists
  if (users.some((u) => u.role === "admin")) {
    return NextResponse.json(
      { error: "Admin already exists. Use login." },
      { status: 409 }
    );
  }

  const { email, password, name } = await req.json();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 });
  }

  const { hash, salt } = hashPassword(password);
  const adminUser = {
    id:              `admin_${crypto.randomBytes(8).toString("hex")}`,
    email:           email.trim().toLowerCase(),
    name:            name.trim(),
    password_hash:   hash,
    password_salt:   salt,
    role:            "admin" as const,
    plan:            null,
    plan_expires_at: null,
    plan_active:     true,
    created_at:      new Date().toISOString(),
    last_login:      null,
  };

  users.push(adminUser);
  await saveUsers(users);

  return NextResponse.json({ ok: true, id: adminUser.id, email: adminUser.email });
}
