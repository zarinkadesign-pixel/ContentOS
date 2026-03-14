"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/main.py
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware, Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import TelegramObject, Update
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from aiohttp import web
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent))

from core.config import get_config
from core.models import LeadStatus, RealtorStatus
from sheets.repository import SheetRepo
from poster.scheduler import RandomScheduler
from bot.landlord_fsm import router as landlord_router
from bot.admin_handlers import router as admin_router
from bot.tenant_handlers import router as tenant_router
from export.excel_exporter import send_xlsx_to_admin

MINIAPP_URL = os.getenv("MINIAPP_URL", "https://your-app.up.railway.app")


# ── Service Account decode (Railway deploy) ───────────────────────────────────

def _decode_service_account_if_needed() -> None:
    """
    Decodes the GOOGLE_SA_B64 environment variable and writes it as
    secrets/service_account.json.  Used on Railway where the filesystem
    is ephemeral between deploys.
    """
    b64 = os.getenv("GOOGLE_SA_B64", "")
    if not b64:
        return
    sa_path = Path("secrets/service_account.json")
    if sa_path.exists():
        return  # Already present — do not overwrite
    sa_path.parent.mkdir(parents=True, exist_ok=True)
    decoded = base64.b64decode(b64).decode()
    json.loads(decoded)  # Validate JSON before writing to disk
    sa_path.write_text(decoded)
    logger.info("[main] service_account.json decoded from GOOGLE_SA_B64")


# ── Dependency Injection Middleware ───────────────────────────────────────────

class DIMiddleware(BaseMiddleware):
    """
    Injects shared singletons (repo, cfg, bot, …) into every
    handler via aiogram's data dict.  Handlers declare dependencies
    as typed keyword arguments — aiogram resolves them automatically.
    """

    def __init__(self, **deps: Any) -> None:
        self._deps = deps

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        data.update(self._deps)
        return await handler(event, data)


# ── Mini App aiohttp server ───────────────────────────────────────────────────

async def make_api_app(repo: SheetRepo) -> web.Application:
    """
    Lightweight aiohttp server for the Telegram Mini App.

    Routes:
        GET /              -> Mini App HTML (miniapp/index.html)
        GET /api/listings  -> JSON array of published listings (CORS: *)
    """
    app = web.Application()
    miniapp_html = Path("miniapp/index.html").read_text(encoding="utf-8")

    async def handle_root(request: web.Request) -> web.Response:  # noqa: ARG001
        return web.Response(text=miniapp_html, content_type="text/html")

    async def handle_listings(request: web.Request) -> web.Response:  # noqa: ARG001
        listings = repo.get_posted_listings()
        payload = [
            {
                "external_id":       lst.external_id,
                "rooms":             lst.rooms,
                "area":              lst.area,
                "floor":             lst.floor,
                "total_floors":      lst.total_floors,
                "price":             lst.price,
                "district":          lst.district,
                "address":           lst.address,
                "description":       lst.description[:300] if lst.description else "",
                "amenities":         lst.amenities,
                "photos":            lst.photos[:3],
                "landlord_phone":    lst.landlord_phone,
                "landlord_username": lst.landlord_username,
                "deposit":           lst.deposit,
                "contract_months":   lst.contract_months,
                "created_at":        lst.created_at.isoformat() if lst.created_at else "",
            }
            for lst in listings
        ]
        return web.json_response(payload, headers={"Access-Control-Allow-Origin": "*"})

    app.router.add_get("/", handle_root)
    app.router.add_get("/api/listings", handle_listings)
    return app


# ── Automated background jobs ─────────────────────────────────────────────────

async def auto_check_violations(repo: SheetRepo, bot: Bot, cfg) -> None:
    """
    Runs every hour.  Finds realtors who exceeded the viewing deadline
    and records a violation.

    Escalation rules (configured via env vars):
        violations >= FREEZE_ON_VIOLATION  -> status = FROZEN
        violations >= BAN_ON_VIOLATION     -> status = BANNED
    """
    now = datetime.utcnow()
    leads = repo.get_all_leads_by_status(LeadStatus.ASSIGNED)

    for lead in leads:
        if not lead.assigned_at:
            continue
        hours_elapsed = (now - lead.assigned_at).total_seconds() / 3600
        if hours_elapsed <= cfg.realtor.viewing_deadline_hours:
            continue

        realtor = repo.get_realtor(lead.assigned_realtor_tg_id)
        if not realtor:
            continue

        realtor.violations += 1
        _apply_violation_rules(realtor, cfg)
        repo.update_realtor(realtor)

        try:
            await bot.send_message(
                realtor.tg_id,
                f"⚠️ <b>Violation!</b> Lead <code>{lead.external_id}</code> was not processed "
                f"within {cfg.realtor.viewing_deadline_hours} h.\n"
                f"Total violations: <b>{realtor.violations}</b>. "
                f"Status: <b>{realtor.status.value}</b>",
                parse_mode=ParseMode.HTML,
            )
        except Exception as exc:
            logger.warning(
                f"[violation] Could not notify realtor {realtor.tg_id}: {exc}"
            )

        logger.info(
            f"[violation] Realtor {realtor.tg_id} — "
            f"violation #{realtor.violations} for lead {lead.external_id}"
        )


