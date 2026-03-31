"""Producer Center — AI Agents"""
from api.gemini import call_gemini, build_client_context

AGENTS = {
    "strategist":    {"name":"🎯 Стратег",         "schedule":"ежедневно"},
    "copywriter":    {"name":"✍️ Копирайтер",       "schedule":"ежедневно"},
    "analyst":       {"name":"📊 Аналитик",          "schedule":"еженедельно"},
    "advertiser":    {"name":"📢 Рекламист",         "schedule":"еженедельно"},
    "planner":       {"name":"📅 Планировщик",       "schedule":"еженедельно"},
    "unpackager":    {"name":"🧠 Распаковщик",       "schedule":"по запросу"},
    "productologist":{"name":"📦 Продуктолог",      "schedule":"по запросу"},
    "funneler":      {"name":"🌀 Воронщик",          "schedule":"по запросу"},
    "video_producer":{"name":"🎬 Видео-продюсер",   "schedule":"по запросу"},
    "podcast_agent": {"name":"🎙 Подкаст-агент",    "schedule":"1×/месяц"},
}

SYSTEM = "Ты AI-агент продюсерского центра AMAImedia. Отвечай на русском языке. Конкретно, с цифрами и сроками."

def run_agent(agent_key: str, client, extra: str = "") -> str:
    ctx = build_client_context(client)
    prompts = {
        "strategist":    f"{ctx}\n\nСоздай план дня: ТОП-3 задачи, что требует внимания, темп до KPI $20k. {extra}",
        "copywriter":    f"{ctx}\n\nНапиши 3 текста для Reels в голосе клиента: хук + основная часть + CTA. {extra}",
        "analyst":       f"{ctx}\n\nПроанализируй метрики. Что работает, что нет. 5 конкретных рекомендаций. {extra}",
        "advertiser":    f"{ctx}\n\nСоздай 9 рекламных текстов (3 группы × 3): боль→решение, желание→результат, доказательство. {extra}",
        "planner":       f"{ctx}\n\nСоздай контент-план на неделю: Пн-Вс, тема для каждого дня, тип контента. {extra}",
        "unpackager":    f"{ctx}\n\nРаспакуй личный бренд: brand story (3 абзаца), 7 ценностей, УТП (1 предложение), голос бренда, bio Instagram. {extra}",
        "productologist":f"{ctx}\n\nСоздай линейку продуктов 4 уровней: лид-магнит (free), трипваер ($100-300), основной ($300-800), наставничество ($2k-5k). Для каждого: название, цена, результат, для кого. {extra}",
        "funneler":      f"{ctx}\n\nСоздай схему воронки продаж: от трафика до наставничества. Этапы, конверсии, инструменты, прогрев-цепочка 7 дней. {extra}",
        "video_producer":f"{ctx}\n\nНапиши 5 сценариев Reels (хук 3 сек + тело 45 сек + CTA). Тип хука чередуй: вопрос, факт, цифра, секрет, история. {extra}",
        "podcast_agent": f"{ctx}\n\nСоздай 15 вопросов для подкаста. Нумерованный список. Вопросы глубокие, вызывают историю и эмоцию. {extra}",
    }
    return call_gemini(prompts.get(agent_key, f"{ctx}\n\n{extra}"), SYSTEM)
