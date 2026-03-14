"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/bot/landlord_fsm.py
"""

from __future__ import annotations

from typing import List

from aiogram import F, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command
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
)
from loguru import logger

from core.models import Listing, ListingStatus
from sheets.repository import SheetRepo

router = Router()

# ── UI constants ──────────────────────────────────────────────────────────────

DISTRICTS = [
    "Almaty", "Yesil", "Baikonur", "Saryarka",
    "Nura", "Kosshy (suburb)", "Other",
]

ROOMS_OPTIONS = ["Studio", "1", "2", "3", "4+"]

AMENITIES_OPTIONS = [
    "Wi-Fi", "Air conditioning", "Washing machine", "Dishwasher",
    "Parking", "Elevator", "Balcony", "Furniture", "Appliances", "Security",
]

SKIP_TEXT   = "⏭ Skip"
DONE_TEXT   = "✅ Done"
CANCEL_TEXT = "❌ Cancel"

FORM_TOTAL_STEPS = 13


# ── FSM state group ───────────────────────────────────────────────────────────

class LandlordForm(StatesGroup):
    name        = State()
    phone       = State()
    district    = State()
    address     = State()
    rooms       = State()
    area        = State()
    floor       = State()
    price       = State()
    deposit     = State()
    contract    = State()
    amenities   = State()
    description = State()
    photos      = State()
    confirm     = State()


# ── Keyboard helpers ──────────────────────────────────────────────────────────

def _kb(*rows: list, one_time: bool = True) -> ReplyKeyboardMarkup:
    """Builds a reply keyboard from variable-length button rows."""
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=t) for t in row] for row in rows],
        resize_keyboard=True,
        one_time_keyboard=one_time,
    )


def _inline(*rows: list) -> InlineKeyboardMarkup:
    """Builds an inline keyboard from variable-length (text, callback_data) rows."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t, callback_data=d) for t, d in row]
            for row in rows
        ]
    )


async def _cancel(msg: Message, state: FSMContext) -> None:
    """Clears FSM state and notifies the user."""
    await state.clear()
    await msg.answer(
        "Form cancelled. Type /addlisting to start over.",
        reply_markup=ReplyKeyboardRemove(),
    )


def _progress(step: int, total: int = FORM_TOTAL_STEPS) -> str:
    """Returns a text progress bar, e.g. [▓▓▓▓░░░░░░░░░] 4/13"""
    return f"[{'▓' * step}{'░' * (total - step)}] {step}/{total}"


def _summary(data: dict) -> str:
    """Builds a human-readable preview of the listing form data."""
    rooms_label = "Studio" if data.get("rooms") == 0 else f"{data.get('rooms', '?')}-room"
    price_str   = f"{int(data.get('price', 0)):,}".replace(",", " ")
    lines = [
        f"🏙 <b>{rooms_label} · {data.get('area', '?')} m² · floor {data.get('floor', '?')}</b>",
        f"📍 {data.get('district', '?')}, {data.get('address', '?')}",
        f"💰 {price_str} ₸/month",
        f"🔑 Deposit: {data.get('deposit', '?')} | Contract: {data.get('contract', '?')}",
        f"📞 {data.get('name', '?')} · {data.get('phone', '?')}",
    ]
    amenities = data.get("amenities", [])
    if amenities:
        lines.append(f"✨ {', '.join(amenities)}")
    desc = data.get("description", "")
    if desc:
        lines.append(f"\n{desc[:200]}")
    photos = data.get("photos", [])
    lines.append(f"\n📸 Photos: {len(photos)}")
    return "\n".join(lines)


# ── Entry point ───────────────────────────────────────────────────────────────

@router.message(Command("addlisting"))
async def cmd_addlisting(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(
        "🏠 <b>Add a rental listing</b>\n\n"
        "I'll ask a few questions — this takes about 3 minutes.\n"
        "Type /cancel at any time to abort.\n\n"
        f"{_progress(0)}\n\n"
        "What is your name?",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode=ParseMode.HTML,
    )
    await state.set_state(LandlordForm.name)


@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext) -> None:
    await _cancel(message, state)


# ── Step 1 — Name ─────────────────────────────────────────────────────────────

@router.message(LandlordForm.name)
async def step_name(message: Message, state: FSMContext) -> None:
    if not message.text or len(message.text.strip()) < 2:
        await message.answer("Please enter your name (at least 2 characters):")
        return
    await state.update_data(name=message.text.strip())
    await message.answer(
        f"{_progress(1)}\n\n📞 Enter your phone number:\n"
        "(e.g. +7 777 123 45 67)",
        reply_markup=_kb([KeyboardButton(
            text="📱 Share contact",
            request_contact=True,
        )]),
    )
    await state.set_state(LandlordForm.phone)


