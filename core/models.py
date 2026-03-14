"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/core/models.py
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


# ── Enums ─────────────────────────────────────────────────────────────────────

class ListingStatus(str, Enum):
    PENDING  = "pending"   # Awaiting admin moderation
    APPROVED = "approved"  # Approved, queued for publication
    POSTED   = "posted"    # Published in the Telegram channel
    RENTED   = "rented"    # Apartment rented — removed from publishing queue
    REJECTED = "rejected"  # Rejected by moderator
    PAUSED   = "paused"    # Temporarily paused by the landlord


class RealtorStatus(str, Enum):
    PENDING  = "pending"
    APPROVED = "approved"
    ACTIVE   = "active"
    FROZEN   = "frozen"   # Temporary freeze due to violations
    BANNED   = "banned"   # Permanent ban


class LeadStatus(str, Enum):
    NEW       = "new"
    ASSIGNED  = "assigned"   # Realtor assigned
    VIEWING   = "viewing"    # Viewing in progress
    RENTED    = "rented"     # Deal closed
    CANCELLED = "cancelled"
    NO_MATCH  = "no_match"   # Apartment did not suit the tenant


class ViolationType(str, Enum):
    NO_SHOW   = "no_show"    # Realtor did not show up for viewing
    NO_REPORT = "no_report"  # Realtor did not record the outcome
    BYPASS    = "bypass"     # Worked outside the platform
    FRAUD     = "fraud"      # Fraudulent activity


# ── Listing ───────────────────────────────────────────────────────────────────

@dataclass
class Listing:
    # Landlord identity
    landlord_tg_id:      int
    landlord_username:   str = ""
    landlord_phone:      str = ""
    landlord_name:       str = ""

    # Property details
    address:             str            = ""
    district:            str            = ""
    rooms:               Optional[int]  = None
    area:                Optional[float] = None
    floor:               Optional[int]  = None
    total_floors:        Optional[int]  = None
    price:               int            = 0     # Monthly rent in KZT
    deposit:             str            = ""    # e.g. "1 month" / "none"
    contract_months:     str            = ""    # e.g. "3-6 months"
    description:         str            = ""
    amenities:           str            = ""    # Comma-separated list

    # Media
    photos: List[str] = field(default_factory=list)  # Telegram file_ids

    # Status & identity
    status:      ListingStatus  = ListingStatus.PENDING
    external_id: str            = ""           # Short UUID prefix (primary key)
    row_index:   Optional[int]  = None

    # Publishing metadata
    channel_message_id: Optional[int]      = None
    posted_count:       int                = 0
    next_post_at:       Optional[datetime] = None

    # Timestamps
    created_at:  datetime          = field(default_factory=datetime.utcnow)
    updated_at:  datetime          = field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    rented_at:   Optional[datetime] = None

    # ── Computed properties ───────────────────────────────────────────────────

    @property
    def price_formatted(self) -> str:
        """Returns price as a human-readable string, e.g. '150 000 ₸/month'."""
        return f"{self.price:,}".replace(",", " ") + " ₸/month"

    @property
    def rooms_label(self) -> str:
        """Returns 'Studio' for 0 rooms, otherwise '<N>-room'."""
        if not self.rooms:
            return "Studio"
        return f"{self.rooms}-room"

    # ── Serialisation ─────────────────────────────────────────────────────────

    def to_sheet_row(self) -> List[str]:
        """Serialises the listing to a flat list of strings for Google Sheets."""
        return [
            self.external_id,
            str(self.landlord_tg_id),
            self.landlord_username,
            self.landlord_phone,
            self.landlord_name,
            self.address,
            self.district,
            str(self.rooms or ""),
            str(self.area or ""),
            str(self.floor or ""),
            str(self.total_floors or ""),
            str(self.price),
            self.deposit,
            self.contract_months,
            self.description[:500],
            self.amenities,
            "|".join(self.photos[:10]),
            self.status.value,
            str(self.channel_message_id or ""),
            str(self.posted_count),
            self.next_post_at.isoformat() if self.next_post_at else "",
            self.created_at.isoformat(),
            self.updated_at.isoformat(),
            self.approved_at.isoformat() if self.approved_at else "",
            self.rented_at.isoformat() if self.rented_at else "",
        ]

    @classmethod
    def from_sheet_row(cls, row: List[str], row_index: int) -> "Listing":
        """Deserialises a listing from a Google Sheets row."""
        r = row + [""] * 30  # Pad to avoid IndexError on short rows

        def _int(v: str) -> Optional[int]:
            return int(v) if v.strip() else None

        def _float(v: str) -> Optional[float]:
            return float(v) if v.strip() else None

        def _dt(v: str) -> Optional[datetime]:
            return datetime.fromisoformat(v) if v.strip() else None

        return cls(
            external_id=r[0],
            landlord_tg_id=int(r[1]) if r[1].strip() else 0,
            landlord_username=r[2],
            landlord_phone=r[3],
            landlord_name=r[4],
            address=r[5],
            district=r[6],
            rooms=_int(r[7]),
            area=_float(r[8]),
            floor=_int(r[9]),
            total_floors=_int(r[10]),
            price=int(r[11]) if r[11].strip() else 0,
            deposit=r[12],
            contract_months=r[13],
            description=r[14],
            amenities=r[15],
            photos=[p for p in r[16].split("|") if p.strip()],
            status=ListingStatus(r[17]) if r[17] else ListingStatus.PENDING,
            channel_message_id=_int(r[18]),
            posted_count=int(r[19]) if r[19].strip() else 0,
            next_post_at=_dt(r[20]),
            created_at=_dt(r[21]) or datetime.utcnow(),
            updated_at=_dt(r[22]) or datetime.utcnow(),
            approved_at=_dt(r[23]),
            rented_at=_dt(r[24]),
            row_index=row_index,
        )


