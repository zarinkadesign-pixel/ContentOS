import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { notifyBug } from "@/lib/telegram";
import fs from "fs";
import path from "path";

// Bugs are written to a local file on the server (your laptop)
// Path: project root / bugs.log
const LOG_FILE = path.resolve(process.cwd(), "bugs.log");

function appendBugToFile(entry: object): void {
  try {
    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (err) {
    console.error("[bugs] Failed to write to file:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, stack, url, userAgent } = body;

    if (!message) return NextResponse.json({ ok: false }, { status: 400 });

    // Get user role from cookie (if logged in)
    const cookieStore = await cookies();
    const token = cookieStore.get("contentOS_token")?.value;
    const payload = token ? verifyToken(token) : null;
    const role = payload?.role ?? "anonymous";

    const timestamp = new Date().toISOString();

    const entry = {
      timestamp,
      role,
      url: url ?? "unknown",
      message: String(message).slice(0, 500),
      stack:   String(stack ?? "").slice(0, 1000),
      userAgent: String(userAgent ?? "").slice(0, 200),
    };

    // Write to local bugs.log file (stays on your machine)
    appendBugToFile(entry);

    // Send Telegram notification (fire-and-forget)
    void notifyBug({
      message:   entry.message,
      url:       entry.url,
      userAgent: entry.userAgent,
      role,
      timestamp,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bugs] handler error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