# ── Step 2 — Phone ────────────────────────────────────────────────────────────

@router.message(LandlordForm.phone, F.contact)
async def step_phone_contact(message: Message, state: FSMContext) -> None:
    await state.update_data(phone=message.contact.phone_number)
    await _ask_district(message, state)


@router.message(LandlordForm.phone)
async def step_phone_text(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    if len(text) < 7:
        await message.answer("Please enter a valid phone number:")
        return
    await state.update_data(phone=text)
    await _ask_district(message, state)


async def _ask_district(message: Message, state: FSMContext) -> None:
    await message.answer(
        f"{_progress(2)}\n\n📍 Select a district:",
        reply_markup=_kb(*[[d] for d in DISTRICTS]),
    )
    await state.set_state(LandlordForm.district)


# ── Step 3 — District ─────────────────────────────────────────────────────────

@router.message(LandlordForm.district)
async def step_district(message: Message, state: FSMContext) -> None:
    await state.update_data(district=(message.text or "").strip())
    await message.answer(
        f"{_progress(3)}\n\n🏢 Enter the exact address:\n"
        "(street, building, complex — e.g. Dostyk St 1, Nur-City complex)",
        reply_markup=ReplyKeyboardRemove(),
    )
    await state.set_state(LandlordForm.address)


# ── Step 4 — Address ──────────────────────────────────────────────────────────

@router.message(LandlordForm.address)
async def step_address(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    if len(text) < 5:
        await message.answer("Please enter a more detailed address:")
        return
    await state.update_data(address=text)
    await message.answer(
        f"{_progress(4)}\n\n🛏 Number of rooms:",
        reply_markup=_kb(ROOMS_OPTIONS[:3], ROOMS_OPTIONS[3:]),
    )
    await state.set_state(LandlordForm.rooms)


# ── Step 5 — Rooms ────────────────────────────────────────────────────────────

@router.message(LandlordForm.rooms)
async def step_rooms(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    if text == "Studio":
        rooms = 0
    elif text == "4+":
        rooms = 4
    elif text.isdigit():
        rooms = int(text)
    else:
        await message.answer("Please choose from the options:")
        return
    await state.update_data(rooms=rooms)
    await message.answer(
        f"{_progress(5)}\n\n📐 Apartment area (m²):\n(e.g. 45)",
        reply_markup=ReplyKeyboardRemove(),
    )
    await state.set_state(LandlordForm.area)


# ── Step 6 — Area ─────────────────────────────────────────────────────────────

@router.message(LandlordForm.area)
async def step_area(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip().replace(",", ".")
    try:
        area = float(text)
        if not (10 < area < 1000):
            raise ValueError("Area out of range")
    except ValueError:
        await message.answer("Please enter the area as a number (e.g. 45):")
        return
    await state.update_data(area=area)
    await message.answer(
        f"{_progress(6)}\n\n🏢 Floor / out of how many?\n(e.g. 5/9 or just 5)",
        reply_markup=_kb([SKIP_TEXT]),
    )
    await state.set_state(LandlordForm.floor)


# ── Step 7 — Floor ────────────────────────────────────────────────────────────

@router.message(LandlordForm.floor)
async def step_floor(message: Message, state: FSMContext) -> None:
    text = (message.text or "").strip()
    floor = total_floors = None
    if text != SKIP_TEXT:
        parts = text.replace(" ", "").split("/")
        try:
            floor = int(parts[0])
            total_floors = int(parts[1]) if len(parts) > 1 else None
        except (ValueError, IndexError):
            pass  # Non-critical — floor is optional
    await state.update_data(floor=floor, total_floors=total_floors)
    await message.answer(
        f"{_progress(7)}\n\n💰 Monthly rent in KZT:\n(e.g. 150000)",
        reply_markup=ReplyKeyboardRemove(),
    )
    await state.set_state(LandlordForm.price)


# ── Step 8 — Price ────────────────────────────────────────────────────────────

@router.message(LandlordForm.price)
async def step_price(message: Message, state: FSMContext) -> None:
    text = (message.text or "").replace(" ", "").replace(",", "")
    try:
        price = int(text)
        if not (10_000 <= price <= 50_000_000):
            raise ValueError("Price out of range")
    except ValueError:
        await message.answer("Please enter a valid amount in KZT (e.g. 150000):")
        return
    await state.update_data(price=price)
    await message.answer(
        f"{_progress(8)}\n\n🔑 Deposit:",
        reply_markup=_kb(["No deposit", "1 month", "2 months", "Other"]),
    )
    await state.set_state(LandlordForm.deposit)


# ── Step 9 — Deposit ──────────────────────────────────────────────────────────

@router.message(LandlordForm.deposit)
async def step_deposit(message: Message, state: FSMContext) -> None:
    await state.update_data(deposit=(message.text or "").strip())
    await message.answer(
        f"{_progress(9)}\n\n📄 Lease duration:",
        reply_markup=_kb(["1 month", "3–6 months", "6–12 months", "Flexible"]),
    )
    await state.set_state(LandlordForm.contract)


# ── Step 10 — Contract ────────────────────────────────────────────────────────

@router.message(LandlordForm.contract)
async def step_contract(message: Message, state: FSMContext) -> None:
    await state.update_data(contract=(message.text or "").strip())

    # Build inline amenity picker (multi-select)
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text=a, callback_data=f"amenity:{a}")
            for a in AMENITIES_OPTIONS[i : i + 2]
        ]
        for i in range(0, len(AMENITIES_OPTIONS), 2)
    ] + [[InlineKeyboardButton(text=DONE_TEXT, callback_data="amenity:done")]])

    await state.update_data(amenities=[])
    await message.answer(
        f"{_progress(10)}\n\n✨ Select amenities (multiple allowed):\n"
        "Tap each item, then press ✅ Done",
        reply_markup=ReplyKeyboardRemove(),
    )
    await message.answer("Amenities:", reply_markup=kb)
    await state.set_state(LandlordForm.amenities)