LISTING_COLUMNS: List[str] = [
    "external_id", "landlord_tg_id", "landlord_username", "landlord_phone",
    "landlord_name", "address", "district", "rooms", "area", "floor",
    "total_floors", "price", "deposit", "contract_months", "description",
    "amenities", "photos", "status", "channel_message_id", "posted_count",
    "next_post_at", "created_at", "updated_at", "approved_at", "rented_at",
]


# ── Realtor ───────────────────────────────────────────────────────────────────

@dataclass
class Realtor:
    tg_id:             int
    username:          str        = ""
    full_name:         str        = ""
    phone:             str        = ""
    iin:               str        = ""  # Kazakhstan national ID (12 digits)
    id_photo_file_id:  str        = ""  # Telegram file_id of ID document photo
    districts:         List[str]  = field(default_factory=list)

    status:            RealtorStatus      = RealtorStatus.PENDING
    rating:            float              = 100.0  # 0–100 score
    violations:        int                = 0
    frozen_until:      Optional[datetime] = None

    # Performance statistics
    leads_total:    int = 0
    leads_success:  int = 0
    earnings_total: int = 0  # Total realtor share paid out in KZT

    created_at: datetime       = field(default_factory=datetime.utcnow)
    row_index:  Optional[int]  = None

    def to_sheet_row(self) -> List[str]:
        return [
            str(self.tg_id),
            self.username,
            self.full_name,
            self.phone,
            self.iin,
            self.id_photo_file_id,
            ",".join(self.districts),
            self.status.value,
            str(self.rating),
            str(self.violations),
            self.frozen_until.isoformat() if self.frozen_until else "",
            str(self.leads_total),
            str(self.leads_success),
            str(self.earnings_total),
            self.created_at.isoformat(),
        ]

    @classmethod
    def from_sheet_row(cls, row: List[str], row_index: int) -> "Realtor":
        r = row + [""] * 20

        def _dt(v: str) -> Optional[datetime]:
            return datetime.fromisoformat(v) if v.strip() else None

        return cls(
            tg_id=int(r[0]) if r[0].strip() else 0,
            username=r[1],
            full_name=r[2],
            phone=r[3],
            iin=r[4],
            id_photo_file_id=r[5],
            districts=[d.strip() for d in r[6].split(",") if d.strip()],
            status=RealtorStatus(r[7]) if r[7] else RealtorStatus.PENDING,
            rating=float(r[8]) if r[8].strip() else 100.0,
            violations=int(r[9]) if r[9].strip() else 0,
            frozen_until=_dt(r[10]),
            leads_total=int(r[11]) if r[11].strip() else 0,
            leads_success=int(r[12]) if r[12].strip() else 0,
            earnings_total=int(r[13]) if r[13].strip() else 0,
            created_at=_dt(r[14]) or datetime.utcnow(),
            row_index=row_index,
        )


