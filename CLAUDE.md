# ASTANA RENT BOT v3 — Claude Code Root Context
# Copyright (c) 2026 AMAImedia.com
# B:\Downloads\Portable\astana_v3_full\astana_v3\CLAUDE.md
# READ THIS FIRST — applies to ALL Claude Code sessions in this project
# Last updated: 2026-03-14 v1.0

---

## PROJECT IDENTITY

This is **astana_v3** — a Telegram rental marketplace bot for Astana, Kazakhstan.
It is a **completely separate project** from NOESIS DHCF-FNO.
- Uses its own Python interpreter and venv
- Has its own requirements.txt
- NEVER touch any NOESIS files

---

## PYTHON INTERPRETER — MANDATORY

```
USE:   venv\Scripts\python.exe          (Windows)
       venv/bin/python                   (Linux/Mac)
NEVER: python  /  python3               (may resolve to wrong interpreter)
```

**Variable shorthand:**
```bat
set PY=venv\Scripts\python.exe
set ROOT=B:\Downloads\Portable\astana_v3_full\astana_v3
```

---

## DIRECTORY STRUCTURE

```
astana_v3_full\
└── astana_v3\                    ← PROJECT ROOT
    ├── CLAUDE.md                 ← YOU ARE HERE
    ├── main.py                   ← Entry point: Bot + Dispatcher + APScheduler + aiohttp
    ├── requirements.txt
    ├── .env.example              ← Copy to .env and fill in
    ├── ROADMAP.md
    ├── core\
    │   ├── config.py             ← Frozen dataclass config (reads env vars)
    │   └── models.py             ← Domain models: Listing, Realtor, Lead, Settlement
    ├── sheets\
    │   └── repository.py         ← All Google Sheets I/O with retry
    ├── bot\
    │   ├── landlord_fsm.py       ← 14-step FSM: landlord listing wizard
    │   ├── admin_handlers.py     ← /stats, /pending, approve/reject callbacks
    │   ├── tenant_handlers.py    ← /start, AI search, lead booking
    │   └── ai_search.py          ← Claude API NL query → SearchFilter
    ├── poster\
    │   └── scheduler.py          ← RandomScheduler: randomised channel posting
    ├── export\
    │   └── excel_exporter.py     ← Styled .xlsx export + Telegram delivery
    ├── deploy\
    │   ├── encode_sa.py          ← CLI: encode service_account.json → Base64
    │   └── railway.toml          ← Railway.app deployment config
    ├── miniapp\
    │   └── index.html            ← Single-file Telegram Mini App
    ├── secrets\                  ← NOT in git (.gitignore)
    │   └── service_account.json  ← Google Service Account credentials
    └── logs\                     ← Auto-created, NOT in git
```

---

## QUICK COMMANDS

```bat
cd B:\Downloads\Portable\astana_v3_full\astana_v3
set PY=venv\Scripts\python.exe

:: Setup (first time only)
python -m venv venv
%PY% -m pip install -r requirements.txt

:: Run bot
cp .env.example .env
%PY% main.py

:: Encode service account for Railway
%PY% deploy\encode_sa.py secrets\service_account.json
```

---

## ENVIRONMENT VARIABLES — REQUIRED

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `CHANNEL_ID` | Target channel ID (negative int) |
| `SPREADSHEET_ID` | Google Sheets document ID |

**Optional (have defaults):**

| Variable | Default | Description |
|---|---|---|
| `ADMIN_IDS` | `""` | Comma-separated Telegram user IDs |
| `CLAUDE_API_KEY` | `""` | Anthropic API key for AI search |
| `MINIAPP_URL` | Railway URL | Public URL of the Mini App |
| `GOOGLE_SA_B64` | `""` | Base64 service account (Railway deploy) |
| `POST_INTERVAL_MIN` | `60` | Min minutes between re-posts |
| `POST_INTERVAL_MAX` | `240` | Max minutes between re-posts |
| `MAX_POSTS_PER_DAY` | `30` | Daily post cap |
| `COMMISSION_RATE` | `0.5` | Fraction of rent taken as commission |
| `FREEZE_ON_VIOLATION` | `2` | Violations before realtor freeze |
| `BAN_ON_VIOLATION` | `3` | Violations before permanent ban |

---

## ARCHITECTURE — KEY PATTERNS

### Dependency Injection
All handlers receive `repo`, `cfg`, `bot`, `admin_ids`, `miniapp_url`
via `DIMiddleware` — **never instantiate these inside a handler**.

```python
# Correct — dependencies injected automatically
async def cmd_stats(message: Message, repo: SheetRepo, cfg: AppConfig) -> None:
    ...
```

### Google Sheets as Database
- 4 worksheets: `listings`, `realtors`, `leads`, `settlements`
- All writes go through `SheetRepo` — never write to sheets directly
- All `SheetRepo` methods that call Google API have `@retry(**_RETRY)`
- In-memory caches (`_listing_keys`, `_realtor_ids`) refreshed every 1 h

