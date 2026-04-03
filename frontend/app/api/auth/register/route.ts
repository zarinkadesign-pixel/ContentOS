import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getUserByEmail, getUsers, saveUsers } from "@/lib/kv";
import { createProdamusLink } from "@/lib/prodamus";
import { appendUserToSheet } from "@/lib/sheets";
import { notifyNewPaidUser } from "@/lib/telegram";
import crypto from "crypto";

const PLAN_NAMES: Record<string, string> = {
  hub_monthly:    "Хаб — ежемесячно",
  hub_yearly:     "Хаб — ежегодно",
  studio_monthly: "Студия — ежемесячно",
  studio_yearly:  "Студия — ежегодно",
};

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, plan } = await req.json();
    if (!email || !password || !name || !plan) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
    }

    const validPlans = ["hub_monthly", "hub_yearly", "studio_monthly", "studio_yearly"];
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: "Неверный план" }, { status: 400 });
    }

    const role = plan.startsWith("hub") ? "hub" : "studio";
    const { hash, salt } = hashPassword(password);
    const userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const now = new Date().toISOString();
    const orderId = `${plan}_${userId}_${Date.now()}`;

    const users = await getUsers();
    users.push({
      id: userId,
      email: normalizedEmail,
      name: name.trim(),
      password_hash: hash,
      password_salt: salt,
      role,
      plan,
      plan_expires_at: null,
      plan_active: false,
      created_at: now,
      last_login: null,
    });
    await saveUsers(users);

    const dateStr = new Date().toLocaleDateString("ru");
    const planLabel = PLAN_NAMES[plan] ?? plan;

    // Export to Google Sheets (fire-and-forget, never throws)
    void appendUserToSheet({
      date: dateStr,
      name: name.trim(),
      email: normalizedEmail,
      plan: planLabel,
      status: "Ожидает оплаты",
    });

    // Telegram notification to admin
    void notifyNewPaidUser({ name: name.trim(), email: normalizedEmail, plan: planLabel, createdAt: dateStr });

    // Generate Prodamus payment link
    const paymentUrl = createProdamusLink({ email: normalizedEmail, plan, orderId });

    return NextResponse.json({
      user: { id: userId, email: normalizedEmail, name: name.trim(), role },
      paymentUrl: paymentUrl || null,
      orderId,
    });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
