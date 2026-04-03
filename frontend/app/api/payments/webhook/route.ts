import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getUsers, saveUsers } from "@/lib/kv";
import { PLAN_PRICES } from "@/lib/prodamus";
import { appendUserToSheet } from "@/lib/sheets";

const PLAN_NAMES: Record<string, string> = {
  hub_monthly:    "Хаб — ежемесячно",
  hub_yearly:     "Хаб — ежегодно",
  studio_monthly: "Студия — ежемесячно",
  studio_yearly:  "Студия — ежегодно",
};

const PLAN_DURATIONS: Record<string, number> = {
  hub_monthly: 30,
  hub_yearly: 365,
  studio_monthly: 30,
  studio_yearly: 365,
};

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const prodamusKey = process.env.PRODAMUS_KEY ?? "";

    // Verify Prodamus webhook signature
    const sysHeader = req.headers.get("sys") ?? req.headers.get("x-sys") ?? "";
    if (prodamusKey && sysHeader) {
      const expectedSig = crypto
        .createHmac("sha256", prodamusKey)
        .update(bodyText)
        .digest("hex");
      if (expectedSig !== sysHeader) {
        console.error("[payments/webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse webhook body (form-encoded or JSON)
    let data: Record<string, string> = {};
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = JSON.parse(bodyText);
    } else {
      const params = new URLSearchParams(bodyText);
      for (const [k, v] of params.entries()) {
        data[k] = v;
      }
    }

    const orderId = data["order_id"] ?? "";
    const customerEmail = (data["customer_email"] ?? "").toLowerCase();
    const paymentStatus = data["payment_status"] ?? data["status"] ?? "";

    if (!orderId || !customerEmail) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Only process successful payments
    if (!["success", "paid", "completed"].includes(paymentStatus.toLowerCase())) {
      return NextResponse.json({ ok: true, message: "Payment not successful, skipping" });
    }

    // Parse order: {plan}_{userId}_{timestamp}
    const parts = orderId.split("_");
    if (parts.length < 4) {
      return NextResponse.json({ error: "Invalid order_id format" }, { status: 400 });
    }

    // plan can be hub_monthly, hub_yearly, studio_monthly, studio_yearly (2 parts)
    // userId is user_{hex} (2 parts), timestamp is 1 part
    // Format: plan_part1_plan_part2_user_userId_timestamp  — reconstruct:
    // orderId = `${plan}_${userId}_${timestamp}` where plan = "hub_monthly" etc.
    // So: parts[0]_parts[1] = plan, parts[2]_parts[3] = userId, parts[4] = timestamp
    const plan = `${parts[0]}_${parts[1]}`;
    const userId = `${parts[2]}_${parts[3]}`;

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }

    const users = await getUsers();
    const idx = users.findIndex(
      (u) => u.id === userId || u.email === customerEmail
    );

    if (idx === -1) {
      console.error(`[payments/webhook] User not found: userId=${userId}, email=${customerEmail}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const durationDays = PLAN_DURATIONS[plan] ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    users[idx].plan = plan as any;
    users[idx].plan_active = true;
    users[idx].plan_expires_at = expiresAt.toISOString();
    users[idx].role = plan.startsWith("hub") ? "hub" : "studio";

    await saveUsers(users);
    console.log(`[payments/webhook] Activated plan ${plan} for user ${userId} until ${expiresAt.toISOString()}`);

    // Export to Google Sheets (fire-and-forget, never throws)
    void appendUserToSheet({
      date: new Date().toLocaleDateString("ru"),
      name: users[idx].name,
      email: customerEmail,
      plan: PLAN_NAMES[plan] ?? plan,
      status: "Оплачен",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payments/webhook]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
