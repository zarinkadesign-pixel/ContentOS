import crypto from "crypto";

// ── Plan metadata ─────────────────────────────────────────────────────────────
export const PLAN_PRICES: Record<string, number> = {
  hub_monthly: 29,
  hub_yearly: 249,
  studio_monthly: 15,
  studio_yearly: 129,
};

export const PLAN_NAMES: Record<string, string> = {
  hub_monthly: "ContentOS Хаб — Месяц",
  hub_yearly: "ContentOS Хаб — Год",
  studio_monthly: "ContentOS Студия — Месяц",
  studio_yearly: "ContentOS Студия — Год",
};

// ── Link builder ──────────────────────────────────────────────────────────────
interface ProdamusLinkParams {
  email: string;
  plan: string;
  orderId: string;
}

export function createProdamusLink({ email, plan, orderId }: ProdamusLinkParams): string {
  const shop = process.env.PRODAMUS_SHOP ?? "";
  const key = process.env.PRODAMUS_KEY ?? "";
  const price = PLAN_PRICES[plan];
  const name = PLAN_NAMES[plan] ?? plan;

  if (!shop || !key) return "";

  // Build sorted query string for signing
  const params: Record<string, string> = {
    "customer_email": email,
    "order_id": orderId,
    "products[0][name]": name,
    "products[0][price]": String(price),
    "products[0][quantity]": "1",
  };
  const sortedKeys = Object.keys(params).sort();
  const queryString = sortedKeys
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  const sign = crypto
    .createHmac("sha256", key)
    .update(queryString)
    .digest("hex");

  const encodedName = encodeURIComponent(name);
  const url =
    `https://pay.prodamus.ru/${encodeURIComponent(shop)}/` +
    `?products[0][price]=${price}` +
    `&products[0][quantity]=1` +
    `&products[0][name]=${encodedName}` +
    `&customer_email=${encodeURIComponent(email)}` +
    `&order_id=${encodeURIComponent(orderId)}` +
    `&sys=${sign}`;

  return url;
}
