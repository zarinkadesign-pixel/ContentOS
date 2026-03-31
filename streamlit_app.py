"""NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
Copyright (c) 2026 AMAImedia.com
All rights reserved. streamlit_app.py"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st

st.set_page_config(
    page_title="Producer Center — AMAImedia",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS тёмная тема ──────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; }

/* Фон */
.stApp { background: #050710; }
section[data-testid="stSidebar"] { background: #08091c !important; border-right: 1px solid #1e1e38; }
.block-container { padding: 0 1.5rem 2rem; max-width: 1400px; }

/* Убираем декорации streamlit */
#MainMenu, footer, header { visibility: hidden; }
.stDeployButton { display: none; }

/* Карточки */
.pc-card {
    background: #0d1126;
    border: 1px solid #1e1e38;
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 10px;
}
.pc-kpi {
    background: #0d1126;
    border: 1px solid #1e1e38;
    border-radius: 14px;
    padding: 16px 18px;
    text-align: center;
}
.pc-kpi-value { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.pc-kpi-label { font-size: 11px; color: #6b7db3; }

/* Заголовок страницы */
.pc-header {
    background: #08091c;
    border-bottom: 1px solid #1e1e38;
    padding: 14px 20px;
    margin: -1rem -1.5rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.pc-header h1 { font-size: 18px; font-weight: 700; color: #e4e9ff; margin: 0; }

/* Kanban колонки */
.kanban-col {
    background: #0d1126;
    border: 1px solid #1e1e38;
    border-radius: 12px;
    padding: 10px;
    min-height: 300px;
}
.kanban-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #121630;
}
.lead-card {
    background: #121630;
    border: 1px solid #1e1e38;
    border-radius: 10px;
    padding: 10px 12px;
    margin-bottom: 8px;
}

/* Боковое меню */
.sidebar-logo {
    background: #0d1126;
    border-radius: 12px;
    padding: 10px 14px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.sidebar-logo-pc {
    background: #5c6af0;
    color: #000;
    font-weight: 700;
    font-size: 14px;
    border-radius: 8px;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
}

/* Прогресс-бар */
.pc-progress-wrap { background: #121630; border-radius: 4px; height: 8px; overflow: hidden; margin: 6px 0; }
.pc-progress-fill { height: 8px; border-radius: 4px; }

/* Теги статуса */
.pc-tag { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }

/* Разделитель */
.pc-divider { border: none; border-top: 1px solid #1e1e38; margin: 12px 0; }

/* Акцент авто */
.autopilot-card {
    background: #12083a;
    border: 1px solid #3d2a80;
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 10px;
}

/* Кнопки */
.stButton > button {
    background: #5c6af0;
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
}
.stButton > button:hover { background: #4e5adf; }
div[data-testid="stTextInput"] input,
div[data-testid="stTextArea"] textarea,
div[data-testid="stSelectbox"] div {
    background: #121630;
    border: 1px solid #2a2a50;
    color: #e4e9ff;
    border-radius: 8px;
}

/* Метрики */
[data-testid="stMetric"] {
    background: #0d1126;
    border: 1px solid #1e1e38;
    border-radius: 14px;
    padding: 14px 18px;
}
[data-testid="stMetricValue"] { color: #818cf8; font-size: 24px !important; }
[data-testid="stMetricLabel"] { color: #6b7db3; }

/* Tabs */
.stTabs [data-baseweb="tab-list"] { background: #08091c; border-radius: 10px; gap: 4px; }
.stTabs [data-baseweb="tab"] { background: transparent; color: #6b7db3; border-radius: 8px; }
.stTabs [aria-selected="true"] { background: #1a1f4e !important; color: #818cf8 !important; }

/* Текст */
p, li, label { color: #e4e9ff; }
h1, h2, h3 { color: #e4e9ff; }
.stMarkdown p { color: #6b7db3; }
</style>
""", unsafe_allow_html=True)

# ── Инициализация state ───────────────────────────────────────────────────────
if "page" not in st.session_state:
    st.session_state.page = "dashboard"
if "active_client" not in st.session_state:
    st.session_state.active_client = None

