"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/routes/leads.py
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.store import load_leads, save_leads, add_lead, move_lead, delete_lead

router = APIRouter()


class LeadCreate(BaseModel):
    name: str
    source: str = ""
    contact: str = ""
    niche: str = ""
    product: str = ""
    notes: str = ""


class StageUpdate(BaseModel):
    stage: str


@router.get("")
def list_leads():
    return load_leads()


@router.post("", status_code=201)
def create_lead(body: LeadCreate):
    lead = add_lead(body.model_dump())
    return lead


@router.put("/{lead_id}/stage")
def update_stage(lead_id: str, body: StageUpdate):
    ok = move_lead(lead_id, body.stage)
    if not ok:
        raise HTTPException(status_code=404, detail="Lead not found")
    leads = load_leads()
    return next((l for l in leads if l.get("id") == lead_id), None)


@router.delete("/{lead_id}", status_code=204)
def remove_lead(lead_id: str):
    ok = delete_lead(lead_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lead not found")
