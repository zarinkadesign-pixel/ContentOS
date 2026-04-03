"""
Producer Center — точка входа
Запуск: python main.py
"""
import os, sys

# Добавляем папку проекта в путь
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# Shared data directory at project root (same as producer_center_app.py and engine.py)
ROOT_DIR = os.path.dirname(BASE_DIR)
DATA_DIR = os.path.join(ROOT_DIR, "pc_data")
os.makedirs(DATA_DIR, exist_ok=True)

# Создаём пустые файлы данных если нет
import json
for fname, default in [("clients.json","[]"),("leads.json","[]"),("finance.json",'{"income":[],"expenses":[],"months":[]}')]:
    path = os.path.join(DATA_DIR, fname)
    if not os.path.exists(path):
        with open(path,"w",encoding="utf-8") as f:
            f.write(default)

# Загружаем демо-данные
from core.store import create_demo_data
create_demo_data()

# Запускаем UI
from ui.app import App
app = App()
app.mainloop()
