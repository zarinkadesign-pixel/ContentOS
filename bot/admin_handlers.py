"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/bot/admin_handlers.py
"""

from __future__ import annotations

from aiogram import Bot, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)
from loguru import logger

from core.config import AppConfig
from core.models import ListingStatus, RealtorStatus
from sheets.repository import SheetRepo

router = Router()


def _is_admin(user_id: int, cfg: AppConfig) -> bool:
    """Returns True if the given Telegram user_id has admin privileges."""
    return user_id in cfg.telegram.admin_ids


# ── /stats ────────────────────────────────────────────────────────────────────

@router.message(Command("stats"))
async def cmd_stats(message: Message, repo: SheetRepo, cfg: AppConfig) -> None:
    """Displays a platform overview: listing counts and active realtor count."""
    if not _is_admin(message.from_user.id, cfg):
        return

    pending  = repo.get_pending_listings()
    approved = repo.get_approved_listings()
    posted   = repo.get_posted_listings()
    realtors = repo.get_active_realtors()

    await message.answer(
        "📊 <b>Platform statistics</b>\n\n"
        f"🕐 Awaiting moderation: <b>{len(pending)}</b>\n"
        f"✅ Approved (queued): <b>{len(approved)}</b>\n"
        f"📢 Published: <b>{len(posted)}</b>\n"
        f"🤝 Active realtors: <b>{len(realtors)}</b>\n\n"
        "Commands:\n"
        "/pending — listings awaiting review\n"
        "/realtors — manage realtors",
        parse_mode=ParseMode.HTML,
    )


# ── /pending ──────────────────────────────────────────────────────────────────

@router.message(Command("pending"))
async def cmd_pending(message: Message, repo: SheetRepo, cfg: AppConfig) -> None:
    """Shows up to 5 listings awaiting moderation with Approve/Reject buttons."""
    if not _is_admin(message.from_user.id, cfg):
        return

    listings = repo.get_pending_listings()
    if not listings:
        await message.answer("✅ No listings awaiting moderation")
        return

    for lst in listings[:5]:
        rooms_label = "Studio" if lst.rooms == 0 else f"{lst.rooms}-room"
        price_str   = f"{lst.price:,}".replace(",", " ")
        text = (
            f"📋 <b>ID: {lst.external_id}</b>\n"
            f"{rooms_label} · {lst.area} m² · {lst.district}\n"
            f"{lst.address}\n"
            f"💰 {price_str} ₸/month\n"
            f"👤 {lst.landlord_name} · {lst.landlord_phone}\n"
            f"📸 {len(lst.photos)} photo(s)"
        )
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="✅ Approve",
                callback_data=f"mod:approve:{lst.external_id}",
            ),
            InlineKeyboardButton(
                text="❌ Reject",
                callback_data=f"mod:reject:{lst.external_id}",
            ),
        ]])
        if lst.photos:
            await message.answer_photo(
                lst.photos[0], caption=text, reply_markup=kb, parse_mode=ParseMode.HTML
            )
        else:
            await message.answer(text, reply_markup=kb, parse_mode=ParseMode.HTML)


# ── Moderation callbacks ──────────────────────────────────────────────────────

@router.callback_query(F.data.startswith("mod:approve:"))
async def cb_approve(
    cb: CallbackQuery, repo: SheetRepo, cfg: AppConfig, bot: Bot
) -> None:
    """Approves a listing and notifies the landlord."""
    if not _is_admin(cb.from_user.id, cfg):
        await cb.answer("Access denied", show_alert=True)
        return

    external_id = cb.data.split(":", 2)[2]
    listing = repo.get_listing_by_id(external_id)
    if not listing:
        await cb.answer("Listing not found", show_alert=True)
        return
    if listing.status != ListingStatus.PENDING:
        await cb.answer(f"Already processed: {listing.status.value}", show_alert=True)
        return

    repo.update_listing_status(listing, ListingStatus.APPROVED)

    await cb.answer("✅ Approved!")
    original = cb.message.caption or cb.message.text or ""
    await cb.message.edit_caption(
        caption=original + "\n\n✅ <b>APPROVED</b>",
        reply_markup=None,
        parse_mode=ParseMode.HTML,
    )

    try:
        await bot.send_message(
            chat_id=listing.landlord_tg_id,
            text=(
                f"🎉 <b>Your listing has been approved!</b>\n\n"
                f"ID: <code>{listing.external_id}</code>\n\n"
                "It will be published in the channel shortly.\n"
                "When your apartment is rented, let us know: /rented"
            ),
            parse_mode=ParseMode.HTML,
        )
    except Exception as exc:
        logger.warning(
            f"[admin] Could not notify landlord {listing.landlord_tg_id}: {exc}"
        )

    logger.info(f"[admin] Approved: {external_id} by admin {cb.from_user.id}")


@router.callback_query(F.data.startswith("mod:reject:"))
async def cb_reject(
    cb: CallbackQuery, repo: SheetRepo, cfg: AppConfig, bot: Bot
) -> None:
    """Rejects a listing and notifies the landlord."""
    if not _is_admin(cb.from_user.id, cfg):
        await cb.answer("Access denied", show_alert=True)
        return

    external_id = cb.data.split(":", 2)[2]
    listing = repo.get_listing_by_id(external_id)
    if not listing:
        await cb.answer("Not found", show_alert=True)
        return

    repo.update_listing_status(listing, ListingStatus.REJECTED)
    await cb.answer("❌ Rejected")
    original = cb.message.caption or cb.message.text or ""
    await cb.message.edit_caption(
        caption=original + "\n\n❌ <b>REJECTED</b>",
        reply_markup=None,
        parse_mode=ParseMode.HTML,
    )

    try:
        await bot.send_message(
            chat_id=listing.landlord_tg_id,
            text=(
                "😔 Unfortunately your listing did not pass moderation.\n"
                "Please ensure photos are clear and the address is correct.\n"
                "Try again: /addlisting"
            ),
        )
    except Exception as exc:
        logger.warning(f"[admin] Could not notify landlord {listing.landlord_tg_id}: {exc}")

    logger.info(f"[admin] Rejected: {external_id} by admin {cb.from_user.id}")


# ── /rented — landlord marks apartment as rented ─────────────────────────────

@router.message(Command("rented"))
async def cmd_rented(message: Message, repo: SheetRepo, bot: Bot) -> None:
    """Landlord reports that their apartment has been rented."""
    user_id = message.from_user.id
    posted  = repo.get_posted_listings()
    mine    = [lst for lst in posted if lst.landlord_tg_id == user_id]

    if not mine:
        await message.answer(
            "You have no active listings. "
            "To add a new one: /addlisting"
        )
        return

    if len(mine) == 1:
        listing = mine[0]
        repo.update_listing_status(listing, ListingStatus.RENTED)
        await message.answer(
            f"✅ Listing <code>{listing.external_id}</code> has been removed.\n"
            "Congratulations on the successful rental! 🎉\n\n"
            "Want to list another apartment? /addlisting",
            parse_mode=ParseMode.HTML,
        )
        logger.info(f"[admin] Rented by landlord: {listing.external_id}")
        return

    # Multiple active listings — let the landlord choose
    kb_rows = [
        [InlineKeyboardButton(
            text=f"{lst.external_id} · {'Studio' if lst.rooms == 0 else f'{lst.rooms}-room'} · {lst.address[:25]}",
            callback_data=f"rented:{lst.external_id}",
        )]
        for lst in mine
    ]
    await message.answer(
        "Which of your listings was rented?",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=kb_rows),
    )


@router.callback_query(F.data.startswith("rented:"))
async def cb_rented(cb: CallbackQuery, repo: SheetRepo) -> None:
    """Handles landlord selecting which listing to mark as rented."""
    external_id = cb.data.split(":", 1)[1]
    listing = repo.get_listing_by_id(external_id)
    if not listing:
        await cb.answer("Not found", show_alert=True)
        return
    if listing.landlord_tg_id != cb.from_user.id:
        await cb.answer("This is not your listing", show_alert=True)
        return

    repo.update_listing_status(listing, ListingStatus.RENTED)
    await cb.answer("✅ Removed from publication!")
    await cb.message.edit_text(
        f"✅ Listing <code>{external_id}</code> removed. Congratulations! 🎉",
        parse_mode=ParseMode.HTML,
    )
    logger.info(f"[admin] Rented (callback): {external_id}")
