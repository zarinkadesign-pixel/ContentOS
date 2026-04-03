# AMAImedia Producer Center v3.0 — Architecture

> Full AI Agency Automation System
> Copyright (c) 2026 AMAImedia.com

---

## Overview

Producer Center v3.0 is a fully automated AI agency operating system.
Zarina's role: **Observation + high-ticket sales calls only.**
Everything else runs 24/7 via 12 AI agents.

---

## System Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCER CENTER v3.0                         │
│                    bg=#050710  accent=#5c6af0                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ├── 🖥  UI Layer (CustomTkinter 8 screens)
         │       ├── Mission Control  (live feed + KPIs)
         │       ├── Pixel Office     (12 agent grid)
         │       ├── CRM Pro          (Kanban 6 stages)
         │       ├── Calls            (prep + KP)
         │       ├── Content Studio   (queue + Vizard + generator)
         │       ├── Clients Pro      (RAG + AI commands)
         │       ├── Finance 2.0      (chart + forecast)
         │       └── Analytics        (funnel + content + ads)
         │
         ├── 🤖  Agent Layer (agents/agent_system.py)
         │       ├── 01 Hunter        — finds 50 leads/day
         │       ├── 02 Salesman      — personalized first contact
         │       ├── 03 Scorer        — AI Score 0-100
         │       ├── 04 Nurturer      — 7-day Telegram sequence
         │       ├── 05 ContentMaster — content in brand voice
         │       ├── 06 Publisher     — Vizard queue management
         │       ├── 07 Advertiser    — 9 ad variants/week
         │       ├── 08 KPMaster      — KP in 30 seconds
         │       ├── 09 Analyst       — daily briefs at 09:00
         │       ├── 10 Strategist    — weekly plan Monday 08:00
         │       ├── 11 Onboarder     — RAG setup for new clients
         │       └── 12 Reporter      — monthly client reports
         │
         ├── 🧠  RAG Layer (agents/memory.py)
         │       └── ClientMemory — per-client JSON knowledge base
         │           ├── brand_voice, pains, usp, products
         │           ├── forbidden_words, goals, audience
         │           └── history (last 200 events)
         │
         ├── 🔄  Automation Layer (n8n — 15 workflows)
         │       ├── 01 TG Parser      — Telegram channel monitoring
         │       ├── 02 Vizard         — video pipeline
         │       ├── 03 Meta Ads       — ad performance tracking
         │       ├── 04 Analytics      — metrics collection
         │       ├── 05 Daily          — morning briefing
         │       ├── 06 Scoring        — lead qualification webhook
         │       ├── 07 KP             — KP generation webhook
         │       ├── 08 Publish        — content publication cron
         │       ├── 09 Monitor        — DM monitoring + auto-reply
         │       ├── 10 Strategy       — weekly plan Monday
         │       ├── 11 Onboard        — client onboarding webhook
         │       ├── 12 Report         — monthly reports cron
         │       ├── 13 Ads            — weekly ad generation
         │       ├── 14 Return         — cold lead reactivation daily
         │       └── 15 Voice          — new lead qualifier webhook
         │
         ├── 📦  Data Layer (pc_data/)
         │       ├── leads.json         — all leads + scores
         │       ├── clients.json       — active clients
         │       ├── finance.json       — income + expenses
         │       ├── content_queue.json — publication queue
         │       └── agent_logs.json    — all agent activity
         │
         └── 🔌  External APIs
                 ├── Gemini 2.0 Flash  — primary AI brain
                 ├── Vizard API        — video pipeline
                 ├── Telegram Bot API  — notifications + DMs
                 └── Meta Ads API      — ad management
```

---

## Lead Funnel

```
Telegram Parsing / Meta Ads
         │
         ▼
    🔍 Hunter Agent
    [50 leads/day]
         │
         ▼
    💼 Salesman Agent
    [Personalized first message]
         │
         ▼
    ⚡ Scorer Agent
    [AI Score 0-100]
         │
    ┌────┴────────────────┐
    │                     │
score≥80              score 50-79         score<50
    │                     │                  │
    ▼                     ▼                  ▼
