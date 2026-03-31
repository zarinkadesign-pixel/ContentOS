# Producer Center — AMAImedia

AI-powered content production management system.

## Запуск локально

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

Открой http://localhost:8501

## Деплой на Streamlit Cloud (бесплатно)

1. Загрузи на GitHub
2. Зайди на share.streamlit.io
3. New app → выбери репо → Main file: streamlit_app.py
4. Deploy!

## Переменные окружения

Добавь в Streamlit Cloud → Settings → Secrets:
```toml
GEMINI_KEY = "ваш_ключ"
```
