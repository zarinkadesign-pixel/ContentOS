"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/poster/scheduler.py
"""

from __future__ import annotations

import asyncio
import random
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from aiogram import Bot
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramBadRequest, TelegramNetworkError
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    Message,
)
from loguru import logger
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from core.config import AppConfig
from core.models import Listing, ListingStatus
from sheets.repository import SheetRepo

# Astana timezone = UTC+5
ASTANA_TZ = timezone(timedelta(hours=5))

# Max listings published per scheduler tick
_TICK_BATCH_SIZE = 5


class RandomScheduler:
    """
    Publication scheduler with randomised timing.

    Algorithm per tick:
    1. Collect approved (first post) + posted (re-post eligible) listings.
    2. Filter: next_post_at <= now OR next_post_at is None.
    3. Shuffle to avoid predictable ordering.
    4. Publish up to _TICK_BATCH_SIZE listings with post_delay_seconds between each.
    5. Set next_post_at = now + random(repost_interval, repost_interval + 3 h).
    6. RENTED listings are silently skipped forever.
    """

    def __init__(self, bot: Bot, repo: SheetRepo, cfg: AppConfig) -> None:
        self._bot  = bot
        self._repo = repo
        self._cfg  = cfg
        self._sc   = cfg.scheduler
        self._tc   = cfg.telegram

        self._posts_today = 0
        self._today_date  = datetime.now(ASTANA_TZ).date()

    # ── Public ────────────────────────────────────────────────────────────────

    async def tick(self) -> None:
        """Called every N minutes by APScheduler."""
        now = datetime.now(ASTANA_TZ)

        # Reset daily counter at midnight
        if now.date() != self._today_date:
            self._posts_today = 0
            self._today_date  = now.date()

        # Check active hours window
        if not (self._sc.active_hour_start <= now.hour < self._sc.active_hour_end):
            logger.debug(f"[scheduler] Outside active hours: {now.hour}:00")
            return

        # Enforce daily post limit
        if self._posts_today >= self._sc.max_posts_per_day:
            logger.debug(f"[scheduler] Daily limit reached: {self._posts_today}")
            return

        queue = self._build_queue(now)
        if not queue:
            logger.debug("[scheduler] Queue empty — nothing to post")
            return

        logger.info(f"[scheduler] Queue size: {len(queue)}")

        for listing in queue:
            if self._posts_today >= self._sc.max_posts_per_day:
                break
            message_id = await self._post_listing(listing)
            if message_id is not None:
                next_post = self._calc_next_post(now)
                listing.status = ListingStatus.POSTED
                self._repo.mark_listing_posted(listing, message_id, next_post)
                self._posts_today += 1
                logger.info(
                    f"[scheduler] Posted: {listing.external_id} "
                    f"(next at {next_post.strftime('%H:%M')})"
                )
            await asyncio.sleep(self._sc.post_delay_seconds)

    # ── Queue building ────────────────────────────────────────────────────────

    def _build_queue(self, now: datetime) -> List[Listing]:
        """
        Merges approved (new) and posted (due for re-post) listings into
        a shuffled queue capped at _TICK_BATCH_SIZE entries.
        """
        approved = self._repo.get_approved_listings()
        posted   = self._repo.get_posted_listings()

        ready: List[Listing] = list(approved)  # New listings are always ready

        for lst in posted:
            if lst.next_post_at is None:
                ready.append(lst)
                continue
            # Normalise to timezone-aware datetime before comparing
            npa = lst.next_post_at
            if npa.tzinfo is None:
                npa = npa.replace(tzinfo=timezone.utc)
            if npa <= now:
                ready.append(lst)

        random.shuffle(ready)
        return ready[:_TICK_BATCH_SIZE]

    def _calc_next_post(self, now: datetime) -> datetime:
        """Returns a randomised next-post timestamp for re-post scheduling."""
        base_minutes = self._sc.repost_interval_hours * 60
        minutes = random.randint(base_minutes, base_minutes + 180)  # ±3 h jitter
        return now + timedelta(minutes=minutes)

    # ── Posting ───────────────────────────────────────────────────────────────

    async def _post_listing(self, listing: Listing) -> Optional[int]:
        """
        Publishes the listing to the Telegram channel.
        Returns the channel message_id on success, or None on failure.
        """
        caption  = self._build_caption(listing)
        keyboard = self._build_keyboard(listing)
        photos   = listing.photos

        if not photos:
            return await self._post_text(listing, caption, keyboard)
        if len(photos) == 1:
            return await self._post_single_photo(photos[0], caption, keyboard)
        return await self._post_media_group(photos, caption, keyboard)

    @retry(
        retry=retry_if_exception_type(TelegramNetworkError),
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=2, max=15),
    )
    async def _post_single_photo(
        self, file_id: str, caption: str, keyboard: InlineKeyboardMarkup
    ) -> Optional[int]:
        try:
            msg: Message = await self._bot.send_photo(
                chat_id=self._tc.channel_id,
                photo=file_id,
                caption=caption,
                parse_mode=ParseMode.HTML,
                reply_markup=keyboard,
            )
            return msg.message_id
        except TelegramBadRequest as exc:
            logger.warning(f"[scheduler] Photo post failed: {exc}")
            return None

    @retry(
        retry=retry_if_exception_type(TelegramNetworkError),
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=2, max=15),
    )
    async def _post_media_group(
        self, file_ids: List[str], caption: str, keyboard: InlineKeyboardMarkup
    ) -> Optional[int]:
        media = [
            InputMediaPhoto(
                media=fid,
                caption=caption if i == 0 else None,
                parse_mode=ParseMode.HTML if i == 0 else None,
            )
            for i, fid in enumerate(file_ids[:10])
        ]
        try:
            msgs = await self._bot.send_media_group(
                chat_id=self._tc.channel_id,
                media=media,
            )
            first_id = msgs[0].message_id
            # Inline keyboard must be sent as a separate message for media groups
            await self._bot.send_message(
                chat_id=self._tc.channel_id,
                text="👇 Actions:",
                reply_markup=keyboard,
                reply_to_message_id=first_id,
            )
            return first_id
        except TelegramBadRequest as exc:
            logger.warning(f"[scheduler] Media group post failed: {exc}")
            return None

    @retry(
        retry=retry_if_exception_type(TelegramNetworkError),
        stop=stop_after_attempt(3),
        wait=wait_exponential(min=2, max=15),
    )
    async def _post_text(
        self, listing: Listing, caption: str, keyboard: InlineKeyboardMarkup
    ) -> Optional[int]:
        try:
            msg: Message = await self._bot.send_message(
                chat_id=self._tc.channel_id,
                text=caption,
                parse_mode=ParseMode.HTML,
                reply_markup=keyboard,
                disable_web_page_preview=True,
            )
            return msg.message_id
        except TelegramBadRequest as exc:
            logger.error(f"[scheduler] Text post failed: {exc}")
            return None

    # ── Caption builder ───────────────────────────────────────────────────────

    def _build_caption(self, listing: Listing) -> str:
        """Builds the HTML caption for a channel post (max ~1000 chars)."""
        rooms_label = "Studio" if listing.rooms == 0 else f"{listing.rooms}-room"
        price_str   = f"{listing.price:,}".replace(",", " ") + " ₸/month"

        lines = [f"🏙 <b>{rooms_label} apartment for rent — Astana</b>"]
        lines.append(f"💰 <b>{price_str}</b>")

        location_parts = [p for p in [listing.district, listing.address] if p]
        if location_parts:
            lines.append(f"📍 {', '.join(location_parts)}")

        params = []
        if listing.area:
            params.append(f"{listing.area:.0f} m²")
        if listing.floor and listing.total_floors:
            params.append(f"floor {listing.floor}/{listing.total_floors}")
        elif listing.floor:
            params.append(f"floor {listing.floor}")
        if params:
            lines.append(f"🏢 {' · '.join(params)}")

        if listing.deposit:
            lines.append(f"🔑 Deposit: {listing.deposit}")
        if listing.contract_months:
            lines.append(f"📄 Contract: {listing.contract_months}")
        if listing.amenities:
            lines.append(f"✨ {listing.amenities}")

        if listing.description:
            desc = listing.description.strip()
            if len(desc) > 200:
                desc = desc[:197] + "…"
            lines.append(f"\n{desc}")

        if listing.landlord_phone:
            lines.append(f"\n📞 {listing.landlord_phone}")

        # Media group caption limit is 1024 characters
        text = "\n".join(lines)
        if len(text) > 1000:
            text = text[:997] + "…"
        return text

    # ── Keyboard builder ──────────────────────────────────────────────────────

    def _build_keyboard(self, listing: Listing) -> InlineKeyboardMarkup:
        """Builds the inline keyboard attached to each channel post."""
        rows: List[list] = []

        # Row 1: Contact the owner directly
        owner_row = []
        if listing.landlord_username:
            uname = listing.landlord_username.lstrip("@")
            owner_row.append(InlineKeyboardButton(
                text="✍️ Contact owner",
                url=f"https://t.me/{uname}",
            ))
        elif listing.landlord_phone:
            phone = listing.landlord_phone.replace("+", "").replace(" ", "")
            owner_row.append(InlineKeyboardButton(
                text="✍️ Contact owner",
                url=f"https://t.me/+{phone}",
            ))
        if owner_row:
            rows.append(owner_row)

        # Row 2: Book viewing + Realtor
        realtor_handle = self._tc.realtor_username.lstrip("@")
        rows.append([
            InlineKeyboardButton(
                text="📅 Book a viewing",
                callback_data=f"lead:{listing.external_id}",
            ),
            InlineKeyboardButton(
                text="🤝 Realtor",
                url=f"https://t.me/{realtor_handle}",
            ),
        ])

        # Row 3: Find similar listings
        district_short = (listing.district or "")[:15]
        rows.append([InlineKeyboardButton(
            text="🔍 Find similar",
            callback_data=f"similar:{listing.rooms or 0}:{district_short}",
        )])

        return InlineKeyboardMarkup(inline_keyboard=rows)