REALTOR_COLUMNS: List[str] = [
    "tg_id", "username", "full_name", "phone", "iin", "id_photo_file_id",
    "districts", "status", "rating", "violations", "frozen_until",
    "leads_total", "leads_success", "earnings_total", "created_at",
]


# ── Lead ──────────────────────────────────────────────────────────────────────

@dataclass
class Lead:
    listing_external_id: str
    tenant_tg_id:        int
    tenant_name:         str = ""
    tenant_phone:        str = ""
    desired_date:        str = ""
    budget:              int = 0
    district_pref:       str = ""
    comment:             str = ""

    status:                  LeadStatus        = LeadStatus.NEW
    assigned_realtor_tg_id:  Optional[int]     = None
    assigned_at:             Optional[datetime] = None
    result_at:               Optional[datetime] = None
    external_id:             str               = ""
    row_index:               Optional[int]     = None
    created_at:              datetime          = field(default_factory=datetime.utcnow)

    def to_sheet_row(self) -> List[str]:
        return [
            self.external_id,
            self.listing_external_id,
            str(self.tenant_tg_id),
            self.tenant_name,
            self.tenant_phone,
            self.desired_date,
            str(self.budget),
            self.district_pref,
            self.comment,
            self.status.value,
            str(self.assigned_realtor_tg_id or ""),
            self.assigned_at.isoformat() if self.assigned_at else "",
            self.result_at.isoformat() if self.result_at else "",
            self.created_at.isoformat(),
        ]


LEAD_COLUMNS: List[str] = [
    "external_id", "listing_id", "tenant_tg_id", "tenant_name",
    "tenant_phone", "desired_date", "budget", "district_pref", "comment",
    "status", "assigned_realtor_tg_id", "assigned_at", "result_at", "created_at",
]


# ── Settlement ────────────────────────────────────────────────────────────────

@dataclass
class Settlement:
    lead_external_id:    str
    listing_external_id: str
    realtor_tg_id:       int
    monthly_rent:        int   # Agreed monthly rent in KZT
    commission_total:    int   # Total commission (rate × rent)
    platform_share:      int   # Platform portion (60% default)
    realtor_share:       int   # Realtor portion (40% default)

    contract_photo_file_id: str  = ""
    paid:                   bool = False
    external_id:            str  = ""
    row_index:              Optional[int]  = None
    created_at:             datetime       = field(default_factory=datetime.utcnow)

    @classmethod
    def calculate(
        cls,
        lead_id: str,
        listing_id: str,
        realtor_tg_id: int,
        monthly_rent: int,
        commission_rate: float = 0.5,   # 50% of monthly rent — Kazakhstan standard
        platform_pct: float = 0.60,
    ) -> "Settlement":
        """Creates a Settlement with commission amounts calculated from rent."""
        total    = int(monthly_rent * commission_rate)
        platform = int(total * platform_pct)
        realtor  = total - platform
        return cls(
            lead_external_id=lead_id,
            listing_external_id=listing_id,
            realtor_tg_id=realtor_tg_id,
            monthly_rent=monthly_rent,
            commission_total=total,
            platform_share=platform,
            realtor_share=realtor,
        )

    def to_sheet_row(self) -> List[str]:
        return [
            self.external_id,
            self.lead_external_id,
            self.listing_external_id,
            str(self.realtor_tg_id),
            str(self.monthly_rent),
            str(self.commission_total),
            str(self.platform_share),
            str(self.realtor_share),
            self.contract_photo_file_id,
            "TRUE" if self.paid else "FALSE",
            self.created_at.isoformat(),
        ]


SETTLEMENT_COLUMNS: List[str] = [
    "external_id", "lead_id", "listing_id", "realtor_tg_id",
    "monthly_rent", "commission_total", "platform_share", "realtor_share",
    "contract_photo_file_id", "paid", "created_at",
]
