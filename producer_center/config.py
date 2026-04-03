"""Producer Center — config"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

GEMINI_KEY = "YOUR_GEMINI_API_KEY"
VIZARD_BASE = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1"
VIZARD_KEY = "YOUR_VIZARD_API_KEY"

KPI_TARGET = 20000
KPI_BONUS_PCT = 20

# UI Colors
BG      = "#050710"
NAV     = "#08091c"
CARD    = "#0d1126"
CARD2   = "#121630"
BORDER  = "#1e1e38"
BORDER2 = "#2a2a50"
ACCENT  = "#5c6af0"
ACCENT2 = "#818cf8"
GREEN   = "#22c55e"
ORANGE  = "#f59e0b"
PINK    = "#ec4899"
RED     = "#ef4444"
CYAN    = "#06b6d4"
PURPLE  = "#8b5cf6"
TEXT    = "#e4e9ff"
TEXT2   = "#6b7db3"
TEXT3   = "#2e3d6b"
