"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/bot/ai_search.py
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import List, Optional

import httpx
from loguru import logger


# ── Search filter schema ──────────────────────────────────────────────────────

@dataclass
class SearchFilter:
    """
    Structured search parameters extracted from a natural language query.
    Produced by Claude API or the regex fallback parser.
    """
    rooms:     Optional[int]   = None   # 0 = studio, 1/2/3/4 = room count
    price_max: Optional[int]   = None   # Max monthly rent in KZT
    price_min: Optional[int]   = None   # Min monthly rent in KZT
    district:  Optional[str]   = None   # Astana district name
    area_min:  Optional[float] = None   # Min area in m²
    area_max:  Optional[float] = None   # Max area in m²
    floor_min: Optional[int]   = None   # Min floor number
    # Mutable defaults use field(default_factory=…) to avoid shared state
    amenities: List[str] = field(default_factory=list)  # e.g. ["Wi-Fi", "parking"]
    keywords:  List[str] = field(default_factory=list)  # Free-text search in description

    def to_human(self) -> str:
        """Returns a short human-readable summary of the active filters."""
        parts: List[str] = []
        if self.rooms is not None:
            parts.append("Studio" if self.rooms == 0 else f"{self.rooms}-room")
        if self.price_max:
            parts.append(f"up to {self.price_max:,} ₸".replace(",", " "))
        if self.price_min:
            parts.append(f"from {self.price_min:,} ₸".replace(",", " "))
        if self.district:
            parts.append(f"district: {self.district}")
        if self.area_min:
            parts.append(f"from {self.area_min} m²")
        if self.amenities:
            parts.append(", ".join(self.amenities))
        return " · ".join(parts) if parts else "any parameters"


# ── Claude API extractor ──────────────────────────────────────────────────────

# Prompt asks Claude to return ONLY a JSON object — no prose, no markdown fences.
_EXTRACT_PROMPT = """\
You are an AI assistant for apartment rental search in Astana, Kazakhstan.
The user has written a search query in Russian or English.
Extract the search parameters and return ONLY a JSON object — no explanation, no markdown.

Rules:
- rooms: 0=studio, 1/2/3/4=room count, null=not specified
- price_max / price_min: price in KZT (tenge), plain integer
- district: Astana district if mentioned (Almaty, Yesil, Baikonur, Saryarka, etc.)
- area_min / area_max: area in m²
- floor_min: minimum floor (if user says "not first floor" -> floor_min=2)
- amenities: list from ["Wi-Fi","Air conditioning","Parking","Balcony","Furniture","Appliances","Elevator"]
- keywords: list of keywords for free-text search in the description

Example query: "2 rooms near metro up to 200 thousand"
Example response:
{{"rooms":2,"price_max":200000,"district":null,"area_min":null,"area_max":null,"floor_min":null,"amenities":[],"keywords":["metro"]}}

User query: {query}

Return ONLY the JSON object.
"""


async def extract_filters(query: str, api_key: str) -> SearchFilter:
    """
    Calls the Claude API to parse a natural language rental query into
    a SearchFilter.  Falls back to regex parsing if the API is unavailable.
    """
    if not api_key:
        logger.warning("[ai_search] CLAUDE_API_KEY not set — using regex fallback")
        return _regex_fallback(query)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key":           api_key,
                    "anthropic-version":   "2023-06-01",
                    "content-type":        "application/json",
                },
                json={
                    "model":      "claude-haiku-4-5-20251001",
                    "max_tokens": 256,
                    "messages": [{
                        "role":    "user",
                        "content": _EXTRACT_PROMPT.format(query=query),
                    }],
                },
            )
            response.raise_for_status()
            raw = response.json()["content"][0]["text"].strip()
            # Strip accidental markdown code fences
            raw = re.sub(r"```(?:json)?|```", "", raw).strip()
            params = json.loads(raw)
            return SearchFilter(
                rooms     = params.get("rooms"),
                price_max = params.get("price_max"),
                price_min = params.get("price_min"),
                district  = params.get("district"),
                area_min  = params.get("area_min"),
                area_max  = params.get("area_max"),
                floor_min = params.get("floor_min"),
                amenities = params.get("amenities") or [],
                keywords  = params.get("keywords") or [],
            )
    except Exception as exc:
        logger.warning(f"[ai_search] Claude API unavailable: {exc}. Using regex fallback.")
        return _regex_fallback(query)


