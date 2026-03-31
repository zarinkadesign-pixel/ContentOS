"""Producer Center — Data Models"""
from dataclasses import dataclass, field
from typing import List, Dict, Any

@dataclass
class Lead:
    id: int
    name: str
    source: str = "manual"
    contact: str = ""
    niche: str = ""
    product: str = "unknown"
    stage: str = "new"
    date: str = ""
    notes: str = ""

@dataclass
class Client:
    id: int
    name: str
    niche: str = ""
    audience: str = ""
    has: str = ""
    socials: str = ""
    income: float = 0
    goal_inc: float = 0
    goals: str = ""
    color: str = "#6366f1"
    emoji: str = "👤"
    stage: int = 0
    stage_pct: int = 10
    personality: Dict = field(default_factory=lambda: {"tone":"","story":"","values":"","usp":""})
    products: List = field(default_factory=list)
    funnel: Dict = field(default_factory=lambda: {"stages":[10000,1000,300,50,20,5,2,1]})
    strategy: str = ""
    metrics: Dict = field(default_factory=lambda: {"instagram":{"followers":0,"reach":0,"er":0.0,"leads":0}})
    content_plan: Dict = field(default_factory=lambda: {"podcast":[],"broad":[],"ads":[]})
    transactions: List = field(default_factory=list)
    checklist: Dict = field(default_factory=dict)
    alerts: List = field(default_factory=list)

@dataclass
class Finance:
    income: List = field(default_factory=list)
    expenses: List = field(default_factory=list)
    months: List = field(default_factory=lambda: [
        {"m":"Окт","v":0},{"m":"Ноя","v":0},{"m":"Дек","v":0},
        {"m":"Янв","v":0},{"m":"Фев","v":0},{"m":"Мар","v":0},
    ])

STAGE_ORDER = ["new","contacted","replied","interested","call","contract"]
STAGE_LABELS = {
    "new":        "🔵 Новый",
    "contacted":  "📤 Сообщение",
    "replied":    "💬 Ответил",
    "interested": "🔥 Заинтересован",
    "call":       "📞 Созвон",
    "contract":   "📝 Контракт",
}
STAGE_COLORS = {
    "new":"#6366f1","contacted":"#06b6d4","replied":"#f59e0b",
    "interested":"#ec4899","call":"#8b5cf6","contract":"#22c55e",
}

JOURNEY = ["Онбординг","Распаковка","Продукты","Воронка","Контент-план","Подкаст","Авто-нарезка","Реклама","Аналитика"]
JOURNEY_ICONS = ["📋","🧠","📦","🌀","📱","🎙","🎬","📢","📊"]

BMAP = [
    {"id":"s1","name":"Онбординг",         "color":"#6366f1","checks":["Данные заполнены","Цели указаны","Соцсети внесены","Время клиента"]},
    {"id":"s2","name":"Распаковка бренда", "color":"#ec4899","checks":["Brand story","Ценности (5-7)","УТП написан","Голос бренда","Bio Instagram"]},
    {"id":"s3","name":"Продуктовая линейка","color":"#06b6d4","checks":["Лид-магнит (free)","Продукт $100-300","Основной $300-800","Наставничество"]},
    {"id":"s4","name":"Воронка продаж",    "color":"#22c55e","checks":["Схема воронки","Бот настроен","Прогрев-цепочка","Скрипты продаж"]},
    {"id":"s5","name":"Контент-план",      "color":"#f59e0b","checks":["15 вопросов подкаста","20 тем широкого","9 рекл. сценариев","Buffer расписание"]},
    {"id":"s6","name":"Запись подкаста",   "color":"#f97316","checks":["Вопросы готовы","Запись 3-5ч","Google Drive","Отправлен в Vizard"]},
    {"id":"s7","name":"Авто-нарезка",      "color":"#ef4444","checks":["Клипы нарезаны","AI подписи","Расписание","Публикации вышли"]},
    {"id":"s8","name":"Реклама",           "color":"#8b5cf6","checks":["3 группы креативов","Аудитории","Бюджеты","Реклама активна"]},
    {"id":"s9","name":"Аналитика и рост",  "color":"#10b981","checks":["Неделя 1","Неделя 2","Неделя 3","Месячный отчёт"]},
]
