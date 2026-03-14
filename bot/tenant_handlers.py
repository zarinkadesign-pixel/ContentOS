"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/bot/tenant_handlers.py
"""

from __future__ import annotations

from datetime import datetime

from aiogram import F, Router
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    WebAppInfo,
)
from loguru import logger

from bot.ai_search import apply_filters, extract_filters, format_search_results
from core.models import Lead, LeadStatus, ListingStatus
from sheets.repository import SheetRepo

router = Router()


# ── /start ────────────────────────────────────────────────────────────────────

@router.message(CommandStart())
async def cmd_start(message: Message, cfg, miniapp_url: str) -> None:
    """Main menu.  Mini App is opened via the Web App button."""
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🏠 Open apartment catalogue",
            web_app=WebAppInfo(url=miniapp_url),
        )],
        [
            InlineKeyboardButton(text="🔍 AI search",        callback_data="search:start"),
            InlineKeyboardButton(text="📋 Submit a request", callback_data="lead:new"),
        ],
        [InlineKeyboardButton(
            text="🏠 List your apartment",
            callback_data="landlord:start",
        )],
        [InlineKeyboardButton(
            text="🤝 Become a realtor",
            callback_data="realtor:register",
        )],
    ])
    await message.answer(
        "🏙 <b>Apartment rentals in Astana</b>\n\n"
        "Fresh listings from owners — no middlemen.\n\n"
        "✨ AI will find the best options for your query\n"
        "✨ A realtor will arrange a viewing for free\n"
        "✨ Catalogue updated every 30 minutes",
        reply_markup=kb,
        parse_mode=ParseMode.HTML,
    )


# ── AI search ─────────────────────────────────────────────────────────────────

class SearchState(StatesGroup):
    waiting_query   = State()
    showing_results = State()


@router.callback_query(F.data == "search:start")
async def cb_search_start(cb: CallbackQuery, state: FSMContext) -> None:
    await cb.answer()
    await cb.message.answer(
        "🔍 <b>AI-powered apartment search</b>\n\n"
        "Describe what you're looking for in plain language:\n\n"
        "<i>«2-room up to 200k Yesil»\n"
        "«studio with balcony not first floor»\n"
        "«3 rooms with parking up to 400 thousand»</i>",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="❌ Cancel", callback_data="search:cancel")],
        ]),
        parse_mode=ParseMode.HTML,
    )
    await state.set_state(SearchState.waiting_query)


@router.message(SearchState.waiting_query)
async def handle_search_query(
    message: Message,
    state: FSMContext,
    repo: SheetRepo,
    cfg,
) -> None:
    query = (message.text or "").strip()
    if not query or len(query) < 2:
        await message.answer("Please describe what you are looking for:")
        return

    loading = await message.answer("🤖 AI is analysing your query…")

    # Extract structured filters from natural language query
    search_filter = await extract_filters(query, cfg.claude_api_key)

    # Apply filters to published listings
    all_listings = repo.get_posted_listings()
    results = apply_filters(all_listings, search_filter)
    text = format_search_results(results, search_filter, "")

    await loading.delete()

    if not results:
        await message.answer(text, parse_mode=ParseMode.HTML)
        await state.clear()
        return

    # Action buttons for each result
    kb_rows = [
        [InlineKeyboardButton(
            text=(
                f"📅 {'Studio' if lst.rooms == 0 else f'{lst.rooms}-room'} · "
                f"{lst.price:,}".replace(",", " ") + " ₸ — book viewing"
            ),
            callback_data=f"lead:{lst.external_id}",
        )]
        for lst in results[:5]
    ]
    kb_rows.append([
        InlineKeyboardButton(text="🔍 New search",        callback_data="search:start"),
        InlineKeyboardButton(text="📋 Request a realtor", callback_data="lead:new"),
    ])

    await message.answer(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup(inline_keyboard=kb_rows),
    )
    await state.update_data(last_results=[lst.external_id for lst in results[:5]])
    await state.set_state(SearchState.showing_results)


@router.callback_query(F.data == "search:cancel")
async def cb_search_cancel(cb: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await cb.answer()
    await cb.message.delete()


# ── Lead (viewing booking) ────────────────────────────────────────────────────

class LeadState(StatesGroup):
    name         = State()
    phone        = State()
    desired_date = State()
    confirm      = State()


@router.callback_query(F.data.startswith("lead:"))
async def cb_lead_start(cb: CallbackQuery, state: FSMContext) -> None:
    """Starts the tenant data collection flow for a viewing request."""
    await cb.answer()
    listing_id = cb.data.split(":", 1)[1]
    if listing_id == "new":
        listing_id = ""

    await state.update_data(listing_id=listing_id)
    await cb.message.answer(
        "📅 <b>Book a viewing</b>\n\n"
        "What is your name?",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode=ParseMode.HTML,
    )
    await state.set_state(LeadState.name)


@router.message(LeadState.name)
async def lead_name(message: Message, state: FSMContext) -> None:
    await state.update_data(name=(message.text or "").strip())
    await message.answer(
        "📞 Your phone number:",
        reply_markup=ReplyKeyboardMarkup(
            keyboard=[[KeyboardButton(text="📱 Share contact", request_contact=True)]],
            resize_keyboard=True,
            one_time_keyboard=True,
        ),
    )
    await state.set_state(LeadState.phone)


@router.message(LeadState.phone, F.contact)
async def lead_phone_contact(message: Message, state: FSMContext) -> None:
    await state.update_data(phone=message.contact.phone_number)
    await _ask_date(message, state)


@router.message(LeadState.phone)
async def lead_phone_text(message: Message, state: FSMContext) -> None:
    await state.update_data(phone=(message.text or "").strip())
    await _ask_date(message, state)


async def _ask_date(message: Message, state: FSMContext) -> None:
    await message.answer(
        "📆 When would you like to view the apartment?",
        reply_markup=ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="Today"),     KeyboardButton(text="Tomorrow")],
                [KeyboardButton(text="This week"), KeyboardButton(text="Next week")],
            ],
            resize_keyboard=True,
            one_time_keyboard=True,
        ),
    )
    await state.set_state(LeadState.desired_date)


@router.message(LeadState.desired_date)
async def lead_date(message: Message, state: FSMContext) -> None:
    await state.update_data(desired_date=(message.text or "").strip())
    data = await state.get_data()

    await message.answer(
        f"✅ <b>Confirm your request:</b>\n\n"
        f"👤 {data['name']}\n"
        f"📞 {data['phone']}\n"
        f"📆 {data['desired_date']}",
        reply_markup=ReplyKeyboardMarkup(
            keyboard=[
                [KeyboardButton(text="✅ Confirm")],
                [KeyboardButton(text="❌ Cancel")],
            ],
            resize_keyboard=True,
            one_time_keyboard=True,
        ),
        parse_mode=ParseMode.HTML,
    )
    await state.set_state(LeadState.confirm)


@router.message(LeadState.confirm, F.text == "✅ Confirm")
async def lead_confirm(
    message: Message,
    state: FSMContext,
    repo: SheetRepo,
    cfg,
    bot,
) -> None:
    data = await state.get_data()
    await state.clear()

    lead = Lead(
        listing_external_id=data.get("listing_id", ""),
        tenant_tg_id=message.from_user.id,
        tenant_name=data.get("name", ""),
        tenant_phone=data.get("phone", ""),
        desired_date=data.get("desired_date", ""),
        status=LeadStatus.NEW,
    )

    try:
        lead = repo.add_lead(lead)
    except Exception as exc:
        logger.error(f"[tenant] Failed to save lead: {exc}")
        await message.answer(
            "⚠️ Save error. Please try again later.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    await message.answer(
        f"🎉 <b>Request accepted!</b>\n\n"
        f"Request ID: <code>{lead.external_id}</code>\n\n"
        "A realtor will contact you within 2 hours "
        "to arrange a convenient viewing time. ✅",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode=ParseMode.HTML,
    )

    await _dispatch_lead(bot, repo, lead, cfg)


@router.message(LeadState.confirm, F.text == "❌ Cancel")
async def lead_cancel(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Request cancelled.", reply_markup=ReplyKeyboardRemove())


# ── Lead dispatcher ───────────────────────────────────────────────────────────

async def _dispatch_lead(bot, repo: SheetRepo, lead: Lead, cfg) -> None:
    """
    Assigns the lead to the best available realtor.

    Selection criteria: status ACTIVE, highest rating, district preference.
    Falls back to notifying all admins if no realtors are available.
    """
    realtors = repo.get_active_realtors()

    if not realtors:
        logger.warning(f"[dispatch] No active realtors for lead {lead.external_id}")
        for admin_id in cfg.telegram.admin_ids:
            try:
                await bot.send_message(
                    admin_id,
                    f"⚠️ <b>No realtors available!</b> "
                    f"Lead {lead.external_id} could not be assigned.\n"
                    f"Tenant: {lead.tenant_name} · {lead.tenant_phone}",
                    parse_mode=ParseMode.HTML,
                )
            except Exception as exc:
                logger.warning(f"[dispatch] Could not notify admin {admin_id}: {exc}")
        return

    # Choose the highest-rated realtor
    realtors.sort(key=lambda r: -r.rating)
    chosen = realtors[0]

    # Update lead status
    lead.status = LeadStatus.ASSIGNED
    lead.assigned_realtor_tg_id = chosen.tg_id
    lead.assigned_at = datetime.utcnow()
    repo.update_lead_status(lead)

    # Increment realtor lead counter
    chosen.leads_total += 1
    repo.update_realtor(chosen)

    # Build listing summary for the realtor card
    listing_info = ""
    if lead.listing_external_id:
        lst = repo.get_listing_by_id(lead.listing_external_id)
        if lst:
            rooms_label  = "Studio" if lst.rooms == 0 else f"{lst.rooms}-room"
            price_str    = f"{lst.price:,}".replace(",", " ")
            listing_info = (
                f"\n\n🏠 <b>Property:</b> {rooms_label} · {lst.address}\n"
                f"💰 {price_str} ₸/month"
            )

    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="✅ Accepted",
                callback_data=f"rl:accept:{lead.external_id}",
            ),
            InlineKeyboardButton(
                text="❌ Decline",
                callback_data=f"rl:decline:{lead.external_id}",
            ),
        ],
        [InlineKeyboardButton(
            text=f"📞 {lead.tenant_phone}",
            url=f"https://t.me/+{lead.tenant_phone.replace('+', '').replace(' ', '')}",
        )],
    ])

    try:
        await bot.send_message(
            chat_id=chosen.tg_id,
            text=(
                f"📋 <b>New viewing request!</b>\n\n"
                f"👤 Tenant: {lead.tenant_name}\n"
                f"📞 {lead.tenant_phone}\n"
                f"📆 Preferred time: {lead.desired_date}"
                f"{listing_info}\n\n"
                f"⚡️ Lead ID: <code>{lead.external_id}</code>\n"
                f"Contact the tenant within <b>2 hours</b>!"
            ),
            reply_markup=kb,
            parse_mode=ParseMode.HTML,
        )
        logger.info(
            f"[dispatch] Lead {lead.external_id} assigned to realtor {chosen.tg_id}"
        )
    except Exception as exc:
        logger.error(f"[dispatch] Could not reach realtor {chosen.tg_id}: {exc}")


# ── Realtor response callbacks ────────────────────────────────────────────────

@router.callback_query(F.data.startswith("rl:accept:"))
async def cb_realtor_accept(cb: CallbackQuery, repo: SheetRepo) -> None:
    lead_id = cb.data.split(":", 2)[2]
    await cb.answer("✅ Lead accepted!")
    await cb.message.edit_reply_markup(
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🏁 Record outcome",
                callback_data=f"rl:result:{lead_id}",
            ),
        ]])
    )


@router.callback_query(F.data.startswith("rl:result:"))
async def cb_realtor_result(cb: CallbackQuery) -> None:
    lead_id = cb.data.split(":", 2)[2]
    await cb.answer()
    await cb.message.answer(
        "📊 What was the outcome of the viewing?",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="🎉 Apartment rented!",
                callback_data=f"rl:rented:{lead_id}",
            )],
            [InlineKeyboardButton(
                text="😔 Did not suit",
                callback_data=f"rl:nomatch:{lead_id}",
            )],
            [InlineKeyboardButton(
                text="❌ Tenant cancelled",
                callback_data=f"rl:cancelled:{lead_id}",
            )],
        ]),
    )


@router.callback_query(F.data.startswith("rl:rented:"))
async def cb_realtor_rented(
    cb: CallbackQuery,
    repo: SheetRepo,
    cfg,
    bot,
) -> None:
    """Realtor confirms a successful rental — triggers commission flow."""
    await cb.answer("🎉 Congratulations!")
    await cb.message.answer(
        "🎉 <b>Congratulations on closing the deal!</b>\n\n"
        "Please send a photo of the signed lease agreement "
        "and specify the agreed monthly rent (in KZT):",
        parse_mode=ParseMode.HTML,
    )
    # Commission collection FSM continues in commission_fsm.py


@router.callback_query(F.data.startswith("rl:decline:"))
async def cb_realtor_decline(
    cb: CallbackQuery, repo: SheetRepo, cfg, bot
) -> None:
    """Realtor declines the lead — reassignment to next realtor is a TODO."""
    await cb.answer("Lead passed to another realtor")
    await cb.message.edit_reply_markup(reply_markup=None)
    # TODO: re-assign to the next highest-rated realtor


# ── Similar listings (channel inline button) ──────────────────────────────────

@router.callback_query(F.data.startswith("similar:"))
async def cb_similar(cb: CallbackQuery, repo: SheetRepo) -> None:
    """Finds similar listings by room count and district."""
    await cb.answer()
    parts    = cb.data.split(":")
    rooms    = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
    district = parts[2] if len(parts) > 2 else ""

    all_posted = repo.get_posted_listings()
    scored = []
    for lst in all_posted:
        score = 0
        if rooms is not None and lst.rooms == rooms:
            score += 3
        if district and lst.district and district.lower() in lst.district.lower():
            score += 2
        if score > 0:
            scored.append((score, lst))

    scored.sort(key=lambda x: -x[0])
    similar = [lst for _, lst in scored[:5]]

    if not similar:
        await cb.message.answer(
            "😔 No similar listings yet. New ones appear every hour!"
        )
        return

    lines = [f"🔍 <b>Similar listings ({len(similar)}):</b>\n"]
    for lst in similar:
        rooms_label = "Studio" if lst.rooms == 0 else f"{lst.rooms}-room"
        price_str   = f"{lst.price:,}".replace(",", " ")
        lines.append(f"• {rooms_label} · {price_str} ₸ · {lst.district or lst.address}")

    await cb.message.answer(
        "\n".join(lines),
        parse_mode=ParseMode.HTML,
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="🔍 AI search",        callback_data="search:start"),
            InlineKeyboardButton(text="📋 Submit a request", callback_data="lead:new"),
        ]]),
    )