def _apply_violation_rules(realtor, cfg) -> None:
    """
    Deducts rating and escalates realtor status based on violation count.
    Called synchronously inside auto_check_violations.
    """
    realtor.rating = max(0.0, realtor.rating - 10.0)

    if realtor.violations >= cfg.realtor.ban_on_violation:
        realtor.status = RealtorStatus.BANNED
    elif realtor.violations >= cfg.realtor.freeze_on_violation:
        realtor.status = RealtorStatus.FROZEN
        realtor.frozen_until = datetime.utcnow() + timedelta(
            days=cfg.realtor.freeze_days
        )


async def auto_unfreeze_realtors(repo: SheetRepo, bot: Bot) -> None:
    """Runs every 6 hours. Restores ACTIVE status for realtors whose freeze has expired."""
    now = datetime.utcnow()

    for realtor in repo.get_all_realtors():
        if realtor.status != RealtorStatus.FROZEN:
            continue
        if not realtor.frozen_until or realtor.frozen_until > now:
            continue

        realtor.status = RealtorStatus.ACTIVE
        realtor.frozen_until = None
        repo.update_realtor(realtor)

        try:
            await bot.send_message(
                realtor.tg_id,
                "✅ <b>Freeze lifted!</b> You can now receive new leads again.",
                parse_mode=ParseMode.HTML,
            )
        except Exception as exc:
            logger.warning(f"[unfreeze] Could not notify realtor {realtor.tg_id}: {exc}")

        logger.info(f"[unfreeze] Realtor {realtor.tg_id} unfrozen")


async def auto_daily_report(bot: Bot, repo: SheetRepo, cfg) -> None:
    """Runs daily at 09:00 Astana time. Sends Excel report to all admins."""
    all_listings = (
        repo.get_pending_listings()
        + repo.get_approved_listings()
        + repo.get_posted_listings()
    )

    for admin_id in cfg.telegram.admin_ids:
        try:
            await send_xlsx_to_admin(bot, admin_id, all_listings)
            logger.info(f"[report] Daily report delivered to admin {admin_id}")
        except Exception as exc:
            logger.error(f"[report] Failed to deliver report to {admin_id}: {exc}")


# ── Entry Point ───────────────────────────────────────────────────────────────

async def main() -> None:
    # Structured logging: coloured stderr + rotating file
    logger.remove()
    logger.add(
        sys.stderr,
        format="<green>{time:HH:mm:ss}</green> | <level>{level:<7}</level> | {message}",
        level="INFO",
    )
    Path("logs").mkdir(exist_ok=True)
    logger.add(
        "logs/bot_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="14 days",
        level="DEBUG",
    )

    _decode_service_account_if_needed()

    cfg = get_config()

    # Google Sheets repository
    repo = SheetRepo(cfg.sheets)
    repo.connect()

    # Telegram bot + dispatcher
    bot = Bot(
        token=cfg.telegram.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=MemoryStorage())

    # Wire dependency injection
    dp.update.outer_middleware(
        DIMiddleware(
            repo=repo,
            cfg=cfg,
            admin_ids=cfg.telegram.admin_ids,
            bot=bot,
            miniapp_url=MINIAPP_URL,
        )
    )

    # Register routers (order matters: tenant first for /start)
    dp.include_router(tenant_router)
    dp.include_router(landlord_router)
    dp.include_router(admin_router)

    # Scheduler
    posting_scheduler = RandomScheduler(bot=bot, repo=repo, cfg=cfg)
    ap = AsyncIOScheduler(timezone="Asia/Almaty")
    ap.add_job(
        posting_scheduler.tick, "interval", minutes=15,
        id="post", max_instances=1,
    )
    ap.add_job(repo.refresh_caches, "interval", hours=1, id="cache")
    ap.add_job(
        auto_check_violations, "interval", hours=1,
        id="violations", max_instances=1, args=[repo, bot, cfg],
    )
    ap.add_job(
        auto_unfreeze_realtors, "interval", hours=6,
        id="unfreeze", args=[repo, bot],
    )
    ap.add_job(
        auto_daily_report, "cron", hour=9, minute=0,
        id="daily_report", args=[bot, repo, cfg],
    )
    ap.start()

    # Mini App HTTP server
    api_app = await make_api_app(repo)
    runner = web.AppRunner(api_app)
    await runner.setup()
    port = int(os.getenv("PORT", 8080))
    await web.TCPSite(runner, "0.0.0.0", port).start()

    logger.info(
        f"[main] Bot started\n"
        f"  Mini App : http://0.0.0.0:{port}/api/listings\n"
        f"  Channel  : {cfg.telegram.channel_id}\n"
        f"  Admins   : {cfg.telegram.admin_ids}"
    )

    # Run first posting tick immediately on startup
    await posting_scheduler.tick()

    try:
        await dp.start_polling(bot, allowed_updates=Update.all_event_names())
    finally:
        ap.shutdown()
        await runner.cleanup()
        await bot.session.close()
        logger.info("[main] Bot stopped")


if __name__ == "__main__":
    asyncio.run(main())
