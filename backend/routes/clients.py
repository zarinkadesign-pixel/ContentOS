"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/routes/clients.py
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from core.store import load_clients, save_clients, add_client, update_client, get_client

router = APIRouter()


class ClientCreate(BaseModel):
    name: str
    niche: str = ""
    contact: str = ""
    income_now: float = 0
    income_goal: float = 0


class ClientUpdate(BaseModel):
    data: dict[str, Any]


@router.get("")
def list_clients():
    return load_clients()


@router.post("", status_code=201)
def create_client(body: ClientCreate):
    client = add_client(body.model_dump())
    return client


@router.get("/{client_id}")
def get_client_by_id(client_id: str):
    client = get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}")
def update_client_by_id(client_id: str, body: ClientUpdate):
    ok = update_client(client_id, body.data)
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found")
    return get_client(client_id)


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: str):
    clients = load_clients()
    updated = [c for c in clients if c.get("id") != client_id]
    if len(updated) == len(clients):
        raise HTTPException(status_code=404, detail="Client not found")
    save_clients(updated)
