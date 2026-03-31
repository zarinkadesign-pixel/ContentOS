"""
ContentOS — AI-powered content production system
Copyright (c) 2026 AMAImedia.com
backend/config.py
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_KEY", "")
VIZARD_KEY = os.getenv("VIZARD_KEY", "")

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

VIZARD_BASE = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1"

MONTHLY_TARGET = 20_000
BONUS_PCT      = 0.20
REVENUE_SHARE  = 0.30