# ── Step 10b — Amenities (inline multi-select) ────────────────────────────────

@router.callback_query(LandlordForm.amenities, F.data.startswith("amenity:"))
async def step_amenities_cb(cb: CallbackQuery, state: FSMContext) -> None:
    value = cb.data.split(":", 1)[1]
    data = await state.get_data()
    amenities: List[str] = data.get("amenities", [])

    if value == "done":
        await cb.answer()
        await cb.message.edit_reply_markup(reply_markup=None)
        selected = ", ".join(amenities) if amenities else "none selected"
        await cb.message.answer(
            f"✅ Selected: {selected}\n\n"
            f"{_progress(11)}\n\n📝 Write a description of the apartment:\n"
            "(max 500 characters, or skip)",
            reply_markup=_kb([SKIP_TEXT]),
        )
        await state.set_state(LandlordForm.description)
        return

    # Toggle selection
    if value in amenities:
        amenities.remove(value)
        await cb.answer(f"Removed: {value}")
    else:
        amenities.append(value)
        await cb.answer(f"Added: {value}")

    await state.update_data(amenities=amenities)

    # Rebuild keyboard with checkmarks on selected items
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text=("✓ " if a in amenities else "") + a,
                callback_data=f"amenity:{a}",
            )
            for a in AMENITIES_OPTIONS[i : i + 2]
        ]
        for i in range(0, len(AMENITIES_OPTIONS), 2)
    ] + [[InlineKeyboardButton(text=DONE_TEXT, callback_data="amenity:done")]])
    await cb.message.edit_reply_markup(reply_markup=kb)


# ── Step 11 — Description ─────────────────────────────────────────────────────

@router.message(LandlordForm.description)
async def step_description(message: Message, state: FSMContext) -> None:
    text = "" if message.text == SKIP_TEXT else (message.text or "").strip()[:500]
    await state.update_data(description=text)
    await message.answer(
        f"{_progress(12)}\n\n📸 Upload apartment photos:\n\n"
        "• Send up to <b>10 photos</b>\n"
        "• Tap «Done» when finished\n"
        "• The first photo will be the cover image",
        reply_markup=_kb([DONE_TEXT]),
        parse_mode=ParseMode.HTML,
    )
    await state.update_data(photos=[])
    await state.set_state(LandlordForm.photos)


# ── Step 12 — Photos ──────────────────────────────────────────────────────────

