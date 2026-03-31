"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/routes/agents.py
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.agents import AGENTS
from api.gemini import call_gemini, build_client_context
from core.store import get_client

router = APIRouter()

VALID_AGENTS = list(AGENTS.keys())


class AgentRequest(BaseModel):
    client_id: str
    extra: str = ""


@router.get("")
def list_agents():
    return [{"id": k, "name": v["name"]} for k, v in AGENTS.items()]


@router.post("/{agent_type}")
def run_agent(agent_type: str, body: AgentRequest):
    if agent_type not in AGENTS:
        raise HTTPException(status_code=400, detail=f"Unknown agent: {agent_type}. Valid: {VALID_AGENTS}")

    client = get_client(body.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    agent = AGENTS[agent_type]
    context = build_client_context(client)
    prompt = agent["prompt"].format(context=context, extra=body.extra or "")

    result = call_gemini(system=agent["system"], prompt=prompt)
    return {"agent": agent_type, "result": result}


@router.post("/briefing/daily")
def daily_briefing(body: AgentRequest):
    client = get_client(body.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    from core.agents import AGENTS
    agent = AGENTS["strategist"]
    context = build_client_context(client)
    prompt = agent["prompt"].format(context=context, extra="")
    result = call_gemini(system=agent["system"], prompt=prompt)
    return {"result": result}
