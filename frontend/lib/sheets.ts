/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/sheets.ts
 *
 * Google Sheets API v4 — Service Account auth.
 * Supports two auth modes:
 *   1. GOOGLE_SA_B64  — base64-encoded credentials.json  (recommended, Railway-friendly)
 *   2. GOOGLE_SA_EMAIL + GOOGLE_SA_PRIVATE_KEY           (legacy, split vars)
 *
 * Sheet ID env vars (checked in order):
 *   GOOGLE_SHEET_ID  → primary (from files-5.zip)
 *   GOOGLE_SHEETS_ID → legacy alias
 */

import crypto from "crypto";

const SCOPE    = "https://www.googleapis.com/auth/spreadsheets";
const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

// ── Token cache ────────────────────────────────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExp = 0;

// ── Auth ───────────────────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string | null> {
  if (_cachedToken && Date.now() < _tokenExp - 30_000) return _cachedToken;

  let email = "";
  let privateKey = "";

  // Mode 1: GOOGLE_SA_B64
  const b64 = process.env.GOOGLE_SA_B64 ?? "";
  if (b64) {
    try {
      const sa = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      email      = sa.client_email ?? "";
      privateKey = sa.private_key  ?? "";
    } catch {
      console.error("[sheets] Invalid GOOGLE_SA_B64");
      return null;
    }
  } else {
    // Mode 2: split env vars
    email      = process.env.GOOGLE_SA_EMAIL        ?? "";
    privateKey = (process.env.GOOGLE_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  }

  if (!email || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss:   email,
    scope: SCOPE,
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  })).toString("base64url");

  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const sig = sign.sign(privateKey, "base64url");
  const jwt = `${signingInput}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  if (!res.ok) { console.error("[sheets] OAuth failed"); return null; }
  const data = await res.json();
  if (!data.access_token) return null;

  _cachedToken = data.access_token;
  _tokenExp    = (now + 3600) * 1000;
  return _cachedToken;
}

function sheetId(): string {
  return process.env.GOOGLE_SHEET_ID ?? process.env.GOOGLE_SHEETS_ID ?? "";
}

// ── Core operations ────────────────────────────────────────────────────────────
export async function sheetsAppend(spreadsheetId: string, range: string, rows: unknown[][]): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  const url    = `${BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}:append`;
  const params = new URLSearchParams({
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
  });

  const res = await fetch(`${url}?${params}`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[sheets] append error:", (err as any)?.error?.message);
  }
}

export async function sheetsRead(spreadsheetId: string, range: string): Promise<unknown[][]> {
  const token = await getAccessToken();
  if (!token) return [];
  const res  = await fetch(`${BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return (data as any).values ?? [];
}

export async function sheetsUpdate(spreadsheetId: string, range: string, rows: unknown[][]): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;
  await fetch(`${BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
    method:  "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body:    JSON.stringify({ values: rows }),
  });
}

// ── Named exports (used in API routes) ────────────────────────────────────────
export async function appendUserToSheet(row: {
  date: string; name: string; email: string; plan: string; status: string;
}): Promise<void> {
  const sid = sheetId();
  if (!sid) return;
  try {
    await sheetsAppend(sid, "Пользователи!A:E", [[row.date, row.name, row.email, row.plan, row.status]]);
  } catch (err) { console.error("[sheets] appendUserToSheet:", err); }
}

export async function appendBetaUserToSheet(row: {
  date: string; name: string; email: string; source: string;
}): Promise<void> {
  const sid = sheetId();
  if (!sid) return;
  try {
    await sheetsAppend(sid, "Бета-тестеры!A:D", [[row.date, row.name, row.email, row.source]]);
  } catch (err) { console.error("[sheets] appendBetaUserToSheet:", err); }
}

export async function exportGeneration(data: {
  email: string; module: string; platform?: string; tokensUsed: number; createdAt: Date;
}): Promise<void> {
  const sid = sheetId();
  if (!sid) return;
  try {
    await sheetsAppend(sid, "Генерации!A:F", [[
      data.createdAt.toLocaleString("ru"),
      data.email,
      data.module,
      data.platform ?? "",
      data.tokensUsed,
      new Date().toLocaleDateString("ru"),
    ]]);
  } catch (err) { console.error("[sheets] exportGeneration:", err); }
}

export async function exportContentPlan(userEmail: string, planItems: Array<{
  day: string; platform: string; type: string; topic: string; hook: string; cta: string;
}>): Promise<void> {
  const sid = sheetId();
  if (!sid) return;
  try {
    const rows = planItems.map((i) => [i.day, i.platform, i.type, i.topic, i.hook, i.cta, userEmail]);
    await sheetsAppend(sid, "КонтентПланы!A:G", rows);
  } catch (err) { console.error("[sheets] exportContentPlan:", err); }
}
