import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createToken } from "@/lib/auth";
import { getUserByEmail, saveUsers, getUsers } from "@/lib/kv";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ── Admin login ───────────────────────────────────────────────────────────
    const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? "";

    if (normalizedEmail === adminEmail && password === adminPassword) {
      const token = createToken({
        sub: "admin",
        email: adminEmail,
        name: "Admin",
        role: "admin",
        plan: null,
        plan_expires_at: null,
      });

      const res = NextResponse.json({
        user: { id: "admin", email: adminEmail, name: "Admin", role: "admin" },
        redirectTo: "/dashboard",
      });
      res.cookies.set("contentOS_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return res;
    }

    // ── Regular user login ────────────────────────────────────────────────────
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    // Free users have no password — reject with generic message
    if (!user.password_hash) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    const valid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    if (!user.plan_active) {
      return NextResponse.json({ error: "Подписка не активна. Оплатите план для доступа." }, { status: 403 });
    }

    // Update last_login
    const users = await getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      users[idx].last_login = new Date().toISOString();
      await saveUsers(users);
    }

    const token = createToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      plan_expires_at: user.plan_expires_at,
    });

    const redirectTo =
      user.role === "admin" ? "/dashboard" :
      user.role === "free"  ? "/dashboard" :
      user.role === "hub"   ? "/hub"        :
                              "/studio";
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      redirectTo,
    });
    res.cookies.set("contentOS_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
