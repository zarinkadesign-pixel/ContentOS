# 🚀 Producer Center — AMAImedia

Платформа управления продюсерским бизнесом. Тёмный UI, AI агенты, CRM, Vizard pipeline.

---

## ⚡ Быстрый старт (3 шага)

### Шаг 1 — Установи Python
Скачай с [python.org](https://python.org) → при установке **обязательно поставь галочку "Add Python to PATH"**

Проверь в cmd:
```
python --version
```
Должно показать: `Python 3.10.x` или выше

---

### Шаг 2 — Установи зависимости
Открой **cmd** (Win+R → напиши `cmd` → Enter), затем:

```
cd "C:\Users\2026\Desktop\Content OS\producer_center"
pip install -r requirements.txt
```

Подождёт 1-2 минуты пока установятся пакеты.

---

### Шаг 3 — Запусти
```
python main.py
```

Откроется окно Producer Center с тёмным UI! 🎉

---

## 🗂️ Структура

```
producer_center/
├── main.py               ← ЗАПУСК ОТСЮДА
├── config.py             ← API ключи
├── requirements.txt
├── api/
│   ├── gemini.py         ← Gemini AI
│   └── vizard.py         ← Vizard видео
├── core/
│   ├── models.py         ← Модели данных
│   ├── store.py          ← JSON хранилище
│   └── agents.py         ← 10 AI агентов
├── ui/
│   ├── app.py            ← Главное окно
│   ├── sidebar.py        ← Навигация
│   ├── dashboard.py      ← Дашборд
│   ├── crm.py            ← CRM Kanban
│   ├── clients.py        ← Список клиентов
│   ├── client_profile.py ← Профиль клиента
│   ├── products.py       ← Продукты
│   ├── vizard_pipeline.py← Vizard 4 шага
│   └── finance.py        ← Финансы
└── data/
    ├── clients.json
    ├── leads.json
    └── finance.json
```

---

## 🔑 API ключи (config.py)

```python
GEMINI_KEY  = "AIzaSyB37bqKJ7VAJcfV72iQgdqO6QCFPIvDt8U"  # уже вставлен
VIZARD_KEY  = ""  # вставь свой ключ с vizard.ai
```

---

## ❓ Частые ошибки

| Ошибка | Решение |
|--------|---------|
| `python не найден` | Переустанови Python с галочкой "Add to PATH" |
| `ModuleNotFoundError: customtkinter` | Запусти `pip install -r requirements.txt` |
| `pip не найден` | Переустанови Python, или `python -m pip install -r requirements.txt` |
| Окно не открывается | Проверь что Python 3.10+ |

---

*AMAImedia.com · Producer Center · v1.0*