@router.message(LandlordForm.photos, F.photo)
async def step_photo_receive(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    photos: List[str] = data.get("photos", [])
    if len(photos) >= 10:
        await message.answer("Maximum 10 photos. Press «Done».")
        return
    # Use the highest-resolution variant
    file_id = message.photo[-1].file_id
    photos.append(file_id)
    await state.update_data(photos=photos)
    count = len(photos)
    suffix = " Press «Done» when finished." if count == 1 else ""
    await message.answer(
        f"✅ Photo {count}/10 received.{suffix}",
        reply_markup=_kb([DONE_TEXT]),
    )


@router.message(LandlordForm.photos, F.text == DONE_TEXT)
async def step_photos_done(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    if not data.get("photos"):
        await message.answer("Please upload at least one photo:")
        return
    await _show_confirmation(message, state, data)


async def _show_confirmation(message: Message, state: FSMContext, data: dict) -> None:
    summary = _summary(data)
    await message.answer(
        f"{_progress(13)}\n\n"
        "📋 <b>Review your listing:</b>\n\n"
        f"{summary}\n\n"
        "Everything correct?",
        reply_markup=_kb(["✅ Submit for review", "❌ Start over"]),
        parse_mode=ParseMode.HTML,
    )
    await state.set_state(LandlordForm.confirm)


# ── Step 13 — Confirmation ────────────────────────────────────────────────────

@router.message(LandlordForm.confirm, F.text == "✅ Submit for review")
async def step_confirm_yes(
    message: Message,
    state: FSMContext,
    repo: SheetRepo,
    admin_ids: list,
    bot,
) -> None:
    data = await state.get_data()
    await state.clear()

    listing = Listing(
        landlord_tg_id=message.from_user.id,
        landlord_username=f"@{message.from_user.username}" if message.from_user.username else "",
        landlord_name=data.get("name", ""),
        landlord_phone=data.get("phone", ""),
        district=data.get("district", ""),
        address=data.get("address", ""),
        rooms=data.get("rooms"),
        area=data.get("area"),
        floor=data.get("floor"),
        total_floors=data.get("total_floors"),
        price=data.get("price", 0),
        deposit=data.get("deposit", ""),
        contract_months=data.get("contract", ""),
        amenities=", ".join(data.get("amenities", [])),
        description=data.get("description", ""),
        photos=data.get("photos", []),
        status=ListingStatus.PENDING,
    )

    try:
        listing = repo.add_listing(listing)
    except Exception as exc:
        logger.error(f"[landlord_fsm] Failed to save listing: {exc}")
        await message.answer(
            "⚠️ An error occurred while saving. Please try again later.",
            reply_markup=ReplyKeyboardRemove(),
        )
        return

    await message.answer(
        f"🎉 <b>Listing submitted for review!</b>\n\n"
        f"ID: <code>{listing.external_id}</code>\n\n"
        "Review usually takes up to 2 hours. "
        "Once approved your listing will appear in the channel.\n\n"
        "You will be notified when it goes live. ✅",
        reply_markup=ReplyKeyboardRemove(),
        parse_mode=ParseMode.HTML,
    )

    await _notify_admins(bot, admin_ids, listing)
    logger.info(
        f"[landlord_fsm] Listing created: {listing.external_id} "
        f"by user {message.from_user.id}"
    )


@router.message(LandlordForm.confirm, F.text == "❌ Start over")
async def step_confirm_restart(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer(
        "Form reset. Type /addlisting to start over.",
        reply_markup=ReplyKeyboardRemove(),
    )


# ── Admin notification ────────────────────────────────────────────────────────

async def _notify_admins(bot, admin_ids: list, listing: Listing) -> None:
    """Sends a moderation card with Approve/Reject buttons to all admin IDs."""
    rooms_label = "Studio" if listing.rooms == 0 else f"{listing.rooms}-room"
    price_str   = f"{listing.price:,}".replace(",", " ")
    text = (
        f"🆕 <b>New listing for moderation</b>\n\n"
        f"ID: <code>{listing.external_id}</code>\n"
        f"Type: {rooms_label} · {listing.area} m²\n"
        f"District: {listing.district}\n"
        f"Address: {listing.address}\n"
        f"Price: {price_str} ₸/month\n"
        f"Deposit: {listing.deposit}\n"
        f"Contract: {listing.contract_months}\n"
        f"Owner: {listing.landlord_name} · {listing.landlord_phone}\n"
        f"TG: {listing.landlord_username}\n"
        f"Photos: {len(listing.photos)}"
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="✅ Approve",
            callback_data=f"mod:approve:{listing.external_id}",
        ),
        InlineKeyboardButton(
            text="❌ Reject",
            callback_data=f"mod:reject:{listing.external_id}",
        ),
    ]])

    for admin_id in admin_ids:
        try:
            if listing.photos:
                await bot.send_photo(
                    chat_id=admin_id,
                    photo=listing.photos[0],
                    caption=text,
                    reply_markup=kb,
                    parse_mode=ParseMode.HTML,
                )
            else:
                await bot.send_message(
                    chat_id=admin_id,
                    text=text,
                    reply_markup=kb,
                    parse_mode=ParseMode.HTML,
                )
        except Exception as exc:
            logger.error(f"[landlord_fsm] Could not notify admin {admin_id}: {exc}")
