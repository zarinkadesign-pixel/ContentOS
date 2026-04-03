import { NextRequest, NextResponse } from "next/server";
import { createProdamusLink } from "@/lib/prodamus";
import { randomUUID } from "crypto";

// POST — generate a Prodamus payment link for any custom product
export async function POST(req: NextRequest) {
  const { productName, price, currency = "USD", customerEmail = "", orderId } = await req.json();

  if (!productName || !price) {
    return NextResponse.json({ error: "productName and price required" }, { status: 400 });
  }

  const shop = process.env.PRODAMUS_SHOP ?? "";
  const key  = process.env.PRODAMUS_KEY  ?? "";

  // Demo mode — return a placeholder link
  if (!shop || !key) {
    return NextResponse.json({
      url:   `https://pay.example.com/demo?product=${encodeURIComponent(productName)}&price=${price}`,
      demo:  true,
      note:  "Демо-режим. Добавь PRODAMUS_SHOP и PRODAMUS_KEY для реальных ссылок.",
    });
  }

  const oid  = orderId ?? `order_${randomUUID()}`;
  const plan = `custom_${oid}`;

  // Use existing Prodamus link builder with dynamic params
  import("crypto").then(async (crypto) => {
    // Build custom link directly
    const params: Record<string, string> = {
      "customer_email": customerEmail,
      "order_id":       oid,
      "products[0][name]":     productName,
      "products[0][price]":    String(price),
      "products[0][quantity]": "1",
    };
    const sorted = Object.keys(params).sort();
    const qs     = sorted.map((k) => `${k}=${params[k]}`).join("&");
    const sign   = crypto.createHmac("sha256", key).update(qs).digest("hex");

    const url =
      `https://pay.prodamus.ru/${encodeURIComponent(shop)}/` +
      `?products[0][price]=${price}` +
      `&products[0][quantity]=1` +
      `&products[0][name]=${encodeURIComponent(productName)}` +
      `&customer_email=${encodeURIComponent(customerEmail)}` +
      `&order_id=${encodeURIComponent(oid)}` +
      `&sys=${sign}`;

    return NextResponse.json({ url, orderId: oid });
  });

  // Synchronous fallback using prodamus lib
  const url = createProdamusLink({ email: customerEmail, plan, orderId: oid });
  return NextResponse.json({ url: url || "#", orderId: oid });
}