🔥 HOT LEAD         🔥 Nurturer        📦 Archive
Notify Zarina      7-day sequence    Return in 30d
Calendly auto
    │
    ▼
📞 Call (Zarina)
    │
    ▼
📄 KP Master (30 sec)
    │
    ▼
📋 Onboarder
[RAG setup]
    │
    ▼
👥 Active Client
[9-step journey]
    │
    ▼
📈 Reporter
[Monthly report]
```

---

## AI Score Criteria

| Criterion | Points |
|-----------|--------|
| Budget fit | 30 |
| Pain matches our product | 25 |
| Ready to act now | 20 |
| Open to new approaches | 15 |
| Responds quickly | 10 |
| **Total** | **100** |

**Routing:**
- Score ≥ 80 → Zarina notified immediately + Calendly
- Score 50-79 → 7-day nurture sequence
- Score < 50 → Archive, reactivate in 30 days

---

## 7-Day Nurture Sequence

| Day | Topic | Goal |
|-----|-------|------|
| 1 | Introduction | Build trust (Zarina's story, results) |
| 2 | Pain | Mirror lead's problem in their words |
| 3 | Solution | Show 24/7 AI system |
| 4 | Case Study | Specific numbers from similar niche |
| 5 | Diagnostic | 5 questions to reveal readiness |
| 6 | Invitation | Free breakdown call |
| 7 | Final Offer | 3 package options + 48h deadline |

---

## Product Lineup

| Product | Price | Target |
|---------|-------|--------|
| Instagram Audit | $150 | Entry point |
| Mini Course | $97 | Digital asset |
| Mentorship | $1,500 | Expert + 3 months |
| Full Production | $3,000 | End-to-end SMM |

---

## n8n Webhook Endpoints

| Endpoint | Workflow | Purpose |
|----------|----------|---------|
| `POST /webhook/score` | 06 | Score a lead dialog |
| `POST /webhook/generate-kp` | 07 | Generate KP for lead |
| `POST /webhook/onboard` | 11 | Start client onboarding |
| `POST /webhook/new-lead` | 15 | Qualify new ad lead |

---

## File Structure

```
D:\Content OS\
├── producer_center_app.py        ← Desktop app entry point
├── contentOS_producer.html       ← Web version
├── ARCHITECTURE.md               ← This file
├── content_manager.py            ← CLI queue manager
├── agents\
│   ├── agent_system.py           ← 12 agents + orchestrator
│   └── memory.py                 ← RAG ClientMemory
├── producer_center\              ← Python UI module
│   ├── ui\                       ← 8 screens
│   ├── core\                     ← models, store
│   └── api\                      ← Gemini, Vizard
├── pc_data\                      ← JSON data store
├── memory\                       ← Per-client RAG files
├── kp\                           ← Generated proposals
├── ads\                          ← Generated ad texts
├── logs\                         ← System logs
├── frontend\                     ← Next.js web app
└── n8n_workflow_*.json           ← 15 automation workflows
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop UI | Python + CustomTkinter |
| Web UI | Next.js 15 + TypeScript + Tailwind |
| AI Brain | Google Gemini 2.0 Flash |
| Video | Vizard API |
| Notifications | Telegram Bot API |
| Automation | n8n (self-hosted) |
| Data | JSON files (pc_data/) |
| Memory | JSON per-client (memory/) |

---

## Agent Intervals

| Agent | Interval | Peak Time |
|-------|----------|-----------|
| Hunter | 30 min | All day |
| Salesman | 15 min | All day |
| Scorer | 10 min | All day |
| Nurturer | 60 min | All day |
| ContentMaster | 2 hours | All day |
| Publisher | 60 min | 10:00 priority |
| Advertiser | Daily | Monday |
| KPMaster | On demand | Post-call |
| Analyst | Daily | 09:00 |
| Strategist | Weekly | Monday 08:00 |
| Onboarder | On demand | After contract |
| Reporter | Monthly | 1st of month |

---

*Producer Center v3.0 — AMAImedia.com*
*The most powerful AI agency OS in 2026.*