# ── Боковая панель ────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div class="sidebar-logo">
        <div class="sidebar-logo-pc">PC</div>
        <div>
            <div style="color:#e4e9ff;font-size:11px;font-weight:700;">PRODUCER CENTER</div>
            <div style="color:#2e3d6b;font-size:10px;">Director</div>
        </div>
    </div>
    <hr class="pc-divider">
    """, unsafe_allow_html=True)

    NAV = [
        ("dashboard", "📊", "Дашборд"),
        ("crm",       "🔍", "Поиск / CRM"),
        ("clients",   "👥", "Клиенты"),
        ("products",  "📦", "Продукты"),
        ("content",   "🎬", "Контент / Vizard"),
        ("finance",   "💰", "Финансы"),
    ]
    for key, icon, label in NAV:
        active = st.session_state.page == key
        style = "background:#1a1f4e;color:#818cf8;" if active else "color:#6b7db3;"
        if st.sidebar.button(
            f"{icon}  {label}",
            key=f"nav_{key}",
            use_container_width=True,
            type="secondary" if not active else "primary",
        ):
            st.session_state.page = key
            st.rerun()

    st.markdown("<hr class='pc-divider'>", unsafe_allow_html=True)
    st.markdown(
        "<div style='padding:8px 4px;font-size:11px;color:#6b7db3;'>"
        "<span style='color:#22c55e;'>●</span> Gemini API активен</div>",
        unsafe_allow_html=True
    )

# ── Загрузка данных ───────────────────────────────────────────────────────────
from core.store import (
    load_clients, load_leads, load_finance,
    add_client, add_lead, move_lead, delete_lead, add_transaction
)
from core.models import STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, JOURNEY, JOURNEY_ICONS, BMAP
from config import KPI_TARGET, GEMINI_KEY
from core.agents import run_agent
from api.gemini import call_gemini, build_client_context


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: ДАШБОРД
# ══════════════════════════════════════════════════════════════════════════════
def page_dashboard():
    st.markdown("""
    <div class="pc-header">
        <h1>📊 Командный центр</h1>
    </div>
    """, unsafe_allow_html=True)

    clients = load_clients()
    leads   = load_leads()
    fin     = load_finance()
    income  = sum(t.get("amount", 0) for t in fin.income)
    expenses= sum(e.get("amount", 0) for e in fin.expenses)
    profit  = income - expenses
    kpi_pct = min(1.0, income / KPI_TARGET)

    # KPI карточки
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.metric("💰 Прибыль", f"${profit:,.0f}", delta=None)
    with c2:
        st.metric("🔍 Лидов", len(leads))
    with c3:
        st.metric("📦 Студентов", len(clients))
    with c4:
        st.metric("👥 Клиентов", len(clients))

    # KPI прогресс
    st.markdown("<div class='pc-card'>", unsafe_allow_html=True)
    col_a, col_b = st.columns([4, 1])
    with col_a:
        st.markdown(f"<div style='font-size:13px;font-weight:700;color:#e4e9ff;margin-bottom:8px;'>KPI: ${KPI_TARGET:,}/мес</div>", unsafe_allow_html=True)
        pct_color = "#22c55e" if kpi_pct >= 1 else ("#f59e0b" if kpi_pct >= 0.7 else "#ef4444")
        st.markdown(f"""
        <div class="pc-progress-wrap">
            <div class="pc-progress-fill" style="width:{int(kpi_pct*100)}%;background:{pct_color};"></div>
        </div>
        """, unsafe_allow_html=True)
    with col_b:
        st.markdown(f"<div style='color:{pct_color};font-weight:700;font-size:14px;text-align:right;padding-top:28px;'>${income:,.0f} · {int(kpi_pct*100)}%</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

    # Два столбца
    col_left, col_right = st.columns(2)
    with col_left:
        st.markdown("<div class='pc-card'><div style='font-size:12px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>🔍 Лиды по этапам</div>", unsafe_allow_html=True)
        for stage, label in list(STAGE_LABELS.items())[:6]:
            count = sum(1 for l in leads if l.stage == stage)
            color = STAGE_COLORS.get(stage, "#6b7db3")
            st.markdown(f"""
            <div style='display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #1e1e38;'>
                <span style='color:#6b7db3;font-size:12px;'>{label}</span>
                <span style='color:{color};font-weight:700;font-size:12px;'>{count}</span>
            </div>
            """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with col_right:
        st.markdown("<div class='pc-card'><div style='font-size:12px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>📦 Продукты</div>", unsafe_allow_html=True)
        for name, val, color in [
            ("📱 Мини-курс", "$97 · пассив", "#818cf8"),
            ("🎓 Наставничество", "$1,500", "#ec4899"),
            ("🚀 Продюсирование", "$3k/мес", "#22c55e"),
        ]:
            st.markdown(f"""
            <div style='display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e1e38;'>
                <span style='color:#6b7db3;font-size:12px;'>{name}</span>
                <span style='color:{color};font-weight:700;font-size:12px;'>{val}</span>
            </div>
            """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    # Автопилот
    st.markdown("""
    <div class="autopilot-card">
        <div style='font-size:28px;margin-bottom:6px;'>⚡</div>
        <div style='font-size:16px;font-weight:700;color:#fff;'>АВТОПИЛОТ АКТИВЕН</div>
        <div style='font-size:11px;color:#a78bfa;margin-top:4px;'>Агенты работают · Директор одобряет 15 мин/день</div>
    </div>
    """, unsafe_allow_html=True)

    # AI Брифинг
    st.markdown("<div class='pc-card'><div style='font-size:12px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>🤖 Брифинг дня</div>", unsafe_allow_html=True)
    if st.button("⚡ Запустить брифинг", key="briefing_btn"):
        with st.spinner("Генерирую брифинг..."):
            new_l = sum(1 for l in leads if l.stage == "new")
            result = run_agent(
                "strategist", clients[0] if clients else None,
                extra=f"Всего лидов: {len(leads)} (новых: {new_l}), KPI: ${income}/${KPI_TARGET}, клиентов: {len(clients)}."
            )
            st.session_state["briefing"] = result
    if "briefing" in st.session_state:
        st.markdown(f"""
        <div style='background:#121630;border-radius:8px;padding:14px;font-size:12px;color:#e4e9ff;white-space:pre-wrap;margin-top:8px;'>
        {st.session_state["briefing"]}
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("<div style='color:#6b7db3;font-size:12px;'>Нажми «⚡ Запустить» — AI подготовит сводку дня...</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

    # Кнопка перехода в CRM
    if st.button("+ Новый лид →", key="goto_crm"):
        st.session_state.page = "crm"
        st.rerun()


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: CRM KANBAN
# ══════════════════════════════════════════════════════════════════════════════
def page_crm():
    st.markdown("""
    <div class="pc-header">
        <h1>🔍 Поиск клиентов — CRM</h1>
    </div>
    """, unsafe_allow_html=True)

    leads = load_leads()
    total = len(leads)
    new_c = sum(1 for l in leads if l.stage == "new")
    call_c = sum(1 for l in leads if l.stage == "call")

    st.markdown(f"""
    <div style='background:#08091c;padding:8px 16px;margin:-8px -1.5rem 16px;border-bottom:1px solid #1e1e38;
                font-size:11px;color:#6b7db3;'>
        Всего: <b style='color:#e4e9ff;'>{total}</b>  ·
        Новых: <b style='color:#6366f1;'>{new_c}</b>  ·
        Созвон: <b style='color:#8b5cf6;'>{call_c}</b>
    </div>
    """, unsafe_allow_html=True)

    # Форма добавления лида
    with st.expander("➕ Добавить новый лид", expanded=False):
        with st.form("add_lead_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                l_name    = st.text_input("Имя / Компания", placeholder="Алина Морозова")
                l_contact = st.text_input("Контакт (@TG / телефон)", placeholder="@username")
            with col2:
                l_niche  = st.text_input("Ниша / Бизнес", placeholder="Нутрициология")
                l_source = st.selectbox("Источник", ["telegram","gis","instagram","ads","referral","manual"])
            if st.form_submit_button("✅ Добавить лид", use_container_width=True):
                if l_name.strip():
                    add_lead({"name": l_name.strip(), "contact": l_contact.strip(),
                               "niche": l_niche.strip(), "source": l_source})
                    st.success("Лид добавлен!")
                    st.rerun()

    SOURCE_ICONS = {"telegram":"✈️","gis":"🗺","instagram":"📸",
                    "ads":"📢","referral":"🤝","manual":"✏️","unknown":"❓"}

    # Kanban — 6 колонок по стадиям
    cols = st.columns(len(STAGE_ORDER))
    for col, stage in zip(cols, STAGE_ORDER):
        stage_leads = [l for l in leads if l.stage == stage]
        color = STAGE_COLORS.get(stage, "#6366f1")
        label = STAGE_LABELS.get(stage, stage)

        with col:
            st.markdown(f"""
            <div style='background:#0d1126;border:1px solid #1e1e38;border-radius:12px;padding:10px;min-height:300px;'>
            <div style='display:flex;align-items:center;gap:8px;padding:8px;background:#121630;border-radius:8px;margin-bottom:10px;border-left:4px solid {color};'>
                <span style='font-size:12px;font-weight:700;color:#e4e9ff;'>{label}</span>
                <span style='margin-left:auto;font-size:11px;color:#6b7db3;font-weight:700;'>{len(stage_leads)}</span>
            </div>
            """, unsafe_allow_html=True)

            for lead in stage_leads:
                icon = SOURCE_ICONS.get(lead.source, "❓")
                st.markdown(f"""
                <div style='background:#121630;border:1px solid #1e1e38;border-radius:10px;padding:10px 12px;margin-bottom:8px;border-top:3px solid {color};'>
                    <div style='font-size:12px;font-weight:700;color:#e4e9ff;margin-bottom:3px;'>{icon} {lead.name}</div>
                    <div style='font-size:10px;color:#6b7db3;'>{lead.niche or lead.source} · {lead.date}</div>
                    {f"<div style='font-size:10px;color:#2e3d6b;'>{lead.contact}</div>" if lead.contact else ""}
                </div>
                """, unsafe_allow_html=True)

                idx = STAGE_ORDER.index(stage)
                btn_cols = st.columns([1,1,1,1])
                if idx > 0:
                    with btn_cols[0]:
                        if st.button("←", key=f"back_{lead.id}_{stage}"):
                            move_lead(lead.id, STAGE_ORDER[idx - 1])
                            st.rerun()
                if idx < len(STAGE_ORDER) - 1:
                    with btn_cols[1]:
                        if st.button("→", key=f"fwd_{lead.id}_{stage}"):
                            move_lead(lead.id, STAGE_ORDER[idx + 1])
                            st.rerun()
                with btn_cols[2]:
                    if st.button("🤖", key=f"ai_{lead.id}_{stage}"):
                        with st.spinner(f"AI пишет для {lead.name}..."):
                            msg = call_gemini(
                                f"Напиши персональное первое сообщение для {lead.name}. "
                                f"Ниша: {lead.niche or 'не указана'}. Контакт: {lead.contact}. "
                                f"Источник: {lead.source}. 3-4 предложения, живой язык, заверши вопросом.",
                                "Ты пишешь первые сообщения потенциальным клиентам продюсерского агентства."
                            )
                            st.session_state[f"ai_msg_{lead.id}"] = msg
                with btn_cols[3]:
                    if st.button("✕", key=f"del_{lead.id}_{stage}"):
                        delete_lead(lead.id)
                        st.rerun()

                if f"ai_msg_{lead.id}" in st.session_state:
                    st.text_area(f"AI сообщение для {lead.name}",
                                  st.session_state[f"ai_msg_{lead.id}"],
                                  height=120, key=f"ta_{lead.id}")

            st.markdown("</div>", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: КЛИЕНТЫ
# ══════════════════════════════════════════════════════════════════════════════
def page_clients():
    st.markdown("""
    <div class="pc-header">
        <h1>👥 Клиенты на продюсировании</h1>
    </div>
    """, unsafe_allow_html=True)

    clients = load_clients()

    with st.expander("➕ Добавить клиента", expanded=False):
        with st.form("add_client_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            with col1:
                c_name    = st.text_input("Имя")
                c_niche   = st.text_input("Ниша")
                c_audience= st.text_input("Аудитория", placeholder="Женщины 28-42")
                c_has     = st.text_input("Что уже есть", placeholder="Instagram 5k")
            with col2:
                c_socials  = st.text_input("Соцсети", placeholder="@username")
                c_income   = st.number_input("Доход сейчас ($)", min_value=0, value=5000)
                c_goal_inc = st.number_input("Цель ($)", min_value=0, value=20000)
                c_goals    = st.text_input("Цели", placeholder="Запустить курс")
            if st.form_submit_button("✅ Добавить клиента", use_container_width=True):
                if c_name.strip():
                    add_client({
                        "name": c_name.strip(), "niche": c_niche.strip(),
                        "audience": c_audience.strip(), "has": c_has.strip(),
                        "socials": c_socials.strip(), "income": float(c_income),
                        "goal_inc": float(c_goal_inc), "goals": c_goals.strip(),
                    })
                    st.success("Клиент добавлен!")
                    st.rerun()

    if not clients:
        st.markdown("<div style='color:#6b7db3;text-align:center;padding:40px;'>Нет клиентов. Нажми «+ Добавить клиента»</div>", unsafe_allow_html=True)
        return

    for c in clients:
        stage_txt = f"{JOURNEY_ICONS[c.stage]} {JOURNEY[c.stage]}" if c.stage < len(JOURNEY) else ""
        share = c.income * 0.3
        alerts_html = f"<div style='color:#ef4444;font-size:10px;margin-top:4px;'>{c.alerts[0]}</div>" if c.alerts else ""

        col_main, col_rev = st.columns([5, 1])
        with col_main:
            st.markdown(f"""
            <div class="pc-card" style="cursor:pointer;">
                <div style='display:flex;align-items:center;gap:14px;'>
                    <div style='background:{c.color}22;color:{c.color};font-size:26px;
                                width:48px;height:48px;border-radius:12px;
                                display:flex;align-items:center;justify-content:center;
                                flex-shrink:0;'>{c.emoji}</div>
                    <div style='flex:1;'>
                        <div style='display:flex;align-items:center;gap:8px;margin-bottom:3px;'>
                            <span style='font-size:14px;font-weight:700;color:#e4e9ff;'>{c.name}</span>
                            <span class='pc-tag' style='background:{c.color}22;color:{c.color};'>{stage_txt}</span>
                        </div>
                        <div style='font-size:11px;color:#6b7db3;'>{c.niche} · {c.socials}</div>
                        <div class='pc-progress-wrap' style='width:220px;'>
                            <div class='pc-progress-fill' style='width:{c.stage_pct}%;background:{c.color};'></div>
                        </div>
                        <div style='font-size:10px;font-weight:700;color:{c.color};'>{c.stage_pct}%</div>
                        {alerts_html}
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with col_rev:
            st.markdown(f"""
            <div style='text-align:right;padding-top:18px;'>
                <div style='font-size:14px;font-weight:700;color:#22c55e;'>+${share:,.0f}/мес</div>
                <div style='font-size:10px;color:#6b7db3;'>30%</div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Открыть →", key=f"open_client_{c.id}"):
                st.session_state.active_client = c.id
                st.session_state.page = "profile"
                st.rerun()


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: ПРОФИЛЬ КЛИЕНТА
# ══════════════════════════════════════════════════════════════════════════════
def page_profile():
    from core.store import get_client, update_client

    client_id = st.session_state.active_client
    c = get_client(client_id) if client_id else None

    if not c:
        st.warning("Клиент не выбран. Вернись в раздел Клиенты.")
        if st.button("← Клиенты"):
            st.session_state.page = "clients"
            st.rerun()
        return

    if st.button("← Назад к клиентам"):
        st.session_state.page = "clients"
        st.rerun()

    stage_txt = f"{JOURNEY_ICONS[c.stage]} {JOURNEY[c.stage]}" if c.stage < len(JOURNEY) else ""
    st.markdown(f"""
    <div class="pc-header">
        <h1>{c.emoji} {c.name}</h1>
        <span class='pc-tag' style='background:{c.color}22;color:{c.color};font-size:12px;'>{stage_txt}</span>
    </div>
    """, unsafe_allow_html=True)

    tabs = st.tabs(["📊 Обзор", "🧠 Бренд", "📦 Продукты", "🌀 Воронка", "📱 Контент-план", "🤖 AI-агенты", "✅ Чеклист"])

    # Таб 1: Обзор
    with tabs[0]:
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("💰 Доход сейчас", f"${c.income:,.0f}/мес")
        with col2:
            st.metric("🎯 Цель", f"${c.goal_inc:,.0f}/мес")
        with col3:
            share = c.income * 0.3
            st.metric("🚀 Наша доля (30%)", f"${share:,.0f}/мес")

        st.markdown("<div class='pc-card'>", unsafe_allow_html=True)
        st.markdown(f"**Ниша:** {c.niche}")
        st.markdown(f"**Аудитория:** {c.audience or '—'}")
        st.markdown(f"**Что есть:** {c.has or '—'}")
        st.markdown(f"**Соцсети:** {c.socials or '—'}")
        st.markdown(f"**Цели:** {c.goals or '—'}")
        st.markdown("</div>", unsafe_allow_html=True)

        # Прогресс по этапам
        st.markdown("<div class='pc-card'><b>Путь клиента</b>", unsafe_allow_html=True)
        stage_cols = st.columns(len(JOURNEY))
        for i, (sc, ji, jn) in enumerate(zip(stage_cols, JOURNEY_ICONS, JOURNEY)):
            done = i < c.stage
            active = i == c.stage
            color = c.color if active else ("#22c55e" if done else "#1e1e38")
            text_color = "#e4e9ff" if (active or done) else "#2e3d6b"
            with sc:
                st.markdown(f"""
                <div style='text-align:center;padding:8px 4px;border-radius:8px;
                            background:{color}22;border:1px solid {color};'>
                    <div style='font-size:16px;'>{ji}</div>
                    <div style='font-size:9px;color:{text_color};font-weight:600;'>{jn}</div>
                </div>
                """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

        if c.alerts:
            for alert in c.alerts:
                st.warning(alert)

    # Таб 2: Бренд
    with tabs[1]:
        p = c.personality or {}
        with st.form("brand_form"):
            tone   = st.text_area("🎙 Голос бренда / Тон", value=p.get("tone", ""), height=80)
            story  = st.text_area("📖 Brand Story", value=p.get("story", ""), height=120)
            values = st.text_area("💎 Ценности", value=p.get("values", ""), height=80)
            usp    = st.text_area("⚡ УТП (одно предложение)", value=p.get("usp", ""), height=60)
            if st.form_submit_button("💾 Сохранить бренд"):
                update_client(c.id, {"personality": {"tone": tone, "story": story, "values": values, "usp": usp}})
                st.success("Сохранено!")
                st.rerun()

        if st.button("🤖 AI Распаковать бренд"):
            with st.spinner("AI распаковывает бренд..."):
                result = run_agent("unpackager", c)
                st.session_state["brand_result"] = result
        if "brand_result" in st.session_state:
            st.text_area("Результат AI", st.session_state["brand_result"], height=300)

    # Таб 3: Продукты
    with tabs[2]:
        if st.button("🤖 AI Создать линейку продуктов"):
            with st.spinner("Создаю линейку продуктов..."):
                result = run_agent("productologist", c)
                st.session_state["products_result"] = result
        if "products_result" in st.session_state:
            st.text_area("Линейка продуктов", st.session_state["products_result"], height=300)
            st.markdown("---")

        st.subheader("Текущие продукты")
        prods = c.products or []
        if not prods:
            st.markdown("<div style='color:#6b7db3;'>Продуктов нет</div>", unsafe_allow_html=True)
        for i, pr in enumerate(prods):
            col1, col2, col3 = st.columns([3, 1, 1])
            with col1:
                st.markdown(f"**{pr.get('name','?')}** — {pr.get('desc','')}")
            with col2:
                st.markdown(f"<span style='color:#22c55e;font-weight:700;'>${pr.get('price',0):,.0f}</span>", unsafe_allow_html=True)
            with col3:
                if st.button("✕", key=f"del_prod_{c.id}_{i}"):
                    prods.pop(i)
                    update_client(c.id, {"products": prods})
                    st.rerun()

        with st.form("add_product_form", clear_on_submit=True):
            col1, col2, col3 = st.columns([3,1,2])
            with col1: p_name = st.text_input("Название")
            with col2: p_price = st.number_input("Цена $", min_value=0)
            with col3: p_desc  = st.text_input("Описание")
            if st.form_submit_button("+ Добавить продукт"):
                prods.append({"name": p_name, "price": p_price, "desc": p_desc})
                update_client(c.id, {"products": prods})
                st.rerun()

    # Таб 4: Воронка
    with tabs[3]:
        if st.button("🤖 AI Создать воронку"):
            with st.spinner("Создаю воронку продаж..."):
                result = run_agent("funneler", c)
                st.session_state["funnel_result"] = result
        if "funnel_result" in st.session_state:
            st.text_area("Воронка", st.session_state["funnel_result"], height=300)

        st.subheader("Конверсионная воронка")
        funnel_data = c.funnel.get("stages", [10000, 1000, 300, 50, 20, 5, 2, 1]) if c.funnel else []
        funnel_labels = ["Охват","Показы","Переходы","Лиды","Созвоны","Договоры","Клиенты","Адвокаты"]
        for i, (lbl, val) in enumerate(zip(funnel_labels[:len(funnel_data)], funnel_data)):
            width = max(10, int(val / (funnel_data[0] or 1) * 100)) if funnel_data else 10
            st.markdown(f"""
            <div style='margin-bottom:6px;'>
                <div style='display:flex;justify-content:space-between;font-size:11px;color:#6b7db3;margin-bottom:3px;'>
                    <span>{lbl}</span><span style='color:#818cf8;font-weight:700;'>{val:,}</span>
                </div>
                <div class='pc-progress-wrap'>
                    <div class='pc-progress-fill' style='width:{width}%;background:#5c6af0;'></div>
                </div>
            </div>
            """, unsafe_allow_html=True)

    # Таб 5: Контент-план
    with tabs[4]:
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🤖 AI Контент-план на неделю"):
                with st.spinner("Создаю контент-план..."):
                    result = run_agent("planner", c)
                    st.session_state["plan_result"] = result
            if "plan_result" in st.session_state:
                st.text_area("Контент-план", st.session_state["plan_result"], height=280)
        with col2:
            if st.button("🎬 AI Сценарии Reels"):
                with st.spinner("Создаю сценарии..."):
                    result = run_agent("video_producer", c)
                    st.session_state["reels_result"] = result
            if "reels_result" in st.session_state:
                st.text_area("Сценарии Reels", st.session_state["reels_result"], height=280)

        if st.button("🎙 AI Вопросы для подкаста"):
            with st.spinner("Генерирую вопросы..."):
                result = run_agent("podcast_agent", c)
                st.session_state["podcast_result"] = result
        if "podcast_result" in st.session_state:
            st.text_area("Вопросы для подкаста", st.session_state["podcast_result"], height=300)

    # Таб 6: AI-агенты
    with tabs[5]:
        from core.agents import AGENTS
        st.markdown("<div class='pc-card'><b style='color:#e4e9ff;'>Все агенты</b>", unsafe_allow_html=True)
        agent_cols = st.columns(2)
        for i, (key, info) in enumerate(AGENTS.items()):
            with agent_cols[i % 2]:
                if st.button(f"{info['name']} ({info['schedule']})", key=f"agent_{key}_{c.id}", use_container_width=True):
                    with st.spinner(f"Запускаю {info['name']}..."):
                        result = run_agent(key, c)
                        st.session_state[f"agent_result_{key}"] = result
                if f"agent_result_{key}" in st.session_state:
                    st.text_area(f"Результат {info['name']}", st.session_state[f"agent_result_{key}"], height=200, key=f"ar_{key}_{c.id}")
        st.markdown("</div>", unsafe_allow_html=True)

    # Таб 7: Чеклист
    with tabs[6]:
        checklist_data = c.checklist or {}
        from core.store import update_client as uc
        for step in BMAP:
            completed = sum(1 for ch in step["checks"] if checklist_data.get(f"{step['id']}_{ch}"))
            total_ch = len(step["checks"])
            pct = int(completed / total_ch * 100) if total_ch else 0
            st.markdown(f"""
            <div class='pc-card'>
                <div style='display:flex;align-items:center;gap:10px;margin-bottom:8px;'>
                    <div style='width:10px;height:10px;border-radius:50%;background:{step["color"]};flex-shrink:0;'></div>
                    <b style='color:#e4e9ff;font-size:13px;'>{step["name"]}</b>
                    <span style='margin-left:auto;color:{step["color"]};font-size:11px;font-weight:700;'>{pct}%</span>
                </div>
                <div class='pc-progress-wrap'>
                    <div class='pc-progress-fill' style='width:{pct}%;background:{step["color"]};'></div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            for ch in step["checks"]:
                ck_key = f"{step['id']}_{ch}"
                val = st.checkbox(ch, value=bool(checklist_data.get(ck_key)), key=f"ck_{c.id}_{ck_key}")
                if val != bool(checklist_data.get(ck_key)):
                    checklist_data[ck_key] = val
                    uc(c.id, {"checklist": checklist_data})
                    st.rerun()


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: ПРОДУКТЫ
# ══════════════════════════════════════════════════════════════════════════════
def page_products():
    st.markdown("""
    <div class="pc-header">
        <h1>📦 Продукты и воронки</h1>
    </div>
    """, unsafe_allow_html=True)

    products = [
        {
            "name": "📱 Мини-курс", "price": "$97",
            "desc": "Массовый продукт — полностью пассивный доход",
            "status": "✅ Готов · Воронка работает", "color": "#5c6af0",
            "funnel": ["📢 Реклама", "🌐 Лендинг", "🎥 Бесплатный урок", "📖 Статья", "💳 Оплата"],
        },
        {
            "name": "🎓 Наставничество", "price": "$1,500",
            "desc": "Обучение ведению соцсетей и бизнеса — 5 мест",
            "status": "✅ Активен · 5 мест/мес", "color": "#ec4899",
            "funnel": ["📥 Все лиды", "📞 Созвон 20 мин", "📝 Договор", "📚 Курс-модули", "⭐ Результат"],
        },
        {
            "name": "🚀 Продюсирование", "price": "$3,000/мес или 30%",
            "desc": "Полный сервис под ключ — мы делаем всё",
            "status": "✅ Активен · Под ключ", "color": "#22c55e",
            "funnel": ["📞 Созвон", "📄 AI КП", "📝 Договор", "🗺 Карта бизнеса", "💰 30%"],
        },
    ]

    for pr in products:
        color = pr["color"]
        st.markdown(f"""
        <div class='pc-card' style='border-top:4px solid {color};'>
            <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;'>
                <span style='font-size:15px;font-weight:700;color:#e4e9ff;'>{pr["name"]}</span>
                <span style='font-size:15px;font-weight:700;color:#22c55e;'>{pr["price"]}</span>
            </div>
            <div style='font-size:12px;color:#6b7db3;margin-bottom:8px;'>{pr["desc"]}</div>
            <span class='pc-tag' style='background:{color}22;color:{color};'>{pr["status"]}</span>
            <div style='margin-top:10px;font-size:11px;color:#2e3d6b;font-weight:700;'>Воронка:</div>
            <div style='display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;'>
        """, unsafe_allow_html=True)
        for step in pr["funnel"]:
            st.markdown(f"<span style='background:#121630;color:#6b7db3;font-size:10px;padding:4px 8px;border-radius:6px;'>{step}</span>", unsafe_allow_html=True)
        st.markdown("</div></div>", unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            if st.button(f"✍️ AI Рекламные тексты для {pr['name'][:10]}...", key=f"ads_{pr['name']}"):
                with st.spinner("Создаю рекламные тексты..."):
                    clients = load_clients()
                    c = clients[0] if clients else None
                    result = run_agent("advertiser", c,
                        extra=f"Продукт: {pr['name']} по цене {pr['price']}. {pr['desc']}")
                    st.session_state[f"ads_{pr['name']}"] = result
        with col2:
            if st.button(f"📞 AI Скрипт продаж для {pr['name'][:10]}...", key=f"script_{pr['name']}"):
                with st.spinner("Создаю скрипт..."):
                    clients = load_clients()
                    c = clients[0] if clients else None
                    result = run_agent("funneler", c,
                        extra=f"Продукт: {pr['name']} по цене {pr['price']}.")
                    st.session_state[f"script_{pr['name']}"] = result

        if f"ads_{pr['name']}" in st.session_state:
            st.text_area("Рекламные тексты", st.session_state[f"ads_{pr['name']}"], height=200, key=f"ads_ta_{pr['name']}")
        if f"script_{pr['name']}" in st.session_state:
            st.text_area("Скрипт продаж", st.session_state[f"script_{pr['name']}"], height=200, key=f"sc_ta_{pr['name']}")

        st.markdown("---")


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: КОНТЕНТ / VIZARD
# ══════════════════════════════════════════════════════════════════════════════
def page_content():
    from config import VIZARD_KEY
    from api.vizard import create_project, poll_project, get_ai_social

    st.markdown("""
    <div class="pc-header">
        <h1>🎬 Контент и Vizard</h1>
    </div>
    """, unsafe_allow_html=True)

    demo_mode = not VIZARD_KEY
    status_color = "#22c55e" if not demo_mode else "#f59e0b"
    status_text  = "Vizard подключён ✓" if not demo_mode else "⚠️ Демо-режим (нет Vizard ключа)"
    st.markdown(f"<div style='color:{status_color};font-size:12px;margin-bottom:16px;'>{status_text}</div>", unsafe_allow_html=True)

    # Шаг 1 — URL
    st.markdown("""<div class='pc-card' style='border-left:4px solid #5c6af0;'>
    <div style='font-size:13px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>
        <span style='background:#5c6af0;color:#fff;font-size:11px;border-radius:50%;
                     width:20px;height:20px;display:inline-flex;align-items:center;
                     justify-content:center;margin-right:6px;'>1</span>
        📤 URL видео / подкаста
    </div>""", unsafe_allow_html=True)
    video_url = st.text_input("", placeholder="https://drive.google.com/... или https://youtube.com/...",
                               label_visibility="collapsed", key="vizard_url")
    col1, col2 = st.columns(2)
    with col1:
        clips_count = st.slider("Количество клипов", 3, 15, 8)
    with col2:
        clip_duration = st.selectbox("Длина клипа", ["30-60 сек (Reels)", "60-90 сек (YouTube Shorts)", "90-120 сек (подкаст)"])
    if st.button("✂️ Нарезать клипы", use_container_width=True, key="cut_clips"):
        if demo_mode:
            st.session_state["clips"] = [
                {"videoId": 1001, "title": "Как похудеть без диет", "viralScore": "9.1", "videoMsDuration": 47000},
                {"videoId": 1002, "title": "Главная ошибка в питании", "viralScore": "8.7", "videoMsDuration": 53000},
                {"videoId": 1003, "title": "3 продукта мешающих похудеть", "viralScore": "9.4", "videoMsDuration": 39000},
            ]
            st.success("Демо-режим: 3 клипа готовы")
        else:
            with st.spinner("Отправляю видео в Vizard..."):
                pid, err = create_project(video_url, clips_count)
                if err:
                    st.error(f"Ошибка: {err}")
                else:
                    st.session_state["vizard_pid"] = pid
                    st.info(f"Проект создан: {pid}")
    st.markdown("</div>", unsafe_allow_html=True)

    # Шаг 2 — Клипы
    clips = st.session_state.get("clips", [])
    st.markdown("""<div class='pc-card' style='border-left:4px solid #f59e0b;'>
    <div style='font-size:13px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>
        <span style='background:#f59e0b;color:#fff;font-size:11px;border-radius:50%;
                     width:20px;height:20px;display:inline-flex;align-items:center;
                     justify-content:center;margin-right:6px;'>2</span>
        ✂️ Готовые клипы
    </div>""", unsafe_allow_html=True)
    if not clips:
        st.markdown("<div style='color:#6b7db3;font-size:12px;'>Клипы появятся после нарезки</div>", unsafe_allow_html=True)
    else:
        for clip in clips:
            dur = clip.get("videoMsDuration", 0) // 1000
            score = clip.get("viralScore", "?")
            score_color = "#22c55e" if float(str(score).replace("?","0")) >= 8.5 else "#f59e0b"
            st.markdown(f"""
            <div style='background:#121630;border:1px solid #1e1e38;border-radius:8px;
                        padding:10px 12px;margin-bottom:6px;display:flex;align-items:center;gap:12px;'>
                <span style='font-size:18px;'>🎬</span>
                <div style='flex:1;'>
                    <div style='font-size:12px;font-weight:700;color:#e4e9ff;'>{clip.get("title","Клип")}</div>
                    <div style='font-size:10px;color:#6b7db3;'>{dur} сек</div>
                </div>
                <span style='color:{score_color};font-weight:700;font-size:13px;'>🔥 {score}</span>
            </div>
            """, unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

    # Шаг 3 — AI Подписи
    st.markdown("""<div class='pc-card' style='border-left:4px solid #06b6d4;'>
    <div style='font-size:13px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>
        <span style='background:#06b6d4;color:#fff;font-size:11px;border-radius:50%;
                     width:20px;height:20px;display:inline-flex;align-items:center;
                     justify-content:center;margin-right:6px;'>3</span>
        ✍️ AI Подписи
    </div>""", unsafe_allow_html=True)
    if clips:
        if st.button("🤖 Генерировать подписи для всех клипов"):
            captions = []
            with st.spinner("Генерирую подписи..."):
                for clip in clips:
                    cap = call_gemini(
                        f"Напиши подпись для Reels: «{clip.get('title','')}». "
                        "Хук 1 строка + 2-3 строки текста + 3-5 хэштегов. Всё на русском.",
                        "Ты SMM-менеджер продюсерского центра."
                    )
                    captions.append({"clip": clip.get("title",""), "caption": cap})
            st.session_state["captions"] = captions
        if "captions" in st.session_state:
            for item in st.session_state["captions"]:
                st.text_area(f"📝 {item['clip']}", item["caption"], height=120, key=f"cap_{item['clip']}")
    else:
        st.markdown("<div style='color:#6b7db3;font-size:12px;'>Сначала нарежьте клипы</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

    # Шаг 4 — Расписание
    st.markdown("""<div class='pc-card' style='border-left:4px solid #ec4899;'>
    <div style='font-size:13px;font-weight:700;color:#e4e9ff;margin-bottom:10px;'>
        <span style='background:#ec4899;color:#fff;font-size:11px;border-radius:50%;
                     width:20px;height:20px;display:inline-flex;align-items:center;
                     justify-content:center;margin-right:6px;'>4</span>
        📅 Расписание публикаций
    </div>""", unsafe_allow_html=True)
    days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    times = ["09:00", "12:00", "15:00", "18:00", "20:00", "21:00"]
    col1, col2 = st.columns(2)
    with col1:
        selected_days = st.multiselect("Дни публикаций", days, default=["Пн","Ср","Пт"])
    with col2:
        selected_time = st.selectbox("Время", times, index=3)
    st.markdown(f"""
    <div style='background:#121630;border-radius:8px;padding:12px;margin-top:8px;'>
        <div style='font-size:12px;color:#6b7db3;'>
            📅 Публикации: <b style='color:#ec4899;'>{", ".join(selected_days)}</b>
            в <b style='color:#ec4899;'>{selected_time}</b> ·
            {len(clips)} клипов в очереди
        </div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# СТРАНИЦА: ФИНАНСЫ
# ══════════════════════════════════════════════════════════════════════════════
def page_finance():
    st.markdown("""
    <div class="pc-header">
        <h1>💰 Финансы и KPI</h1>
    </div>
    """, unsafe_allow_html=True)

    fin      = load_finance()
    income   = sum(t.get("amount", 0) for t in fin.income)
    expenses = sum(e.get("amount", 0) for e in fin.expenses)
    profit   = income - expenses
    margin   = int(profit / income * 100) if income > 0 else 0
    kpi_pct  = min(1.0, income / KPI_TARGET)

    c1, c2, c3, c4 = st.columns(4)
    with c1: st.metric("💰 Доход", f"${income:,.0f}")
    with c2: st.metric("📉 Расходы", f"${expenses:,.0f}")
    with c3: st.metric("✨ Прибыль", f"${profit:,.0f}")
    with c4: st.metric("📊 Маржа", f"{margin}%")

    # KPI прогресс
    st.markdown("<div class='pc-card'>", unsafe_allow_html=True)
    pct_color = "#22c55e" if kpi_pct >= 1 else ("#f59e0b" if kpi_pct >= 0.7 else "#ef4444")
    col_a, col_b = st.columns([4, 1])
    with col_a:
        st.markdown(f"<div style='font-size:13px;font-weight:700;color:#e4e9ff;margin-bottom:8px;'>KPI: ${KPI_TARGET:,}/мес</div>", unsafe_allow_html=True)
        st.markdown(f"""
        <div class='pc-progress-wrap'>
            <div class='pc-progress-fill' style='width:{int(kpi_pct*100)}%;background:{pct_color};'></div>
        </div>
        """, unsafe_allow_html=True)
    with col_b:
        st.markdown(f"<div style='color:{pct_color};font-weight:700;font-size:14px;text-align:right;padding-top:28px;'>${income:,.0f} · {int(kpi_pct*100)}%</div>", unsafe_allow_html=True)
    if kpi_pct >= 1:
        bonus = income * 0.2
        st.markdown(f"<div style='color:#22c55e;font-size:13px;font-weight:700;margin-top:8px;'>🎉 KPI выполнен! Бонус директора: ${bonus:,.0f}</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

    # По источникам
    col_src, col_months = st.columns(2)
    with col_src:
        st.markdown("<div class='pc-card'><b style='color:#e4e9ff;font-size:12px;'>По источникам</b>", unsafe_allow_html=True)
        src_map = {
            "minicourse":  ("📱 Мини-курс",      "#818cf8"),
            "mentoring":   ("🎓 Наставничество",  "#ec4899"),
            "production":  ("🚀 Продюсирование",  "#22c55e"),
            "other":       ("Другое",             "#6b7db3"),
        }
        for key, (name, color) in src_map.items():
            amt = sum(t.get("amount", 0) for t in fin.income if t.get("type") == key)
            if amt == 0: continue
            pct_w = min(100, int(amt / income * 100)) if income else 0
            st.markdown(f"""
            <div style='margin:6px 0;'>
                <div style='display:flex;justify-content:space-between;font-size:11px;color:#6b7db3;margin-bottom:3px;'>
                    <span>{name}</span>
                    <span style='color:{color};font-weight:700;'>${amt:,.0f}</span>
                </div>
                <div class='pc-progress-wrap'><div class='pc-progress-fill' style='width:{pct_w}%;background:{color};'></div></div>
            </div>
            """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with col_months:
        st.markdown("<div class='pc-card'><b style='color:#e4e9ff;font-size:12px;'>📈 По месяцам</b>", unsafe_allow_html=True)
        months_data = fin.months or []
        if months_data:
            max_v = max((m.get("v", 0) for m in months_data), default=1) or 1
            for m in months_data:
                v = m.get("v", 0)
                w = int(v / max_v * 100)
                st.markdown(f"""
                <div style='display:flex;align-items:center;gap:8px;margin-bottom:4px;'>
                    <span style='font-size:10px;color:#6b7db3;width:30px;'>{m.get("m","")}</span>
                    <div class='pc-progress-wrap' style='flex:1;'>
                        <div class='pc-progress-fill' style='width:{w}%;background:#5c6af0;'></div>
                    </div>
                    <span style='font-size:10px;color:#818cf8;font-weight:700;width:55px;text-align:right;'>${v:,}</span>
                </div>
                """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    # Добавить транзакцию
    with st.expander("➕ Добавить транзакцию"):
        with st.form("add_txn_form", clear_on_submit=True):
            col1, col2, col3 = st.columns(3)
            with col1: t_desc   = st.text_input("Описание", placeholder="Наставничество")
            with col2: t_amount = st.number_input("Сумма ($)", min_value=0.0, step=100.0)
            with col3: t_type   = st.selectbox("Тип", ["minicourse","mentoring","production","other"])
            if st.form_submit_button("✅ Добавить транзакцию", use_container_width=True):
                if t_desc.strip() and t_amount > 0:
                    add_transaction(t_desc.strip(), float(t_amount), t_type)
                    st.success("Транзакция добавлена!")
                    st.rerun()

    # Последние транзакции
    st.markdown("<div class='pc-card'><b style='color:#e4e9ff;font-size:12px;'>Последние транзакции</b>", unsafe_allow_html=True)
    txns = list(reversed(fin.income[-15:]))
    if not txns:
        st.markdown("<div style='color:#6b7db3;font-size:12px;'>Транзакций нет</div>", unsafe_allow_html=True)
    for t in txns:
        type_labels = {"minicourse":"📱","mentoring":"🎓","production":"🚀","other":"💼"}
        icon = type_labels.get(t.get("type","other"), "💼")
        st.markdown(f"""
        <div style='display:flex;justify-content:space-between;padding:8px 0;
                    border-bottom:1px solid #1e1e38;font-size:12px;'>
            <span style='color:#6b7db3;'>{icon} {t.get("desc","?")} · {t.get("date","")}</span>
            <span style='color:#22c55e;font-weight:700;'>+${t.get("amount",0):,.0f}</span>
        </div>
        """, unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)


# ══════════════════════════════════════════════════════════════════════════════
# РОУТЕР
# ══════════════════════════════════════════════════════════════════════════════
page = st.session_state.page

if page == "dashboard":  page_dashboard()
elif page == "crm":      page_crm()
elif page == "clients":  page_clients()
elif page == "profile":  page_profile()
elif page == "products": page_products()
elif page == "content":  page_content()
elif page == "finance":  page_finance()
