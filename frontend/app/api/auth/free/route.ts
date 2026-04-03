import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { getUserByEmail, getUsers, saveUsers, User } from "@/lib/kv";
import { appendUserToSheet, appendBetaUserToSheet } from "@/lib/sheets";
import { notifyNewFreeUser, notifyNewBetaUser } from "@/lib/telegram";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Имя и email обязательны" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!normalizedEmail.includes("@")) {
      return NextResponse.json({ error: "Введите корректный email" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await getUserByEmail(normalizedEmail);

    if (existing) {
      if (existing.role === "free") {
        // Free user already exists — just log them in, update last_login
        const users = await getUsers();
        const idx = users.findIndex((u) => u.id === existing.id);
        if (idx !== -1) {
          users[idx].last_login = new Date().toISOString();
          await saveUsers(users);
        }

        const token = createToken({
          sub: existing.id,
          email: existing.email,
          name: existing.name,
          role: "free",
          plan: "free",
          plan_expires_at: null,
        });

        const res = NextResponse.json({
          user: { id: existing.id, email: existing.email, name: existing.name, role: "free" },
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

      // Paid or admin user already exists with this email
      return NextResponse.json(
        { error: "Этот email уже зарегистрирован. Войдите с паролем." },
        { status: 409 }
      );
    }

    // Create new free user
    const userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      email: normalizedEmail,
      name: trimmedName,
      password_hash: "",
      password_salt: "",
      role: "free",
      plan: "free",
      plan_expires_at: null,
      plan_active: true,
      created_at: now,
      last_login: now,
    };

    const users = await getUsers();
    users.push(newUser);
    await saveUsers(users);

    const dateStr = new Date().toLocaleDateString("ru");

    // Export to Google Sheets (fire-and-forget)
    void appendUserToSheet({
      date: dateStr,
      name: trimmedName,
      email: normalizedEmail,
      plan: "Бесплатный",
      status: "Активен",
    });

    // Separate beta-testers sheet
    void appendBetaUserToSheet({
      date: dateStr,
      name: trimmedName,
      email: normalizedEmail,
      source: "free",
    });

    // Telegram notification to admin
    void notifyNewFreeUser({ name: trimmedName, email: normalizedEmail, createdAt: dateStr });
    void notifyNewBetaUser({ name: trimmedName, email: normalizedEmail, createdAt: dateStr });

    const token = createToken({
      sub: userId,
      email: normalizedEmail,
      name: trimmedName,
      role: "free",
      plan: "free",
      plan_expires_at: null,
    });

    const res = NextResponse.json({
      user: { id: userId, email: normalizedEmail, name: trimmedName, role: "free" },
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
  } catch (err) {
    console.error("[auth/free]", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