### Sealed constants — DO NOT CHANGE
```python
COMMISSION_RATE = 0.5    # 50% of monthly rent — Kazakhstan standard
PLATFORM_PCT    = 0.60   # Platform share
REALTOR_PCT     = 0.40   # Realtor share
```

---

## APSCHEDULER JOBS

| Job ID | Trigger | Function |
|---|---|---|
| `post` | every 15 min | `RandomScheduler.tick()` |
| `cache` | every 1 h | `SheetRepo.refresh_caches()` |
| `violations` | every 1 h | `auto_check_violations()` |
| `unfreeze` | every 6 h | `auto_unfreeze_realtors()` |
| `daily_report` | cron 09:00 +05 | `auto_daily_report()` |

---

## FILE HEADERS — ALL NEW FILES MUST HAVE

```python
"""
NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved.
astana_v3/<filename.py>
"""
```

---

## RULES FOR CLAUDE CODE

1. **ALWAYS** use `venv\Scripts\python.exe` — never bare `python` or `python3`
2. **NEVER** use `bare except: pass` — always `except Exception as exc: logger.warning(...)`
3. **NEVER** import `datetime` inside a function — always at module top level
4. **NEVER** use mutable default arguments in dataclasses — use `field(default_factory=list)`
5. **NEVER** write placeholder/stub code — all code must be production-grade
6. **ALWAYS** add the copyright header to every new `.py` file
7. **ALWAYS** use English for all code: variable names, comments, docstrings, log messages
8. UI-facing strings (Telegram messages) remain in **Russian** — do NOT translate them
9. When editing `SheetRepo` — verify every public method that calls Google API has `@retry(**_RETRY)`
10. When editing `models.py` — verify `List[str]` fields use `field(default_factory=list)` NOT `= None`
11. When editing `main.py` — verify `_apply_violation_rules` does NOT import datetime locally
12. Log messages follow the pattern: `[module_name] descriptive message`

---

## COMMON ERRORS AND FIXES

**`ModuleNotFoundError: No module named 'aiogram'`**
```bat
venv\Scripts\python.exe -m pip install -r requirements.txt
```

**`EnvironmentError: Required environment variable 'BOT_TOKEN' is not set`**
```bat
copy .env.example .env
:: Then fill in BOT_TOKEN, CHANNEL_ID, SPREADSHEET_ID
```

**`google.auth.exceptions.DefaultCredentialsError`**
```bat
:: Ensure secrets\service_account.json exists and is valid JSON
:: Or set GOOGLE_SA_B64 for Railway
```

**`TelegramBadRequest: chat not found`**
- Bot must be added as admin to the channel
- CHANNEL_ID must be negative (e.g. -1001234567890)

**`gspread.exceptions.APIError: RESOURCE_EXHAUSTED`**
- Sheets API quota exceeded — tenacity will retry automatically (up to 3×)
- If persistent: wait 1 minute and retry manually

---

## CLAUDE CODE AUTO-MODE PROMPT

Use this exact prompt when running:
```
claude --dangerously-skip-permissions
```

Paste into Claude Code terminal:

```
You are an autonomous coding agent for the astana_v3 Telegram rental bot project.
Root: B:\Downloads\Portable\astana_v3_full\astana_v3
Python: venv\Scripts\python.exe (Windows) or venv/bin/python (Linux)

Core rules — follow without asking for confirmation:
1. All code and comments in English. Russian only in Telegram message strings.
2. Never use bare except. Always: except Exception as exc: logger.warning/error(...)
3. All datetime imports at module top level, never inside functions.
4. Mutable dataclass fields use field(default_factory=list), never = None.
5. Every new .py file gets the NOESIS copyright header with correct astana_v3/ path.
6. All Google Sheets methods use @retry(**_RETRY) from tenacity.
7. Log messages format: [module_name] descriptive message in English.
8. Run: venv\Scripts\python.exe -c "import aiogram, gspread, loguru" to verify deps before edits.
9. Never modify files outside the astana_v3\ directory.
10. After any code change, verify syntax: venv\Scripts\python.exe -m py_compile <changed_file.py>

Current task: [DESCRIBE YOUR TASK HERE]

Execute all steps autonomously. Verify each file compiles before moving to the next.
Report: files changed, bugs fixed, any remaining issues.
```

---

## DEPLOYMENT CHECKLIST

Before first run:
- [ ] `copy .env.example .env` and fill in all required variables
- [ ] `secrets\service_account.json` present (or GOOGLE_SA_B64 set)
- [ ] Bot added as admin to the Telegram channel
- [ ] Google Sheets shared with service account email (Editor role)
- [ ] `venv\Scripts\python.exe -m pip install -r requirements.txt` completed

Railway deployment:
- [ ] `venv\Scripts\python.exe deploy\encode_sa.py secrets\service_account.json` → copy Base64
- [ ] Push to GitHub
- [ ] Railway → New Project → GitHub repo → add all .env vars + GOOGLE_SA_B64
- [ ] Railway Settings → Domain → copy URL → set as MINIAPP_URL variable
