"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/routes/finance.py
"""
from fastapi import APIRouter
from pydantic import BaseModel
from core.store import load_finance, add_transaction

router = APIRouter()


class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str = "income"  # income | expense
    category: str = ""


@router.get("")
def get_finance():
    return load_finance()


@router.post("/transactions", status_code=201)
def create_transaction(body: TransactionCreate):
    add_transaction(body.model_dump())
    return load_finance()
