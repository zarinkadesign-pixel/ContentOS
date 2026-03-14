"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/sheets/repository.py
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Dict, List, Optional, Set

import gspread
from google.oauth2.service_account import Credentials
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from core.config import SheetsConfig
from core.models import (
    Listing, ListingStatus, LISTING_COLUMNS,
    Realtor, RealtorStatus, REALTOR_COLUMNS,
    Lead, LeadStatus, LEAD_COLUMNS,
    Settlement, SETTLEMENT_COLUMNS,
)

# OAuth2 scopes required for read/write access
_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
]

# Shared retry decorator: 3 attempts, exponential back-off 2–30 s
_RETRY = dict(
    retry=retry_if_exception_type(gspread.exceptions.APIError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=30),
)


class SheetRepo:
    """
    Single repository for all four Google Sheets worksheets.

    Each public method is one atomic operation with automatic retry on
    transient API errors.  In-memory caches (listing keys, realtor IDs)
    are refreshed every hour by APScheduler to keep deduplication fast.
    """

    def __init__(self, cfg: SheetsConfig) -> None:
        self._cfg = cfg
        self._gc: Optional[gspread.Client] = None
        self._ws: Dict[str, gspread.Worksheet] = {}
        # Fast deduplication caches
        self._listing_keys: Set[str] = set()
        self._realtor_ids: Set[int] = set()

    # ── Connection ────────────────────────────────────────────────────────────

    def connect(self) -> None:
        """
        Opens the Google Sheets document and ensures all four worksheets
        exist (creates them with headers if they are missing).
        """
        creds = Credentials.from_service_account_file(
            str(self._cfg.service_account_json), scopes=_SCOPES
        )
        self._gc = gspread.authorize(creds)
        ss = self._gc.open_by_key(self._cfg.spreadsheet_id)

        sheet_defs = [
            (self._cfg.sheet_listings,    LISTING_COLUMNS),
            (self._cfg.sheet_realtors,    REALTOR_COLUMNS),
            (self._cfg.sheet_leads,       LEAD_COLUMNS),
            (self._cfg.sheet_settlements, SETTLEMENT_COLUMNS),
        ]

        for name, columns in sheet_defs:
            try:
                ws = ss.worksheet(name)
            except gspread.WorksheetNotFound:
                ws = ss.add_worksheet(title=name, rows=5000, cols=len(columns))
                ws.append_row(columns)
                logger.info(f"[repo] Created worksheet: {name}")
            self._ws[name] = ws

        self._reload_caches()
        logger.info(
            f"[repo] Connected. "
            f"Listings: {len(self._listing_keys)}, "
            f"Realtors: {len(self._realtor_ids)}"
        )

    def _reload_caches(self) -> None:
        """Refreshes in-memory deduplication caches from column 1 of each sheet."""
        ws_l = self._ws[self._cfg.sheet_listings]
        self._listing_keys = set(ws_l.col_values(1)[1:])

        ws_r = self._ws[self._cfg.sheet_realtors]
        self._realtor_ids = {
            int(x) for x in ws_r.col_values(1)[1:] if x.strip().isdigit()
        }

    # ── Listings ──────────────────────────────────────────────────────────────

    @retry(**_RETRY)
    def add_listing(self, listing: Listing) -> Listing:
        """Appends a new listing row; assigns external_id; returns updated listing."""
        listing.external_id = str(uuid.uuid4())[:8].upper()
        self._ws[self._cfg.sheet_listings].append_row(
            listing.to_sheet_row(), value_input_option="USER_ENTERED"
        )
        self._listing_keys.add(listing.external_id)
        logger.info(f"[repo] Listing added: {listing.external_id}")
        return listing

    @retry(**_RETRY)
    def get_pending_listings(self) -> List[Listing]:
        """Returns all listings awaiting moderation."""
        return self._get_listings_by_status(ListingStatus.PENDING)

    @retry(**_RETRY)
    def get_approved_listings(self) -> List[Listing]:
        """Returns all approved listings queued for publication."""
        return self._get_listings_by_status(ListingStatus.APPROVED)

    @retry(**_RETRY)
    def get_posted_listings(self) -> List[Listing]:
        """Returns all currently published listings."""
        return self._get_listings_by_status(ListingStatus.POSTED)

    def _get_listings_by_status(self, status: ListingStatus) -> List[Listing]:
        all_rows = self._ws[self._cfg.sheet_listings].get_all_values()
        results: List[Listing] = []
        for i, row in enumerate(all_rows[1:], start=2):
            if len(row) > 17 and row[17] == status.value:
                try:
                    results.append(Listing.from_sheet_row(row, row_index=i))
                except Exception as exc:
                    logger.warning(f"[repo] Skipping malformed row {i}: {exc}")
        return results

    @retry(**_RETRY)
    def update_listing_status(
        self,
        listing: Listing,
        new_status: ListingStatus,
    ) -> None:
        """Updates the listing status and writes the full row back to the sheet."""
        if listing.row_index is None:
            logger.error(f"[repo] Cannot update listing without row_index: {listing.external_id}")
            return

        listing.status = new_status
        listing.updated_at = datetime.utcnow()

        if new_status == ListingStatus.APPROVED:
            listing.approved_at = datetime.utcnow()
        elif new_status == ListingStatus.RENTED:
            listing.rented_at = datetime.utcnow()

        self._ws[self._cfg.sheet_listings].update(
            f"A{listing.row_index}",
            [listing.to_sheet_row()],
            value_input_option="USER_ENTERED",
        )
        logger.info(f"[repo] Listing status updated: {listing.external_id} -> {new_status.value}")

    @retry(**_RETRY)
    def mark_listing_posted(
        self, listing: Listing, message_id: int, next_post_at: datetime
    ) -> None:
        """Records a successful channel publication for the listing."""
        listing.status = ListingStatus.POSTED
        listing.channel_message_id = message_id
        listing.posted_count += 1
        listing.next_post_at = next_post_at
        listing.updated_at = datetime.utcnow()

        self._ws[self._cfg.sheet_listings].update(
            f"A{listing.row_index}",
            [listing.to_sheet_row()],
            value_input_option="USER_ENTERED",
        )

    def get_listing_by_id(self, external_id: str) -> Optional[Listing]:
        """Finds a listing by its external_id (linear scan — use sparingly)."""
        all_rows = self._ws[self._cfg.sheet_listings].get_all_values()
        for i, row in enumerate(all_rows[1:], start=2):
            if row and row[0] == external_id:
                return Listing.from_sheet_row(row, row_index=i)
        return None

    # ── Realtors ──────────────────────────────────────────────────────────────

    @retry(**_RETRY)
    def add_realtor(self, realtor: Realtor) -> Realtor:
        """Registers a new realtor. Raises ValueError if already exists."""
        if realtor.tg_id in self._realtor_ids:
            raise ValueError(f"Realtor {realtor.tg_id} already exists")
        self._ws[self._cfg.sheet_realtors].append_row(
            realtor.to_sheet_row(), value_input_option="USER_ENTERED"
        )
        self._realtor_ids.add(realtor.tg_id)
        logger.info(f"[repo] Realtor registered: {realtor.tg_id}")
        return realtor

    def is_realtor(self, tg_id: int) -> bool:
        """Returns True if the given Telegram user_id is a registered realtor."""
        return tg_id in self._realtor_ids

    @retry(**_RETRY)
    def get_realtor(self, tg_id: int) -> Optional[Realtor]:
        """Fetches a single realtor by Telegram user_id."""
        col = self._ws[self._cfg.sheet_realtors].col_values(1)
        for i, val in enumerate(col[1:], start=2):
            if val.strip() == str(tg_id):
                row = self._ws[self._cfg.sheet_realtors].row_values(i)
                return Realtor.from_sheet_row(row, row_index=i)
        return None

    @retry(**_RETRY)
    def get_active_realtors(self) -> List[Realtor]:
        """Returns all realtors with status ACTIVE."""
        return self._get_realtors_by_status(RealtorStatus.ACTIVE)

    @retry(**_RETRY)
    def get_all_realtors(self) -> List[Realtor]:
        """Returns all realtors regardless of status."""
        all_rows = self._ws[self._cfg.sheet_realtors].get_all_values()
        results: List[Realtor] = []
        for i, row in enumerate(all_rows[1:], start=2):
            if not row or not row[0].strip():
                continue
            try:
                results.append(Realtor.from_sheet_row(row, row_index=i))
            except Exception as exc:
                logger.warning(f"[repo] Skipping malformed realtor row {i}: {exc}")
        return results

    def _get_realtors_by_status(self, status: RealtorStatus) -> List[Realtor]:
        all_rows = self._ws[self._cfg.sheet_realtors].get_all_values()
        results: List[Realtor] = []
        for i, row in enumerate(all_rows[1:], start=2):
            if len(row) > 7 and row[7] == status.value:
                try:
                    results.append(Realtor.from_sheet_row(row, row_index=i))
                except Exception as exc:
                    logger.warning(f"[repo] Skipping malformed realtor row {i}: {exc}")
        return results

    @retry(**_RETRY)
    def update_realtor(self, realtor: Realtor) -> None:
        """Writes the realtor back to the sheet (full row update)."""
        if realtor.row_index is None:
            return
        self._ws[self._cfg.sheet_realtors].update(
            f"A{realtor.row_index}",
            [realtor.to_sheet_row()],
            value_input_option="USER_ENTERED",
        )
        logger.info(f"[repo] Realtor updated: {realtor.tg_id} -> {realtor.status.value}")

    # ── Leads ─────────────────────────────────────────────────────────────────

    @retry(**_RETRY)
    def add_lead(self, lead: Lead) -> Lead:
        """Appends a new lead; assigns external_id; returns updated lead."""
        lead.external_id = str(uuid.uuid4())[:8].upper()
        self._ws[self._cfg.sheet_leads].append_row(
            lead.to_sheet_row(), value_input_option="USER_ENTERED"
        )
        logger.info(f"[repo] Lead added: {lead.external_id}")
        return lead

    @retry(**_RETRY)
    def get_new_leads(self) -> List[Lead]:
        """Returns all leads with status NEW."""
        return self._get_leads_by_status(LeadStatus.NEW)

    @retry(**_RETRY)
    def get_all_leads_by_status(self, status: LeadStatus) -> List[Lead]:
        """Returns all leads matching the given status."""
        return self._get_leads_by_status(status)

    def _get_leads_by_status(self, status: LeadStatus) -> List[Lead]:
        all_rows = self._ws[self._cfg.sheet_leads].get_all_values()
        results: List[Lead] = []
        for i, row in enumerate(all_rows[1:], start=2):
            if len(row) > 9 and row[9] == status.value:
                try:
                    results.append(Lead(**self._lead_from_row(row, i)))
                except Exception as exc:
                    logger.warning(f"[repo] Skipping malformed lead row {i}: {exc}")
        return results

    @staticmethod
    def _lead_from_row(row: List[str], row_index: int) -> dict:
        """Deserialises a Google Sheets row into a Lead constructor kwargs dict."""
        r = row + [""] * 15
        return dict(
            external_id=r[0],
            listing_external_id=r[1],
            tenant_tg_id=int(r[2]) if r[2].strip() else 0,
            tenant_name=r[3],
            tenant_phone=r[4],
            desired_date=r[5],
            budget=int(r[6]) if r[6].strip() else 0,
            district_pref=r[7],
            comment=r[8],
            status=LeadStatus(r[9]) if r[9] else LeadStatus.NEW,
            assigned_realtor_tg_id=int(r[10]) if r[10].strip() else None,
            assigned_at=datetime.fromisoformat(r[11]) if r[11].strip() else None,
            result_at=datetime.fromisoformat(r[12]) if r[12].strip() else None,
            created_at=datetime.fromisoformat(r[13]) if r[13].strip() else datetime.utcnow(),
            row_index=row_index,
        )

    @retry(**_RETRY)
    def update_lead_status(self, lead: Lead) -> None:
        """Writes the lead back to the sheet (full row update)."""
        if lead.row_index is None:
            return
        self._ws[self._cfg.sheet_leads].update(
            f"A{lead.row_index}",
            [lead.to_sheet_row()],
            value_input_option="USER_ENTERED",
        )

    # ── Settlements ───────────────────────────────────────────────────────────

    @retry(**_RETRY)
    def add_settlement(self, settlement: Settlement) -> Settlement:
        """Records a commission settlement; assigns external_id; returns updated record."""
        settlement.external_id = str(uuid.uuid4())[:8].upper()
        self._ws[self._cfg.sheet_settlements].append_row(
            settlement.to_sheet_row(), value_input_option="USER_ENTERED"
        )
        logger.info(
            f"[repo] Settlement recorded: {settlement.external_id} "
            f"realtor={settlement.realtor_share} ₸  platform={settlement.platform_share} ₸"
        )
        return settlement

    # ── Cache ─────────────────────────────────────────────────────────────────

    def refresh_caches(self) -> None:
        """Reloads in-memory caches from Google Sheets. Called hourly by APScheduler."""
        self._reload_caches()