def _regex_fallback(query: str) -> SearchFilter:
    """
    Lightweight regex-based parser used when the Claude API is unreachable.
    Handles the most common Russian rental query patterns.
    """
    q = query.lower()
    sf = SearchFilter()

    # Room count
    if "студи" in q or "studio" in q:
        sf.rooms = 0
    elif m := re.search(r"(\d)\s*(?:-\s*)?комн", q):
        sf.rooms = int(m.group(1))
    elif "однуш" in q or "однокомн" in q:
        sf.rooms = 1
    elif "двушк" in q or "двухкомн" in q:
        sf.rooms = 2
    elif "трёшк" in q or "трехкомн" in q or "трёхкомн" in q:
        sf.rooms = 3

    # Price ceiling
    _PRICE_MULTIPLIERS = {
        "тыс": 1_000, "тысяч": 1_000,
        "млн": 1_000_000, "миллион": 1_000_000,
    }
    m = re.search(r"до\s*(\d[\d\s]*)\s*(тыс|тысяч|млн|миллион)?", q)
    if m:
        value = int(m.group(1).replace(" ", ""))
        mult  = _PRICE_MULTIPLIERS.get(m.group(2) or "", 1)
        sf.price_max = value * mult if mult > 1 else value

    # District
    _DISTRICTS = ["алматы", "есиль", "байконур", "сарыарка", "нура", "косшы"]
    for district in _DISTRICTS:
        if district in q:
            sf.district = district.capitalize()
            break

    # Floor
    if "не первый" in q or "не 1" in q:
        sf.floor_min = 2
    if "высокий этаж" in q:
        sf.floor_min = 5

    # Amenities
    _AMENITY_MAP = {
        "парковк":  "Parking",
        "wi-fi":    "Wi-Fi",
        "вайфай":   "Wi-Fi",
        "кондиц":   "Air conditioning",
        "балкон":   "Balcony",
        "мебл":     "Furniture",
        "мебель":   "Furniture",
        "лифт":     "Elevator",
        "техник":   "Appliances",
    }
    for pattern, label in _AMENITY_MAP.items():
        if pattern in q and label not in sf.amenities:
            sf.amenities.append(label)

    return sf


# ── Filter engine ─────────────────────────────────────────────────────────────

def apply_filters(listings: list, sf: SearchFilter) -> list:
    """
    Applies a SearchFilter to a list of Listing objects.

    Hard filters (rooms, price, area, floor) eliminate listings outright.
    Soft filters (district, amenities, keywords) contribute to a relevance
    score used for sorting.

    Returns listings sorted by (score DESC, price ASC).
    """
    scored: List[tuple] = []

    for lst in listings:
        score = 0

        # Hard filter: room count must match exactly
        if sf.rooms is not None and lst.rooms != sf.rooms:
            continue

        # Hard filter: price range
        if sf.price_max and lst.price > sf.price_max:
            continue
        if sf.price_min and lst.price < sf.price_min:
            continue

        # Hard filter: area
        if sf.area_min and lst.area and lst.area < sf.area_min:
            continue
        if sf.area_max and lst.area and lst.area > sf.area_max:
            continue

        # Hard filter: floor
        if sf.floor_min and lst.floor and lst.floor < sf.floor_min:
            continue

        # Soft: district (partial match — not a hard rejection)
        if sf.district:
            if lst.district and sf.district.lower() in lst.district.lower():
                score += 3
            elif lst.address and sf.district.lower() in lst.address.lower():
                score += 2

        # Soft: amenities
        if sf.amenities:
            amenities_lower = (lst.amenities or "").lower()
            score += sum(2 for a in sf.amenities if a.lower() in amenities_lower)

        # Soft: free-text keywords in description + address
        if sf.keywords:
            searchable = (
                (lst.description or "") + " " + (lst.address or "")
            ).lower()
            score += sum(1 for kw in sf.keywords if kw.lower() in searchable)

        # Soft: price below 80% of max ceiling is a bonus
        if sf.price_max and lst.price and lst.price / sf.price_max <= 0.8:
            score += 1

        scored.append((score, lst))

    scored.sort(key=lambda x: (-x[0], x[1].price))
    return [lst for _, lst in scored]


# ── Result formatter ──────────────────────────────────────────────────────────

def format_search_results(listings: list, sf: SearchFilter, bot_username: str) -> str:  # noqa: ARG001
    """Formats the top 5 search results as an HTML Telegram message."""
    if not listings:
        return (
            "😔 <b>Nothing found</b>\n\n"
            f"Search parameters: {sf.to_human()}\n\n"
            "Try adjusting your query. For example:\n"
            "• «1-room up to 150 000 ₸ Yesil»\n"
            "• «studio with parking»\n"
            "• «2 rooms near the centre»"
        )

    header = f"🔍 <b>Found: {len(listings)} listings</b>\n"
    header += f"<i>{sf.to_human()}</i>\n"
    if len(listings) > 5:
        header += f"Showing top 5 of {len(listings)}\n"
    header += "\n"

    cards: List[str] = []
    for i, lst in enumerate(listings[:5], 1):
        rooms_label = "Studio" if lst.rooms == 0 else f"{lst.rooms}-room"
        price_str   = f"{lst.price:,}".replace(",", " ") + " ₸/month"
        card = (
            f"<b>{i}. {rooms_label}</b> · {price_str}\n"
            f"📍 {lst.district or ''} {lst.address or ''}".strip() + "\n"
        )
        if lst.area:
            card += f"📐 {lst.area:.0f} m²"
        if lst.floor and lst.total_floors:
            card += f" · floor {lst.floor}/{lst.total_floors}"
        card += "\n"
        if lst.amenities:
            card += f"✨ {lst.amenities[:50]}\n"
        cards.append(card.strip())

    return header + "\n\n".join(cards)
