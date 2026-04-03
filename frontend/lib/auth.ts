import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "contentOS_jwt_secret_dev";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "hub" | "studio" | "demo" | "free";
  plan: string | null;
  plan_expires_at: string | null;
  iat: number;
  exp: number;
}

// ── Password hashing ──────────────────────────────────────────────────────────
export function hashPassword(
  password: string,
  salt?: string
): { hash: string; salt: string } {
  const s = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHmac("sha256", s).update(password).digest("hex");
  return { hash, salt: s };
}

export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
}

// ── JWT (manual, no external deps) ───────────────────────────────────────────
function base64urlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(data: string): string {
  const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function createToken(
  payload: Omit<TokenPayload, "iat" | "exp">
): string {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 30, // 30 days
  };
  const encodedPayload = base64urlEncode(JSON.stringify(fullPayload));
  const signingInput = `${header}.${encodedPayload}`;
  const sig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, encodedPayload, sig] = parts;
    const signingInput = `${header}.${encodedPayload}`;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(signingInput)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Access helpers ────────────────────────────────────────────────────────────
export function isAdmin(payload: TokenPayload): boolean {
  return payload.role === "admin";
}

export function isDemo(payload: TokenPayload): boolean {
  return payload.role === "demo";
}

export function isFree(payload: TokenPayload): boolean {
  return payload.role === "free";
}

export function canAccessHub(payload: TokenPayload): boolean {
  if (payload.role === "admin") return true;
  if (payload.role === "free") return true;
  if (payload.role !== "hub") return false;
  if (!payload.plan_expires_at) return false;
  return new Date(payload.plan_expires_at) > new Date();
}

export function canAccessStudio(payload: TokenPayload): boolean {
  if (payload.role === "admin") return true;
  if (payload.role === "free") return true;
  if (payload.role !== "studio") return false;
  if (!payload.plan_expires_at) return false;
  return new Date(payload.plan_expires_at) > new Date();
}
