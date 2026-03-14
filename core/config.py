"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/core/config.py
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    """Return env var value or raise EnvironmentError if not set."""
    value = os.getenv(key)
    if not value:
        raise EnvironmentError(f"Required environment variable '{key}' is not set")
    return value


def _optional(key: str, default: str = "") -> str:
    """Return env var value or the provided default."""
    return os.getenv(key, default)


# ── Config dataclasses (frozen = immutable after creation) ────────────────────

@dataclass(frozen=True)
class TelegramConfig:
    bot_token:          str       = field(default_factory=lambda: _require("BOT_TOKEN"))
    channel_id:         str       = field(default_factory=lambda: _require("CHANNEL_ID"))
    admin_ids:          List[int] = field(default_factory=lambda: [
        int(x) for x in _optional("ADMIN_IDS", "").split(",") if x.strip()
    ])
    realtor_username:   str       = field(default_factory=lambda: _optional("REALTOR_USERNAME", "@realtor"))
    moderation_chat_id: str       = field(default_factory=lambda: _optional("MODERATION_CHAT_ID", ""))


@dataclass(frozen=True)
class SheetsConfig:
    service_account_json: Path = field(
        default_factory=lambda: Path(
            _optional("GOOGLE_SERVICE_ACCOUNT_JSON", "secrets/service_account.json")
        )
    )
    spreadsheet_id:    str = field(default_factory=lambda: _require("SPREADSHEET_ID"))
    sheet_listings:    str = field(default_factory=lambda: _optional("SHEET_LISTINGS",    "listings"))
    sheet_realtors:    str = field(default_factory=lambda: _optional("SHEET_REALTORS",    "realtors"))
    sheet_leads:       str = field(default_factory=lambda: _optional("SHEET_LEADS",       "leads"))
    sheet_settlements: str = field(default_factory=lambda: _optional("SHEET_SETTLEMENTS", "settlements"))


@dataclass(frozen=True)
class SchedulerConfig:
    # Random interval between posts of the same listing (minutes)
    post_interval_min:      int   = field(default_factory=lambda: int(_optional("POST_INTERVAL_MIN", "60")))
    post_interval_max:      int   = field(default_factory=lambda: int(_optional("POST_INTERVAL_MAX", "240")))
    # Active posting hours in Astana time (UTC+5)
    active_hour_start:      int   = field(default_factory=lambda: int(_optional("ACTIVE_HOUR_START", "9")))
    active_hour_end:        int   = field(default_factory=lambda: int(_optional("ACTIVE_HOUR_END", "21")))
    # Minimum hours before the same listing can be re-posted
    repost_interval_hours:  int   = field(default_factory=lambda: int(_optional("REPOST_INTERVAL_HOURS", "24")))
    max_posts_per_day:      int   = field(default_factory=lambda: int(_optional("MAX_POSTS_PER_DAY", "30")))
    # Delay between consecutive Telegram API calls in one scheduler tick
    post_delay_seconds:     float = field(default_factory=lambda: float(_optional("POST_DELAY_SECONDS", "3")))


@dataclass(frozen=True)
class RealtorConfig:
    commission_rate:        float = field(default_factory=lambda: float(_optional("COMMISSION_RATE", "0.5")))
    platform_pct:           float = field(default_factory=lambda: float(_optional("PLATFORM_PCT", "0.60")))
    realtor_pct:            float = field(default_factory=lambda: float(_optional("REALTOR_PCT", "0.40")))
    # Violation escalation thresholds
    freeze_on_violation:    int   = field(default_factory=lambda: int(_optional("FREEZE_ON_VIOLATION", "2")))
    ban_on_violation:       int   = field(default_factory=lambda: int(_optional("BAN_ON_VIOLATION", "3")))
    freeze_days:            int   = field(default_factory=lambda: int(_optional("FREEZE_DAYS", "7")))
    # Deadlines for realtors
    viewing_deadline_hours: int   = field(default_factory=lambda: int(_optional("VIEWING_DEADLINE_HOURS", "24")))
    report_deadline_hours:  int   = field(default_factory=lambda: int(_optional("REPORT_DEADLINE_HOURS", "2")))


@dataclass(frozen=True)
class AppConfig:
    telegram:  TelegramConfig  = field(default_factory=TelegramConfig)
    sheets:    SheetsConfig    = field(default_factory=SheetsConfig)
    scheduler: SchedulerConfig = field(default_factory=SchedulerConfig)
    realtor:   RealtorConfig   = field(default_factory=RealtorConfig)
    claude_api_key: str        = field(default_factory=lambda: _optional("CLAUDE_API_KEY", ""))


# ── Singleton accessor ────────────────────────────────────────────────────────

_config: AppConfig | None = None


def get_config() -> AppConfig:
    """Return the application config singleton (lazy-initialised)."""
    global _config
    if _config is None:
        _config = AppConfig()
    return _config
