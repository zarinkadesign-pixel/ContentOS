/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/telegram.ts
 *
 * Telegram Bot API wrapper.
 * Env vars: BOT_TOKEN (or TELEGRAM_BOT_TOKEN), TELEGRAM_ADMIN_CHAT_ID (or TELEGRAM_CHAT_ID)
 */

const TG_API = "https://api.telegram.org";

function token(): string {
  return process.env.BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN ?? "";
}
function adminChatId(): string {
  return process.env.TELEGRAM_ADMIN_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID ?? "";
}

// ── Core send ──────────────────────────────────────────────────────────────────
export async function tgSend(opts: {
  chatId:     string | number;
  text:       string;
  parseMode?: "HTML" | "Markdown";
  keyboard?:  Array<Array<{ text: string; callback_data?: string; url?: string }>>;
  silent?:    boolean;
}): Promise<void> {
  const tok = token();
  if (!tok || !opts.chatId) return;

  const body: Record<string, unknown> = {
    chat_id:              opts.chatId,
    text:                 opts.text,
    parse_mode:           opts.parseMode ?? "HTML",
    disable_notification: opts.silent ?? false,
  };

  if (opts.keyboard?.length) {
    body.reply_markup = { inline_keyboard: opts.keyboard };
  }

  try {
    await fetch(`${TG_API}/bot${tok}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(8_000),
    });
  } catch (err) {
    console.error("[telegram] send failed:", err);
  }
}

// ── Admin shortcut ─────────────────────────────────────────────────────────────
async function sendToAdmin(text: string): Promise<void> {
  const chatId = adminChatId();
  if (!chatId) return;
  await tgSend({ chatId, text });
}

// ── Registration notifications ─────────────────────────────────────────────────
export async function notifyNewFreeUser(data: { name: string; email: string; createdAt: string }): Promise<void> {
  await sendToAdmin(
    `🆓 <b>Новый бесплатный пользователь</b>\n` +
    `👤 Имя: ${data.name}\n📧 Email: ${data.email}\n🕐 Дата: ${data.createdAt}`
  );
}

export async function notifyNewBetaUser(data: { name: string; email: string; createdAt: string }): Promise<void> {
  await sendToAdmin(
    `🧪 <b>Новый бета-тестер</b>\n` +
    `👤 Имя: ${data.name}\n📧 Email: ${data.email}\n🕐 Дата: ${data.createdAt}`
  );
}

export async function notifyNewPaidUser(data: { name: string; email: string; plan: string; createdAt: string }): Promise<void> {
  await sendToAdmin(
    `💳 <b>Новая регистрация (платная)</b>\n` +
    `👤 Имя: ${data.name}\n📧 Email: ${data.email}\n📦 Тариф: ${data.plan}\n🕐 Дата: ${data.createdAt}`
  );
}

// ── Bug report ─────────────────────────────────────────────────────────────────
export async function notifyBug(data: {
  message:   string;
  url:       string;
  userAgent: string;
  role:      string;
  timestamp: string;
}): Promise<void> {
  await sendToAdmin(
    `🐛 <b>Баг в приложении</b>\n` +
    `📍 URL: ${data.url}\n❌ Ошибка: ${data.message.slice(0, 300)}\n` +
    `👤 Роль: ${data.role}\n🕐 Время: ${data.timestamp}\n` +
    `🖥 UA: ${data.userAgent.slice(0, 100)}`
  );
}

// ── Activity / generation notifications ───────────────────────────────────────
export async function notifyGeneration(data: {
  email:  string;
  module: string;
  timeMs: number;
}): Promise<void> {
  // Silent — only in verbose mode (don't spam admin for every generation)
  const chatId = adminChatId();
  if (!chatId) return;
  await tgSend({
    chatId,
    text:   `⚡ <b>${data.email}</b> — генерация [${data.module}] за ${data.timeMs}ms`,
    silent: true,
  });
}
