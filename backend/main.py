"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/main.py
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import clients, leads, finance, agents, vizard
from core.store import create_demo_data

app = FastAPI(title="ContentOS API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router, prefix="/api/clients", tags=["clients"])
app.include_router(leads.router,   prefix="/api/leads",   tags=["leads"])
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(agents.router,  prefix="/api/agents",  tags=["agents"])
app.include_router(vizard.router,  prefix="/api/vizard",  tags=["vizard"])


@app.on_event("startup")
def startup():
    create_demo_data()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/dashboard")
def dashboard():
    from core.store import load_clients, load_leads, load_finance

    clients_data = load_clients()
    leads_data   = load_leads()
    finance_data = load_finance()

    transactions = finance_data.get("transactions", [])
    total_revenue = sum(t["amount"] for t in transactions if t.get("type") == "income")
    monthly_target = 20_000

    stage_counts: dict[str, int] = {}
    for lead in leads_data:
        stage = lead.get("stage", "new")
        stage_counts[stage] = stage_counts.get(stage, 0) + 1

    monthly = finance_data.get("monthly", [])

    return {
        "kpi": {
            "total_revenue":  total_revenue,
            "monthly_target": monthly_target,
            "progress_pct":   round(total_revenue / monthly_target * 100, 1) if monthly_target else 0,
            "total_clients":  len(clients_data),
            "total_leads":    len(leads_data),
        },
        "lead_stages":    stage_counts,
        "recent_clients": clients_data[:3],
        "monthly_chart":  monthly[-6:] if monthly else [],
    }
