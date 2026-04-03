"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────
interface UserProfile {
  name: string; niche: string; audience: string; products: string;
  revenue: string; subs: string; avgCheck: string; budget: string;
  channels: string[]; tone: string; marketAnalysis?: string;
  competitorAnalysis?: string; strategy?: string;
  audience_pains?: string;
  flagship_product?: string;
  income_goal?: string;
  utp?: string;
  content_topics?: string;
  expertise?: string;
  onboarding_completed?: boolean;
}
interface Note { id: number; title: string; sub: string; body: string; full: string; }
interface Product { id: number; name: string; type: string; price: string; tasks: Task[]; }
interface Task { id: number; label: string; done: boolean; date: string; }
interface Goal { id: number; name: string; current: number; target: number; unit: string; }
interface FunnelBlock {
  name: string; type: string; count: number; conv: number;
  tag: string; label: string; subtag: string; canDelete?: boolean;
}
interface BotMessage { id: number; step: string; stepType: string; text: string; }
interface CalPlan { id: number; date: string; platform: string; type: string; topic: string; text: string; }

const TABS = [
  { id: "dash", icon: "🏠", label: "ДОМ" },
  { id: "strat", icon: "🧠", label: "СТРАТЕГ" },
  { id: "map", icon: "🌀", label: "ВОРОНКА" },
  { id: "gen", icon: "✍️", label: "ТЕКСТ" },
  { id: "ads", icon: "🎬", label: "РЕКЛАМА" },
  { id: "bot", icon: "🤖", label: "БОТ" },
  { id: "prod", icon: "📦", label: "ПРОД." },
  { id: "goals", icon: "🎯", label: "ЦЕЛИ" },
  { id: "plan", icon: "📅", label: "НЕДЕЛЯ" },
  { id: "visual", icon: "🎞️", label: "ВИЗУАЛ" },
  { id: "landing", icon: "🌐", label: "ЛЕНДИНГ" },
  { id: "notes", icon: "📝", label: "ЗАМЕТКИ" },
];

const GEN_TYPES: Record<string, string[]> = {
  Instagram: ["Рилс (озвучка)", "Сторис", "Карусель", "Пост"],
  Telegram: ["Пост в канал", "Бот-серия"],
  TikTok: ["Скрипт"],
  YouTube: ["Скрипт"],
  Email: ["Письмо"],
  Blog: ["Статья"],
};

const TONES = ["экспертный", "дружеский", "мотивирующий", "провокационный", "storytelling"];
const FUNNEL_GOALS = ["прогрев аудитории", "продажа продукта", "запись на звонок", "подписка", "лид-магнит"];
const ADS_FORMATS = [
  { id: "image", icon: "🖼️", name: "Картинка", sub: "Статичный баннер + описание", tags: ["Meta Ads", "ВКонтакте"] },
  { id: "video", icon: "🎬", name: "Видео", sub: "Рекламный ролик + скрипт", tags: ["Reels Ads", "TikTok"] },
  { id: "voiceover", icon: "🎙️", name: "Озвучка", sub: "Скрипт + монтаж + тайм-коды", tags: ["YouTube", "Podcast"] },
];
interface OBQuestion {
  key: keyof UserProfile;
  label: string;
  hint: string;
  placeholder: string;
  type: "text" | "multiline" | "channels" | "tone";
  optional?: boolean;
}

const ONBOARDING_QUESTIONS: OBQuestion[] = [
  { key: "name",             label: "Ваше имя и название бренда",        hint: "Как вас зовут? Как называется ваш проект?",                    placeholder: "Зарина Галымжан, бренд @amai.media",         type: "text" },
  { key: "niche",            label: "Ниша и специализация",              hint: "Чем вы занимаетесь? Опишите направление.",                     placeholder: "Онлайн-продюсирование, SMM-агентство...",    type: "multiline" },
  { key: "audience",         label: "Целевая аудитория",                 hint: "Кто ваш идеальный клиент? Возраст, интересы, ситуация.",       placeholder: "Эксперты и коучи 25-40 лет, digital nomad...",type: "multiline" },
  { key: "audience_pains",   label: "Боли и проблемы аудитории",         hint: "Что мешает вашим клиентам достичь цели?",                      placeholder: "Нет системы, не знают как монетизировать...", type: "multiline" },
  { key: "products",         label: "Продукты и услуги",                 hint: "Что именно вы продаёте? Перечислите всё.",                     placeholder: "Аудит Instagram, менторинг, продакшн...",     type: "multiline" },
  { key: "avgCheck",         label: "Ценовой диапазон",                  hint: "Какие цены на ваши продукты/услуги?",                          placeholder: "Аудит $150, Менторинг $1500, Продакшн $3000/мес", type: "multiline" },
  { key: "flagship_product", label: "Флагманский продукт",               hint: "Ваш основной продукт и его цена.",                             placeholder: "Продюсирование под ключ — $3000/мес",         type: "text" },
  { key: "revenue",          label: "Текущий ежемесячный доход ($)",     hint: "Сколько зарабатываете сейчас? Только цифра.",                  placeholder: "5000",                                        type: "text" },
  { key: "income_goal",      label: "Цель по доходу ($) в месяц",       hint: "К чему хотите прийти? Конкретная сумма.",                      placeholder: "20000",                                       type: "text" },
  { key: "budget",           label: "Маркетинговый бюджет ($) в месяц", hint: "Сколько готовы вкладывать в продвижение?",                     placeholder: "500",                                         type: "text" },
  { key: "channels",         label: "Каналы продвижения",                hint: "Где вы уже присутствуете или планируете?",                     placeholder: "",                                            type: "channels" },
  { key: "tone",             label: "Тон и стиль общения",               hint: "Как вы говорите со своей аудиторией?",                         placeholder: "",                                            type: "tone" },
  { key: "utp",              label: "Уникальное торговое предложение",   hint: "Чем вы отличаетесь от конкурентов?",                           placeholder: "Клиент снимает видео раз в месяц — всё остальное делаю я", type: "multiline" },
  { key: "content_topics",   label: "Темы для контента",                 hint: "О чём хотите говорить? Любимые темы.",                         placeholder: "AI-инструменты, кейсы клиентов, жизнь в Нячанге...", type: "multiline" },
  { key: "expertise",        label: "Ваша экспертиза и опыт",            hint: "Что вы знаете лучше всего? Ваш путь, достижения.",             placeholder: "7 лет в дизайне, 3 года продюсирование, 50+ клиентов...", type: "multiline", optional: true },
];

const TARGET_PLATFORMS = [
  { id: "Instagram", icon: "📸" }, { id: "Facebook", icon: "👤" }, { id: "TikTok", icon: "🎵" },
  { id: "YouTube", icon: "▶️" }, { id: "ВКонтакте", icon: "🔵" }, { id: "Telegram", icon: "✈️" },
];
const BOT_CHAINS = [
  { id: "warm7", icon: "🔥", name: "7 дней прогрева", sub: "Цепочка для холодной аудитории" },
  { id: "sell5", icon: "💰", name: "5 шагов продажи", sub: "От интереса до оплаты" },
  { id: "welcome", icon: "👋", name: "Приветственная", sub: "Онбординг нового подписчика" },
  { id: "call", icon: "📞", name: "Запись на звонок", sub: "Квалификация + бронь" },
  { id: "onboard", icon: "🎓", name: "Онбординг клиента", sub: "После оплаты продукта" },
];

const mkBlocks = (): FunnelBlock[] => [
  { name: "Трафик", type: "traffic", count: 1000, conv: 5, tag: "TRAFFIC", label: "Охват", subtag: "Видео" },
  { name: "Подписка", type: "trigger", count: 50, conv: 30, tag: "TRIGGER", label: "Подписок", subtag: "Лид-магнит", canDelete: true },
  { name: "Бот/Прогрев", type: "bot", count: 15, conv: 50, tag: "BOT", label: "Активных", subtag: "7 дней" },
  { name: "Трипваер", type: "product", count: 8, conv: 30, tag: "PRODUCT", label: "Продаж", subtag: "$27", canDelete: true },
  { name: "Основной продукт", type: "money", count: 2, conv: 100, tag: "MONEY", label: "Клиентов", subtag: "$497" },
];

const LANDING_SECTIONS = [
  { id: "hero", label: "Hero-секция", badge: "Обязательно", color: "#C8F135" },
  { id: "problem", label: "Проблема", badge: "Боль", color: "#F135A8" },
  { id: "solution", label: "Решение", badge: "Продукт", color: "#7C3AED" },
  { id: "testimonials", label: "Отзывы", badge: "Доверие", color: "#22C55E" },
  { id: "pricing", label: "Цена и оффер", badge: "Продажа", color: "#F59E0B" },
  { id: "faq", label: "FAQ", badge: "Возражения", color: "#3B82F6" },
];

// ─── API helper ───────────────────────────────────────────────────
async function hubCall(action: string, data: Record<string, any> = {}) {
  const r = await fetch("/api/hub", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.detail || "API error");
  return j.result as string;
}

// ─── Main Component ───────────────────────────────────────────────
export default function HubPage() {
  const [tab, setTab] = useState("dash");
  const [user, setUser] = useState<UserProfile>({
    name: "", niche: "", audience: "", products: "", revenue: "0",
    subs: "0", avgCheck: "0", budget: "500", channels: [], tone: "экспертный",
  });
  const [notes, setNotes] = useState<Note[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [calPlans, setCalPlans] = useState<CalPlan[]>([]);
  const [flows, setFlows] = useState<{ id: number; name: string; color: string; blocks: FunnelBlock[] }[]>([
    { id: 1, name: "Поток 1", color: "#7C3AED", blocks: mkBlocks() },
  ]);
  const [activeFlow, setActiveFlow] = useState(0);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(true); // optimistic default

  // Persist state
  useEffect(() => {
    try {
      const s = localStorage.getItem("contentOS_state");
      if (s) {
        const p = JSON.parse(s);
        if (p.user) {
          setUser(p.user);
          if (!p.user.onboarding_completed) setOnboardingDone(false);
        } else {
          setOnboardingDone(false);
        }
        if (p.notes) setNotes(p.notes);
        if (p.products) setProducts(p.products);
        if (p.goals) setGoals(p.goals);
        if (p.calPlans) setCalPlans(p.calPlans);
        if (p.flows) setFlows(p.flows);
        if (p.botMessages) setBotMessages(p.botMessages);
      } else {
        setOnboardingDone(false);
      }
    } catch {
      setOnboardingDone(false);
    }
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback((updates: Partial<{
    user: UserProfile; notes: Note[]; products: Product[]; goals: Goal[];
    calPlans: CalPlan[]; flows: typeof flows; botMessages: BotMessage[];
  }> = {}) => {
    const current = { user, notes, products, goals, calPlans, flows, botMessages };
    const merged = { ...current, ...updates };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem("contentOS_state", JSON.stringify(merged));
    }, 300);
  }, [user, notes, products, goals, calPlans, flows, botMessages]);

  const addNote = (title: string, body: string) => {
    const n: Note = { id: Date.now(), title, sub: new Date().toLocaleDateString("ru"), body: body.slice(0, 120) + "...", full: body };
    const updated = [n, ...notes];
    setNotes(updated);
    save({ notes: updated });
  };

  const toast = (msg: string) => {
    const el = document.getElementById("hub-toast");
    if (!el) return;
    el.textContent = msg; el.classList.add("hub-toast-show");
    setTimeout(() => el.classList.remove("hub-toast-show"), 2500);
  };

  function handleOnboardingComplete(profile: Partial<UserProfile>) {
    const newUser: UserProfile = {
      ...user,
      ...profile,
      channels: (profile.channels as string[]) ?? user.channels,
      onboarding_completed: true,
    };
    setUser(newUser);
    setOnboardingDone(true);
    const current = { user: newUser, notes, products, goals, calPlans, flows, botMessages };
    localStorage.setItem("contentOS_state", JSON.stringify(current));
  }

  return (
    <div className="flex flex-col h-full bg-[#080810] overflow-hidden relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {!onboardingDone && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      {/* Subtle background tint — low saturation, fully behind content */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
        <div className="absolute w-96 h-96 rounded-full bg-purple-900 opacity-[0.025] blur-3xl -top-24 -left-24" />
        <div className="absolute w-72 h-72 rounded-full bg-indigo-900 opacity-[0.02]  blur-3xl bottom-32 -right-20" />
      </div>

      {/* Top nav tabs */}
      <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-2 bg-[#0d0d1c]/95 backdrop-blur border-b border-[#1e1e38] z-50 overflow-x-auto">
        <div className="w-8 h-8 rounded-lg bg-[#C8F135] flex items-center justify-center font-black text-xs text-black flex-shrink-0 mr-1">OS</div>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
              tab === t.id ? "bg-[#C8F135] text-black scale-105" : "text-[#50506A] hover:text-[#9090B8] hover:bg-white/5"
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span className="text-[9px] tracking-wider">{t.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowProfile(!showProfile)}
          className={`w-8 h-8 rounded-full border flex-shrink-0 ml-auto flex items-center justify-center text-sm transition-all ${
            showProfile ? "bg-purple-600 border-purple-600 text-white" : "bg-[#161628] border-[#2a2a50] text-[#9090B8]"
          }`}
        >👤</button>
      </div>

      {/* Toast */}
      <div id="hub-toast" className="hub-toast" />

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative z-10">
        {showProfile ? (
          <ProfileScreen user={user} setUser={(u: UserProfile) => { setUser(u); save({ user: u }); }} onClose={() => setShowProfile(false)} toast={toast} />
        ) : (
          <>
            {tab === "dash" && <DashScreen user={user} goals={goals} notes={notes} setTab={setTab} hubCall={hubCall} toast={toast} addNote={addNote} />}
            {tab === "strat" && <StratScreen user={user} setUser={(u: UserProfile) => { setUser(u); save({ user: u }); }} hubCall={hubCall} toast={toast} addNote={addNote} />}
            {tab === "map" && <MapScreen flows={flows} setFlows={(f: { id: number; name: string; color: string; blocks: FunnelBlock[] }[]) => { setFlows(f); save({ flows: f }); }} activeFlow={activeFlow} setActiveFlow={setActiveFlow} />}
            {tab === "gen" && <GenScreen user={user} hubCall={hubCall} toast={toast} addNote={addNote} calPlans={calPlans} setCalPlans={(c: CalPlan[]) => { setCalPlans(c); save({ calPlans: c }); }} />}
            {tab === "ads" && <AdsScreen user={user} hubCall={hubCall} toast={toast} addNote={addNote} />}
            {tab === "bot" && <BotScreen user={user} hubCall={hubCall} toast={toast} botMessages={botMessages} setBotMessages={(m: BotMessage[]) => { setBotMessages(m); save({ botMessages: m }); }} />}
            {tab === "prod" && <ProdScreen products={products} setProducts={(p: Product[]) => { setProducts(p); save({ products: p }); }} toast={toast} setTab={setTab} />}
            {tab === "goals" && <GoalsScreen goals={goals} setGoals={(g: Goal[]) => { setGoals(g); save({ goals: g }); }} user={user} hubCall={hubCall} toast={toast} />}
            {tab === "plan" && <PlanScreen user={user} hubCall={hubCall} toast={toast} addNote={addNote} calPlans={calPlans} />}
            {tab === "visual" && <VisualScreen user={user} hubCall={hubCall} toast={toast} addNote={addNote} />}
            {tab === "landing" && <LandingScreen user={user} products={products} hubCall={hubCall} toast={toast} addNote={addNote} />}
            {tab === "notes" && <NotesScreen notes={notes} setNotes={(n: Note[]) => { setNotes(n); save({ notes: n }); }} toast={toast} />}
          </>
        )}
      </div>

      <style>{`
        .hub-toast {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(20,20,40,.95); border: 1px solid #2a2a50;
          border-radius: 50px; padding: 8px 16px; font-size: 13px; color: #F0F0FF;
          z-index: 600; opacity: 0; transition: opacity .25s; pointer-events: none;
          white-space: nowrap; backdrop-filter: blur(10px);
        }
        .hub-toast.hub-toast-show { opacity: 1; }
        .result-box { background: #161628; border-radius: 12px; padding: 13px; font-size: 13px; line-height: 1.85; color: #F0F0FF; white-space: pre-wrap; max-height: 320px; overflow-y: auto; border-left: 3px solid #7C3AED; font-family: 'DM Sans', sans-serif; }
        .pill-btn { padding: 6px 13px; border-radius: 50px; border: 1.5px solid #2a2a50; background: transparent; color: #9090B8; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; }
        .pill-btn.active { background: #C8F135; color: #000; border-color: #C8F135; }
        .pill-btn.active-purple { background: #7C3AED; color: #fff; border-color: #7C3AED; }
        .hub-input { width: 100%; background: #161628; border: 1.5px solid #1e1e38; border-radius: 12px; padding: 10px 12px; font-size: 14px; color: #F0F0FF; outline: none; transition: border-color .2s; font-family: 'DM Sans', sans-serif; }
        .hub-input:focus { border-color: #7C3AED; }
        .hub-input::placeholder { color: #50506A; }
        .hub-card { background: #111120; border: 1px solid #1e1e38; border-radius: 18px; padding: 14px; }
        .hub-btn { padding: 10px 16px; border-radius: 12px; border: none; cursor: pointer; font-size: 13px; font-weight: 700; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; }
        .hub-btn-primary { background: #C8F135; color: #000; }
        .hub-btn-primary:hover { opacity: .9; transform: translateY(-1px); }
        .hub-btn-ghost { background: transparent; color: #9090B8; border: 1px solid #2a2a50; }
        .hub-btn-ghost:hover { border-color: #9090B8; color: #F0F0FF; }
        .hub-btn-purple { background: #7C3AED; color: #fff; }
        .hub-btn:disabled { opacity: .4; cursor: not-allowed; }
        .screen-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 14px 12px 80px; height: 100%; }
        .section-title { font-size: 18px; font-weight: 900; color: #F0F0FF; letter-spacing: -.5px; margin-bottom: 3px; }
        .section-sub { font-size: 12px; color: #50506A; margin-bottom: 14px; line-height: 1.4; }
      `}</style>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
function DashScreen({ user, goals, notes, setTab, hubCall, toast, addNote }: any) {
  const [loading, setLoading] = useState(false);
  const [autoPilotResult, setAutoPilotResult] = useState("");
  const [investAmt, setInvestAmt] = useState("");
  const [investResult, setInvestResult] = useState("");
  const [investLoading, setInvestLoading] = useState(false);

  const runAutoPilot = async () => {
    setLoading(true); setAutoPilotResult("⏳ Запускаю авто-пилот...");
    try {
      const r = await hubCall("autoPilot", { user, budget: user.budget || 500 });
      setAutoPilotResult(r);
      addNote("⚡ Авто-пилот план", r);
      toast("✅ Авто-пилот готов!");
    } catch (e: any) { setAutoPilotResult("❌ " + e.message); }
    setLoading(false);
  };

  const calcInvest = async () => {
    if (!investAmt) { toast("Введи бюджет"); return; }
    setInvestLoading(true); setInvestResult("⏳ Считаю...");
    try {
      const r = await hubCall("investCalc", { user, amount: investAmt });
      setInvestResult(r);
    } catch (e: any) { setInvestResult("❌ " + e.message); }
    setInvestLoading(false);
  };

  const completedGoals = goals.filter((g: Goal) => g.current >= g.target).length;

  return (
    <div className="screen-scroll">
      {/* Header */}
      <div className="mb-4">
        <div className="text-xs text-[#50506A]">Добро пожаловать,</div>
        <div className="text-2xl font-black text-white tracking-tight">{user.name || "Эксперт"}</div>
        <div className="text-sm text-[#9090B8] mt-0.5">{user.niche || "Заполни профиль →"}</div>
      </div>

      {/* ── Quick action tiles — PRIMARY, front and center ── */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: "✍️", name: "Написать текст",     sub: "Рилс, пост, YouTube", tab: "gen",   color: "#F135A8" },
          { icon: "🌀", name: "Воронка",             sub: "Mind map продаж",     tab: "map",   color: "#7C3AED" },
          { icon: "🎬", name: "Рекламные креативы",  sub: "3 формата + таргет",  tab: "ads",   color: "#F59E0B" },
          { icon: "🤖", name: "Bot Builder",         sub: "Цепочки для SendPulse", tab: "bot", color: "#06B6D4" },
          { icon: "📅", name: "Неделя контента",     sub: "Контент-план",         tab: "plan", color: "#22C55E" },
          { icon: "🌐", name: "Лендинг",             sub: "AI-страница продажи",  tab: "landing", color: "#C8F135" },
        ].map((q) => (
          <button
            key={q.tab}
            className="hub-card text-left cursor-pointer hover:border-[#3a3a60] hover:scale-[1.02] transition-all active:scale-[0.98]"
            onClick={() => setTab(q.tab)}
          >
            <div className="text-xl mb-1.5">{q.icon}</div>
            <div className="text-sm font-bold text-white leading-tight">{q.name}</div>
            <div className="text-[11px] text-[#50506A] mt-0.5">{q.sub}</div>
            <div className="text-[11px] font-bold mt-2" style={{ color: q.color }}>Открыть →</div>
          </button>
        ))}
      </div>

      {/* KPI — secondary row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Выручка",    val: user.revenue ? `$${user.revenue}` : "$0", color: "#22C55E" },
          { label: "Подписчики", val: user.subs || "0",                          color: "#a78bfa" },
          { label: "Ср. чек",   val: user.avgCheck ? `$${user.avgCheck}` : "$0", color: "#F59E0B" },
        ].map((k) => (
          <div key={k.label} className="hub-card">
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#50506A] mb-1">{k.label}</div>
            <div className="font-extrabold" style={{ color: k.color, fontSize: 15 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Autopilot — compact secondary card */}
      <div
        className="rounded-2xl p-3 mb-3 cursor-pointer border border-[#2a1a50] flex items-center gap-3"
        style={{ background: "#110d25" }}
        onClick={!loading ? runAutoPilot : undefined}
      >
        <div className="text-2xl shrink-0">⚡</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-white leading-tight">Авто-пилот</div>
          <div className="text-[11px] text-[#50506A]">Стратегия + план + воронка за 1 клик</div>
        </div>
        <button className="hub-btn hub-btn-purple text-xs shrink-0 whitespace-nowrap" disabled={loading}>
          {loading ? "⏳" : "Запустить"}
        </button>
      </div>
      {autoPilotResult && (
        <div className="result-box text-xs mb-3">{autoPilotResult}</div>
      )}

      {/* Goals summary */}
      {goals.length > 0 && (
        <div className="hub-card mb-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[#50506A] mb-2">Прогресс целей</div>
          {goals.slice(0, 3).map((g: Goal) => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            return (
              <div key={g.id} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9090B8] font-medium">{g.name}</span>
                  <span className="font-bold text-[#C8F135]">{pct}%</span>
                </div>
                <div className="h-1.5 bg-[#1c1c35] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7C3AED,#C8F135)" }} />
                </div>
              </div>
            );
          })}
          {completedGoals > 0 && <div className="text-xs text-[#22C55E] mt-2 font-bold">🏆 {completedGoals} цел{completedGoals === 1 ? "ь" : "и"} достигнуто!</div>}
        </div>
      )}

      {/* Investment calculator */}
      <div className="hub-card mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#C8F135]/10 flex items-center justify-center text-lg">💰</div>
          <div>
            <div className="text-sm font-bold text-white">Инвестиции и прогноз</div>
            <div className="text-[11px] text-[#50506A]">Введи бюджет — получи AI-прогноз</div>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="hub-input flex-1"
            placeholder="Бюджет ($)"
            type="number"
            value={investAmt}
            onChange={(e) => setInvestAmt(e.target.value)}
          />
          <button className="hub-btn hub-btn-primary" onClick={calcInvest} disabled={investLoading}>
            {investLoading ? "..." : "Считать"}
          </button>
        </div>
        {investResult && <div className="result-box mt-2 text-xs">{investResult}</div>}
      </div>

      {/* Recent notes */}
      {notes.length > 0 && (
        <div className="hub-card mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase tracking-widest text-[#50506A]">Последние заметки</div>
            <button className="text-xs text-[#7C3AED] font-bold" onClick={() => setTab("notes")}>Все →</button>
          </div>
          {notes.slice(0, 2).map((n: Note) => (
            <div key={n.id} className="bg-[#161628] rounded-xl p-3 mb-2">
              <div className="text-sm font-bold text-white mb-1">{n.title}</div>
              <div className="text-xs text-[#50506A]">{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Strategist ────────────────────────────────────────────────
function StratScreen({ user, setUser, hubCall, toast, addNote }: any) {
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [competitors, setCompetitors] = useState("");

  const run = async (action: string, key: string, extra: any = {}) => {
    setLoading((p) => ({ ...p, [key]: true }));
    setResults((p) => ({ ...p, [key]: "⏳ Анализирую..." }));
    try {
      const r = await hubCall(action, { user, competitors, ...extra });
      setResults((p) => ({ ...p, [key]: r }));
      if (key === "market") setUser({ ...user, marketAnalysis: r });
      if (key === "competitors") setUser({ ...user, competitorAnalysis: r });
      if (key === "strategy") setUser({ ...user, strategy: r });
      addNote(key === "market" ? "🌐 Анализ рынка" : key === "competitors" ? "🕵️ Конкуренты" : key === "strategy" ? "🚀 Стратегия" : "📣 План запуска", r);
      toast("✅ Готово!");
    } catch (e: any) {
      setResults((p) => ({ ...p, [key]: "❌ " + e.message }));
    }
    setLoading((p) => ({ ...p, [key]: false }));
  };

  const blocks = [
    { num: "1", title: "Анализ рынка", icon: "🌐", sub: "Размер рынка, тренды, боли аудитории, возможности роста.", key: "market", action: "marketAnalysis", btnText: "🌐 Анализировать рынок", color: "#C8F135" },
    { num: "2", title: "Конкурентный анализ", icon: "🕵️", sub: "Конкуренты, их слабые места, ваши возможности.", key: "competitors", action: "competitorAnalysis", btnText: "🕵️ Анализировать конкурентов", color: "#F135A8", hasInput: true },
    { num: "3", title: "Стратегия", icon: "🚀", sub: "Контент-маркетинг стратегия на основе профиля и анализов.", key: "strategy", action: "strategy", btnText: "🚀 Сгенерировать стратегию", color: "#3B82F6" },
    { num: "4", title: "План запуска", icon: "📣", sub: `Бюджет: $${user.budget || "—"}`, key: "launch", action: "launchPlan", btnText: "📣 Создать план запуска", color: "#F59E0B" },
  ];

  return (
    <div className="screen-scroll">
      <div className="section-title">AI Стратег</div>
      <div className="section-sub">Персональный план развития для {user.niche || "вашей ниши"}</div>

      {blocks.map((b) => (
        <div key={b.key} className="mb-3">
          <div className="text-xl font-black text-white mb-2 tracking-tight">{b.num}. {b.title}</div>
          <div className="hub-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${b.color}18` }}>{b.icon}</div>
              <div>
                <div className="text-sm font-bold text-white">{b.title}</div>
                <div className="text-xs text-[#50506A]">{b.sub}</div>
              </div>
            </div>
            {b.hasInput && (
              <input
                className="hub-input mb-2"
                placeholder="@competitor1, @competitor2 или оставь пустым"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
              />
            )}
            <button
              className="hub-btn w-full justify-center"
              style={{ background: b.color, color: b.color === "#C8F135" || b.color === "#F59E0B" ? "#000" : "#fff" }}
              onClick={() => run(b.action, b.key)}
              disabled={loading[b.key]}
            >
              {loading[b.key] ? "⏳ Генерирую..." : b.btnText}
            </button>
            {results[b.key] && (
              <div className="mt-3">
                <div className="result-box text-xs" style={{ borderLeftColor: b.color }}>{results[b.key]}</div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(results[b.key]); toast("✓ Скопировано!"); }}>📋 Копировать</button>
                  <button className="hub-btn hub-btn-ghost text-xs" onClick={() => addNote(b.title, results[b.key])}>💾 В заметки</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Funnel Map ───────────────────────────────────────────────────
function MapScreen({ flows, setFlows, activeFlow, setActiveFlow }: any) {
  const flow = flows[activeFlow] || flows[0];
  const blocks: FunnelBlock[] = flow?.blocks || [];

  const updateCount = (i: number, val: number) => {
    const updated = flows.map((f: any, fi: number) => {
      if (fi !== activeFlow) return f;
      const b = [...f.blocks];
      b[i] = { ...b[i], count: val };
      for (let j = i + 1; j < b.length; j++) b[j] = { ...b[j], count: Math.round(b[j - 1].count * b[j - 1].conv / 100) };
      return { ...f, blocks: b };
    });
    setFlows(updated);
  };

  const updateConv = (i: number, val: number) => {
    const updated = flows.map((f: any, fi: number) => {
      if (fi !== activeFlow) return f;
      const b = [...f.blocks];
      b[i] = { ...b[i], conv: val };
      for (let j = i + 1; j < b.length; j++) b[j] = { ...b[j], count: Math.round(b[j - 1].count * b[j - 1].conv / 100) };
      return { ...f, blocks: b };
    });
    setFlows(updated);
  };

  const deleteBlock = (i: number) => {
    const updated = flows.map((f: any, fi: number) => {
      if (fi !== activeFlow) return f;
      return { ...f, blocks: f.blocks.filter((_: any, bi: number) => bi !== i) };
    });
    setFlows(updated);
  };

  const addBlock = () => {
    const updated = flows.map((f: any, fi: number) => {
      if (fi !== activeFlow) return f;
      return { ...f, blocks: [...f.blocks, { name: "Новый шаг", type: "bot", count: 20, conv: 20, tag: "BOT", label: "Count", subtag: "", canDelete: true }] };
    });
    setFlows(updated);
  };

  const addFlow = () => {
    const colors = ["#7C3AED", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];
    const newFlow = { id: flows.length + 1, name: `Поток ${flows.length + 1}`, color: colors[flows.length % colors.length], blocks: mkBlocks() };
    setFlows([...flows, newFlow]);
    setActiveFlow(flows.length);
  };

  const typeColors: Record<string, string> = { traffic: "#3B82F6", trigger: "#7C3AED", bot: "#9090B8", product: "#9090B8", money: "#22C55E", warmup: "#F59E0B" };

  const money = blocks.find((b) => b.type === "money");
  const product = blocks.find((b) => b.type === "product");
  const revenue = (product?.count || 0) * 27 + (money?.count || 0) * 497;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Flow chips */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d1c] border-b border-[#1e1e38] flex-wrap">
        <span className="text-[10px] font-bold uppercase text-[#50506A] tracking-widest">Потоки:</span>
        {flows.map((f: any, i: number) => (
          <button
            key={f.id}
            onClick={() => setActiveFlow(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              i === activeFlow ? "text-purple-300 border-purple-500" : "text-[#9090B8] border-[#2a2a50]"
            } border bg-transparent`}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
            {f.name}
          </button>
        ))}
        <button onClick={addFlow} className="w-7 h-7 rounded-lg bg-[#161628] border border-[#2a2a50] text-[#9090B8] flex items-center justify-center text-sm hover:border-[#C8F135] hover:text-[#C8F135] transition-all">+</button>
      </div>

      {/* Budget & Revenue */}
      <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-[#0d0d1c] border-b border-[#1e1e38]">
        <div className="hub-card py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#50506A] mb-1">Бюджет</div>
          <input className="text-lg font-extrabold bg-transparent border-none outline-none text-white w-full" placeholder="$100" />
        </div>
        <div className="hub-card py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#50506A] mb-1">Прогноз выручки</div>
          <div className="text-lg font-extrabold text-[#22C55E]">~${revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Funnel blocks */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col items-center">
          {blocks.map((b, i) => (
            <div key={i} className="w-full">
              <div className={`w-full rounded-2xl border-t-4 border-l border-r border-b border-[#1e1e38] p-3 bg-[#111120] transition-all hover:-translate-y-0.5 cursor-pointer`}
                style={{ borderTopColor: typeColors[b.type] || "#3B82F6" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white">{b.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#50506A]">{b.tag}</span>
                    {b.canDelete && (
                      <button onClick={() => deleteBlock(i)} className="w-5 h-5 rounded-full border border-[#2a2a50] text-[#50506A] flex items-center justify-center text-xs hover:border-red-500 hover:text-red-400 transition-all">✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#9090B8]">{b.label}:</span>
                  <input
                    className="text-sm font-bold text-right bg-transparent border-none outline-none text-white w-20"
                    value={b.count}
                    onChange={(e) => updateCount(i, parseFloat(e.target.value) || 0)}
                  />
                </div>
                {b.subtag && <div className="text-right mt-1"><span className="text-[10px] text-[#50506A] bg-[#161628] px-2 py-0.5 rounded">{b.subtag}</span></div>}
              </div>
              {i < blocks.length - 1 && (
                <div className="flex items-center justify-center py-1 relative">
                  <div className="w-px h-5 bg-[#2a2a50]" />
                  <button
                    className={`absolute px-2 py-0.5 rounded-full text-xs font-bold border-none ${
                      b.conv >= 50 ? "bg-green-900/30 text-green-400" : b.conv >= 25 ? "bg-[#161628] text-[#9090B8]" : "bg-red-900/20 text-red-400"
                    }`}
                  >
                    <input
                      className="text-xs font-bold w-8 bg-transparent border-none outline-none text-center"
                      value={`${b.conv}%`}
                      onChange={(e) => updateConv(i, parseFloat(e.target.value) || 0)}
                      style={{ color: "inherit" }}
                    />
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={addBlock} className="w-10 h-10 rounded-full bg-[#161628] border-2 border-dashed border-[#2a2a50] flex items-center justify-center text-2xl text-[#50506A] hover:border-[#C8F135] hover:text-[#C8F135] transition-all mt-2">+</button>
        </div>
      </div>
    </div>
  );
}

// ─── Content Generator ────────────────────────────────────────────
function GenScreen({ user, hubCall, toast, addNote, calPlans, setCalPlans }: any) {
  const [platform, setPlatform] = useState("Instagram");
  const [contentType, setContentType] = useState("Рилс (озвучка)");
  const [tone, setTone] = useState("экспертный");
  const [funnelGoal, setFunnelGoal] = useState("прогрев аудитории");
  const [topic, setTopic] = useState("");
  const [refText, setRefText] = useState("");
  const [mode, setMode] = useState<"create" | "rewrite">("create");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");

  const generate = async () => {
    if (!topic && mode === "create") { toast("Введи тему контента"); return; }
    if (!refText && mode === "rewrite") { toast("Вставь текст для переработки"); return; }
    setLoading(true); setResult("⏳ Генерирую...");
    try {
      const r = await hubCall("content", { user, platform, contentType, tone, funnelGoal, topic, refText: mode === "rewrite" ? refText : "" });
      setResult(r);
      addNote(`${platform} · ${contentType}`, r);
      toast("✅ Автосохранено в Заметки");
    } catch (e: any) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  const saveToCalendar = () => {
    if (!date || !result) { toast("Выбери дату"); return; }
    const plan = { id: Date.now(), date, platform, type: contentType, topic, text: result };
    setCalPlans([...calPlans, plan]);
    toast("📅 Добавлено в календарь");
  };

  const types = GEN_TYPES[platform] || ["Пост"];

  // Platform preview colors
  const prevColors: Record<string, string> = { Instagram: "conic-gradient(from 240deg,#f09433,#e6683c,#dc2743,#cc2366)", Telegram: "#2ca5e0", YouTube: "#ff0000", TikTok: "#000", Email: "#6366f1", Blog: "#10b981" };

  return (
    <div className="screen-scroll">
      <div className="section-title">Генератор контента</div>
      <div className="section-sub">Текст для любой платформы</div>

      {/* Mode switch */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["create", "rewrite"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${mode === m ? "bg-[#C8F135] text-black border-[#C8F135]" : "border-[#2a2a50] text-[#9090B8] bg-transparent"}`}>
            {m === "create" ? "✦ Создать" : "↺ Переработать"}
          </button>
        ))}
      </div>

      {/* Platforms */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Платформа</div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(GEN_TYPES).map((p) => (
            <button key={p} onClick={() => { setPlatform(p); setContentType(GEN_TYPES[p][0]); }} className={`pill-btn ${platform === p ? "active" : ""}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Content types */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Формат</div>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button key={t} onClick={() => setContentType(t)} className={`pill-btn ${contentType === t ? "active" : ""}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Тон</div>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button key={t} onClick={() => setTone(t)} className={`pill-btn ${tone === t ? "active-purple" : ""}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Funnel goal */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Цель</div>
        <div className="flex flex-wrap gap-2">
          {FUNNEL_GOALS.map((g) => (
            <button key={g} onClick={() => setFunnelGoal(g)} className={`pill-btn ${funnelGoal === g ? "active" : ""}`}>{g}</button>
          ))}
        </div>
      </div>

      {/* Input */}
      {mode === "create" ? (
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Тема</div>
          <textarea
            className="hub-input"
            style={{ minHeight: 80, resize: "none" }}
            placeholder="Например: Как я вышел на $10k за 90 дней..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      ) : (
        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Текст для переработки</div>
          <textarea
            className="hub-input"
            style={{ minHeight: 100, resize: "none" }}
            placeholder="Вставь текст, который нужно переработать под твой стиль..."
            value={refText}
            onChange={(e) => setRefText(e.target.value)}
          />
        </div>
      )}

      <button className="hub-btn hub-btn-primary w-full justify-center mb-4 text-sm" onClick={generate} disabled={loading}>
        {loading ? "⏳ Генерирую..." : "✦ Сгенерировать"}
      </button>

      {result && (
        <div className="hub-card mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-white">Готовый текст</div>
            <div className="flex gap-2">
              <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(result); toast("✓ Скопировано!"); }}>Копировать</button>
              <button className="hub-btn hub-btn-ghost text-xs" onClick={generate}>↺ Ещё</button>
            </div>
          </div>
          <div className="result-box">{result}</div>

          {/* Platform preview */}
          <div className="mt-3 rounded-2xl overflow-hidden border border-[#1e1e38]">
            <div className="flex items-center gap-2 bg-[#161628] px-3 py-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: prevColors[platform] || "#333" }}>
                {platform === "Instagram" ? "📸" : platform === "Telegram" ? "✈️" : platform === "YouTube" ? "▶️" : "📱"}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{platform}</div>
                <div className="text-[10px] text-[#50506A]">@{user.name?.toLowerCase().replace(/\s/g, "") || "yourhandle"}</div>
              </div>
            </div>
            <div className="bg-black p-3">
              <div className="text-xs leading-relaxed text-white/90">{result.slice(0, 200)}{result.length > 200 ? "..." : ""}</div>
            </div>
            <div className="flex items-center gap-4 bg-[#161628] px-3 py-2 text-[10px] text-[#50506A]">
              <span>👁 Превью · {contentType}</span>
              <span className="ml-auto">❤️ 💬 📤</span>
            </div>
          </div>

          {/* Save to calendar */}
          <div className="flex gap-2 mt-3">
            <input type="date" className="hub-input flex-1 text-xs" value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="hub-btn hub-btn-ghost text-xs" onClick={saveToCalendar}>📅 В календарь</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ads / Creatives ──────────────────────────────────────────────
function AdsScreen({ user, hubCall, toast, addNote }: any) {
  const [format, setFormat] = useState("image");
  const [count, setCount] = useState(5);
  const [offer, setOffer] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetPlatform, setTargetPlatform] = useState("Instagram");
  const [targetResult, setTargetResult] = useState("");
  const [targetLoading, setTargetLoading] = useState(false);

  const generate = async () => {
    if (!offer) { toast("Опиши продукт/оффер"); return; }
    setLoading(true); setResult("⏳ Создаём...");
    try {
      const r = await hubCall("creative", { user, offer, format, count });
      setResult(r);
      addNote(`🎬 Креативы (${count}шт): ${format}`, r);
      toast(`✅ ${count} креативов готовы!`);
    } catch (e: any) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  const generateTarget = async () => {
    setTargetLoading(true); setTargetResult("⏳ Анализируем...");
    try {
      const r = await hubCall("targeting", { user, offer, platform: targetPlatform, budget: user.budget });
      setTargetResult(r);
    } catch (e: any) { setTargetResult("❌ " + e.message); }
    setTargetLoading(false);
  };

  return (
    <div className="screen-scroll">
      <div className="section-title">Рекламные креативы</div>
      <div className="section-sub">Тексты для рекламы + стратегия таргетинга</div>

      {/* Format selection */}
      <div className="flex flex-col gap-2 mb-4">
        {ADS_FORMATS.map((f) => (
          <div
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`hub-card cursor-pointer transition-all ${format === f.id ? "border-[#C8F135] bg-[#C8F135]/5" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#161628] flex items-center justify-center text-xl flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{f.name}</div>
                <div className="text-xs text-[#50506A]">{f.sub}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {f.tags.map((t) => <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-[#9090B8] border border-[#2a2a50]">{t}</span>)}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${format === f.id ? "border-[#C8F135] bg-[#C8F135]" : "border-[#2a2a50]"}`}>
                {format === f.id && <span className="text-xs font-black text-black">✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Count */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Количество вариантов</div>
        <div className="flex gap-2">
          {[3, 5, 10, 15, 20].map((n) => (
            <button key={n} onClick={() => setCount(n)} className={`pill-btn flex-1 text-center ${count === n ? "active" : ""}`}>{n}</button>
          ))}
        </div>
      </div>

      {/* Offer input */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Продукт / Оффер</div>
        <textarea
          className="hub-input"
          style={{ minHeight: 80, resize: "none" }}
          placeholder="Опиши продукт, его цену, главную выгоду для клиента..."
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
        />
      </div>

      <button className="hub-btn hub-btn-primary w-full justify-center mb-4" onClick={generate} disabled={loading}>
        {loading ? "⏳ Создаём..." : `🎬 Создать ${count} вариантов`}
      </button>

      {result && (
        <div className="hub-card mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">Готовые креативы</div>
            <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(result); toast("✓ Скопировано!"); }}>📋 Все</button>
          </div>
          <div className="result-box">{result}</div>
        </div>
      )}

      {/* Targeting */}
      <div className="hub-card mb-3">
        <div className="text-sm font-bold text-white mb-3">🎯 Стратегия таргетинга</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {TARGET_PLATFORMS.map((p) => (
            <div
              key={p.id}
              onClick={() => setTargetPlatform(p.id)}
              className={`rounded-xl p-2 text-center cursor-pointer transition-all border ${targetPlatform === p.id ? "border-purple-500 bg-purple-900/20" : "border-[#1e1e38] bg-[#111120]"}`}
            >
              <div className="text-xl mb-1">{p.icon}</div>
              <div className="text-[10px] font-bold text-[#9090B8]">{p.id}</div>
            </div>
          ))}
        </div>
        <button className="hub-btn w-full justify-center text-sm" style={{ background: "#3B82F6", color: "#fff" }} onClick={generateTarget} disabled={targetLoading}>
          {targetLoading ? "⏳ Анализируем..." : `📊 План таргетинга ${targetPlatform}`}
        </button>
        {targetResult && (
          <div className="result-box mt-3 text-xs" style={{ borderLeftColor: "#3B82F6" }}>{targetResult}</div>
        )}
      </div>
    </div>
  );
}

// ─── Bot Builder ──────────────────────────────────────────────────
function BotScreen({ user, hubCall, toast, botMessages, setBotMessages }: any) {
  const [chainType, setChainType] = useState("warm7");
  const [product, setProduct] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true); setResult("⏳ Создаю цепочку...");
    try {
      const r = await hubCall("botChain", { user, chainType, product: product || user.products });
      setResult(r);
      // Parse into messages
      const msgs: BotMessage[] = r.split(/━+/).filter((s: string) => s.trim()).map((s: string, i: number) => ({
        id: Date.now() + i, step: `Шаг ${i + 1}`, stepType: chainType === "warm7" ? "warmup" : chainType === "sell5" ? "sell" : "welcome", text: s.trim(),
      }));
      if (msgs.length) setBotMessages(msgs);
      toast("✅ Цепочка готова!");
    } catch (e: any) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  const stepColors: Record<string, string> = { welcome: "#C8F135", warmup: "#F59E0B", sell: "#22C55E", followup: "#3B82F6" };

  return (
    <div className="screen-scroll">
      <div className="section-title">Bot Builder</div>
      <div className="section-sub">Цепочки сообщений для SendPulse</div>

      {/* Chain types */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Тип цепочки</div>
        <div className="flex flex-col gap-2">
          {BOT_CHAINS.map((c) => (
            <div
              key={c.id}
              onClick={() => setChainType(c.id)}
              className={`hub-card cursor-pointer transition-all flex items-center gap-3 ${chainType === c.id ? "border-[#C8F135]" : ""}`}
            >
              <div className="text-2xl">{c.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{c.name}</div>
                <div className="text-xs text-[#50506A]">{c.sub}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${chainType === c.id ? "border-[#C8F135] bg-[#C8F135]" : "border-[#2a2a50]"}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Product */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Продукт</div>
        <input
          className="hub-input"
          placeholder={user.products || "Название продукта..."}
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
      </div>

      <button className="hub-btn hub-btn-primary w-full justify-center mb-4" onClick={generate} disabled={loading}>
        {loading ? "⏳ Создаю цепочку..." : "🤖 Создать цепочку"}
      </button>

      {result && (
        <div className="mb-4">
          <div className="result-box mb-3">{result}</div>
          <div className="flex gap-2">
            <button className="hub-btn hub-btn-ghost text-xs flex-1 justify-center" onClick={() => { navigator.clipboard.writeText(result); toast("✓ Скопировано!"); }}>📋 Копировать всё</button>
          </div>
        </div>
      )}

      {/* Saved messages */}
      {botMessages.length > 0 && (
        <div>
          <div className="text-sm font-bold text-white mb-3">Сохранённые сообщения</div>
          {botMessages.map((m: BotMessage) => (
            <div key={m.id} className="hub-card mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${stepColors[m.stepType] || "#7C3AED"}20`, color: stepColors[m.stepType] || "#7C3AED" }}>{m.step}</span>
                <button onClick={() => setBotMessages(botMessages.filter((x: BotMessage) => x.id !== m.id))} className="text-[#50506A] hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
              <div className="text-xs text-[#9090B8] line-clamp-3">{m.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* SendPulse guide */}
      <div className="mt-4 rounded-2xl border border-blue-500/30 p-4" style={{ background: "linear-gradient(135deg,rgba(59,130,246,.08),rgba(6,182,212,.08))" }}>
        <div className="text-sm font-bold text-blue-300 mb-2">📡 Интеграция с SendPulse</div>
        <div className="text-xs text-[#9090B8] leading-relaxed space-y-1">
          <div>1. Скопируй текст цепочки выше</div>
          <div>2. Зайди в SendPulse → Автоматизация 360°</div>
          <div>3. Создай новый поток → добавь сообщения</div>
          <div>4. Настрой задержки между шагами</div>
          <div>5. Привяжи к боту или email-рассылке</div>
        </div>
      </div>
    </div>
  );
}

// ─── Products Manager ─────────────────────────────────────────────
function ProdScreen({ products, setProducts, toast, setTab }: any) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Курс");
  const [newPrice, setNewPrice] = useState("");

  const addProduct = () => {
    if (!newName.trim()) { toast("Введи название"); return; }
    const p: Product = { id: Date.now(), name: newName, type: newType, price: newPrice, tasks: [] };
    setProducts([...products, p]);
    setNewName(""); setNewPrice("");
    toast("✅ Продукт добавлен");
  };

  const deleteProduct = (id: number) => setProducts(products.filter((p: Product) => p.id !== id));

  const toggleTask = (pid: number, tid: number) => {
    setProducts(products.map((p: Product) =>
      p.id !== pid ? p : { ...p, tasks: p.tasks.map((t) => t.id === tid ? { ...t, done: !t.done } : t) }
    ));
  };

  const addTask = (pid: number, label: string) => {
    if (!label.trim()) return;
    setProducts(products.map((p: Product) =>
      p.id !== pid ? p : { ...p, tasks: [...p.tasks, { id: Date.now(), label, done: false, date: "" }] }
    ));
  };

  const deleteTask = (pid: number, tid: number) => {
    setProducts(products.map((p: Product) =>
      p.id !== pid ? p : { ...p, tasks: p.tasks.filter((t) => t.id !== tid) }
    ));
  };

  return (
    <div className="screen-scroll">
      <div className="section-title">Продукты</div>
      <div className="section-sub">Управление продуктами и задачами</div>

      {/* Add product */}
      <div className="hub-card mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-[#50506A] mb-3">Новый продукт</div>
        <input className="hub-input mb-2" placeholder="Название продукта" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addProduct(); }} />
        <div className="flex gap-2 mb-2">
          <select
            className="hub-input flex-1"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            style={{ appearance: "none" }}
          >
            {["Курс", "Менторство", "Консультация", "Мастер-класс", "Книга", "Подписка"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input className="hub-input w-24" placeholder="Цена $" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addProduct(); }} />
        </div>
        <button className="hub-btn hub-btn-primary w-full justify-center" onClick={addProduct}>+ Добавить продукт</button>
      </div>

      {/* Products list */}
      {products.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#2a2a50] rounded-2xl">
          <div className="text-4xl mb-3">📦</div>
          <div className="text-sm text-[#50506A]">Пока нет продуктов</div>
        </div>
      ) : (
        products.map((p: Product) => <ProductCard key={p.id} product={p} onDelete={deleteProduct} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask} onLanding={() => setTab("landing")} toast={toast} />)
      )}
    </div>
  );
}

function ProductCard({ product, onDelete, onToggleTask, onAddTask, onDeleteTask, onLanding, toast }: any) {
  const [newTask, setNewTask] = useState("");
  const done = product.tasks.filter((t: Task) => t.done).length;

  return (
    <div className="hub-card mb-3 relative">
      <button onClick={() => onDelete(product.id)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 flex items-center justify-center text-xs hover:bg-red-900/40 transition-all">✕</button>
      <div className="text-base font-extrabold text-white mb-1 pr-8">{product.name}</div>
      <div className="text-xs text-[#50506A] mb-3">{product.type}{product.price ? ` · $${product.price}` : ""} · {done}/{product.tasks.length} задач</div>

      {product.tasks.map((t: Task) => (
        <div key={t.id} className="flex items-center gap-2 py-2 border-b border-[#1e1e38] last:border-0">
          <button
            onClick={() => onToggleTask(product.id, t.id)}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.done ? "bg-[#22C55E] border-[#22C55E]" : "border-[#2a2a50] bg-transparent"}`}
          >
            {t.done && <span className="text-xs text-black font-bold">✓</span>}
          </button>
          <span className={`text-sm flex-1 ${t.done ? "line-through text-[#50506A]" : "text-white"}`}>{t.label}</span>
          <button onClick={() => onDeleteTask(product.id, t.id)} className="text-[#50506A] hover:text-red-400 text-xs transition-colors">✕</button>
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <input
          className="hub-input flex-1 text-sm"
          placeholder="Новая задача..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onAddTask(product.id, newTask); setNewTask(""); } }}
        />
        <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { onAddTask(product.id, newTask); setNewTask(""); }}>+</button>
      </div>
      <button className="hub-btn hub-btn-ghost text-xs mt-2" onClick={onLanding}>🌐 Создать лендинг</button>
    </div>
  );
}

// ─── Goals Tracker ────────────────────────────────────────────────
function GoalsScreen({ goals, setGoals, user, hubCall, toast }: any) {
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newUnit, setNewUnit] = useState("$");
  const [motivator, setMotivator] = useState("");
  const [motivLoading, setMotivLoading] = useState(false);

  const addGoal = () => {
    if (!newName || !newTarget) { toast("Заполни все поля"); return; }
    const g: Goal = { id: Date.now(), name: newName, current: 0, target: Number(newTarget), unit: newUnit };
    setGoals([...goals, g]);
    setNewName(""); setNewTarget("");
  };

  const updateCurrent = (id: number, delta: number) => {
    setGoals(goals.map((g: Goal) => g.id === id ? { ...g, current: Math.max(0, g.current + delta) } : g));
  };

  const deleteGoal = (id: number) => setGoals(goals.filter((g: Goal) => g.id !== id));

  const getMotivation = async () => {
    setMotivLoading(true);
    const goalsText = goals.map((g: Goal) => `${g.name}: ${g.current}/${g.target} ${g.unit}`).join(", ");
    try {
      const r = await hubCall("goals", { user, goals: goalsText });
      setMotivator(r);
    } catch (e: any) { setMotivator("❌ " + e.message); }
    setMotivLoading(false);
  };

  return (
    <div className="screen-scroll">
      <div className="section-title">Цели</div>
      <div className="section-sub">Трекер прогресса + AI-мотиватор</div>

      {/* Goals list */}
      {goals.map((g: Goal) => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        return (
          <div key={g.id} className="hub-card mb-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#9090B8] mb-1">{g.name}</div>
                <div className="text-sm font-bold text-[#C8F135]">{pct}%</div>
              </div>
              <button onClick={() => deleteGoal(g.id)} className="text-[#50506A] hover:text-red-400 text-sm transition-colors">🗑</button>
            </div>
            <div className="h-2 bg-[#1c1c35] rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#7C3AED,#C8F135)" }} />
            </div>
            <div className="text-sm text-[#9090B8] mb-3">{g.current} / {g.target} {g.unit}</div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => updateCurrent(g.id, -10)} className="w-8 h-8 rounded-lg bg-[#161628] border border-[#2a2a50] text-white flex items-center justify-center text-sm hover:border-[#C8F135] transition-all">−</button>
              <button onClick={() => updateCurrent(g.id, 10)} className="w-8 h-8 rounded-lg bg-[#161628] border border-[#2a2a50] text-white flex items-center justify-center text-sm hover:border-[#C8F135] transition-all">+</button>
              <button onClick={() => updateCurrent(g.id, 100)} className="hub-btn hub-btn-ghost text-xs">+100</button>
            </div>
          </div>
        );
      })}

      {/* AI Motivator */}
      <div className="hub-card mb-4">
        <div className="text-xs font-bold uppercase tracking-widest text-[#50506A] mb-2">🧠 AI-Мотиватор</div>
        {motivator && <div className="text-sm text-[#9090B8] leading-relaxed mb-3">{motivator}</div>}
        <button className="hub-btn hub-btn-purple w-full justify-center" onClick={getMotivation} disabled={motivLoading}>
          {motivLoading ? "⏳" : "💪 Получить мотивацию"}
        </button>
      </div>

      {/* Add goal */}
      <div className="hub-card">
        <div className="text-xs font-bold uppercase tracking-widest text-[#50506A] mb-3">Новая цель</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className="hub-input" placeholder="Название цели" value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }} />
          <div className="flex gap-1">
            <input className="hub-input flex-1" placeholder="Цель" type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }} />
            <select className="hub-input w-16" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} style={{ appearance: "none" }}>
              {["$", "K", "шт", "%"].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <button className="hub-btn hub-btn-primary w-full justify-center" onClick={addGoal}>+ Добавить цель</button>
      </div>
    </div>
  );
}

// ─── Weekly Planner ───────────────────────────────────────────────
function PlanScreen({ user, hubCall, toast, addNote, calPlans }: any) {
  const [niche, setNiche] = useState(user.niche || "");
  const [audience, setAudience] = useState(user.audience || "");
  const [postsCount, setPostsCount] = useState(7);
  const [selectedPlatforms, setSelectedPlatforms] = useState(["Instagram", "Telegram"]);
  const [tone, setTone] = useState("экспертный");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [planItems, setPlanItems] = useState<{ num: number; day: string; platform: string; format: string; hook: string; body: string }[]>([]);

  const platforms = ["Instagram", "Telegram", "TikTok", "YouTube"];

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const generate = async () => {
    setLoading(true); setResult("⏳ Составляю план...");
    try {
      const r = await hubCall("weeklyPlan", { user, niche: niche || user.niche, audience: audience || user.audience, postsCount, platforms: selectedPlatforms, tone });
      setResult(r);
      addNote(`📅 Контент-план (${postsCount} постов)`, r);
      toast(`✅ ${postsCount} постов готовы!`);
    } catch (e: any) { setResult("❌ " + e.message); }
    setLoading(false);
  };

  const exportTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "content-plan.txt"; a.click();
    URL.revokeObjectURL(url);
    toast("📁 Скачан .txt файл");
  };

  // Calendar view
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthName = today.toLocaleString("ru", { month: "long", year: "numeric" });
  const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const plansByDate: Record<string, CalPlan[]> = {};
  calPlans.forEach((p: CalPlan) => {
    if (!plansByDate[p.date]) plansByDate[p.date] = [];
    plansByDate[p.date].push(p);
  });

  const platColors: Record<string, string> = { Instagram: "cal-dot-ig", Telegram: "cal-dot-tg", YouTube: "cal-dot-yt" };

  return (
    <div className="screen-scroll">
      <div className="section-title">Недельный план</div>
      <div className="section-sub">Контент-календарь + генератор плана</div>

      {/* Calendar */}
      <div className="hub-card mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 text-center text-sm font-extrabold text-white capitalize">{monthName}</div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d) => <div key={d} className="text-center text-[10px] font-bold text-[#50506A] py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = day === today.getDate();
            const plans = plansByDate[dateStr] || [];
            return (
              <div key={day} className={`min-h-12 p-1 rounded-xl border ${isToday ? "border-[#C8F135] bg-[#C8F135]/5" : "border-[#1e1e38] bg-[#111120]"} ${plans.length ? "cursor-pointer" : ""}`}>
                <div className={`text-[10px] font-bold mb-0.5 ${isToday ? "text-[#C8F135]" : "text-[#9090B8]"}`}>{day}</div>
                {plans.slice(0, 2).map((p, pi) => (
                  <div key={pi} className={`text-[8px] font-bold rounded px-0.5 py-0.5 mb-0.5 truncate ${p.platform === "Instagram" ? "bg-pink-500/20 text-pink-300" : p.platform === "Telegram" ? "bg-blue-500/20 text-blue-300" : "bg-red-500/20 text-red-300"}`}>
                    {p.platform.slice(0, 2)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generator */}
      <div className="hub-card mb-4">
        <div className="text-sm font-bold text-white mb-3">🤖 Генератор контент-плана</div>

        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Платформы</div>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button key={p} onClick={() => togglePlatform(p)} className={`pill-btn ${selectedPlatforms.includes(p) ? "active" : ""}`}>{p}</button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Постов в плане</div>
          <div className="grid grid-cols-5 gap-2">
            {[3, 5, 7, 10, 14].map((n) => (
              <button key={n} onClick={() => setPostsCount(n)} className={`py-2 rounded-xl border text-sm font-bold transition-all text-center ${postsCount === n ? "bg-[#C8F135]/10 border-[#C8F135] text-[#C8F135]" : "border-[#1e1e38] text-[#50506A]"}`}>{n}</button>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Тон</div>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`pill-btn ${tone === t ? "active-purple" : ""}`}>{t}</button>
            ))}
          </div>
        </div>

        <button className="hub-btn hub-btn-primary w-full justify-center" onClick={generate} disabled={loading}>
          {loading ? "⏳ Составляю план..." : `📅 Создать план на ${postsCount} постов`}
        </button>
      </div>

      {result && (
        <div className="hub-card mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">Контент-план</div>
            <div className="flex gap-2">
              <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(result); toast("✓ Скопировано!"); }}>📋</button>
              <button className="hub-btn hub-btn-ghost text-xs" onClick={exportTxt}>📁 .txt</button>
              <button className="hub-btn hub-btn-ghost text-xs" onClick={() => addNote(`📅 Контент-план`, result)}>💾</button>
            </div>
          </div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── Visual Content ───────────────────────────────────────────────
function VisualScreen({ user, hubCall, toast, addNote }: any) {
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [poseTopic, setPoseTopic] = useState("");
  const [carouselTopic, setCarouselTopic] = useState("");
  const [storyTopic, setStoryTopic] = useState("");
  const [storyGoal, setStoryGoal] = useState("прогрев");

  const run = async (action: string, key: string, data: any) => {
    setLoading((p) => ({ ...p, [key]: true }));
    setResults((p) => ({ ...p, [key]: "⏳ Генерирую..." }));
    try {
      const r = await hubCall(action, { user, ...data });
      setResults((p) => ({ ...p, [key]: r }));
      addNote(`🎞️ ${key}`, r);
      toast("✅ Готово!");
    } catch (e: any) { setResults((p) => ({ ...p, [key]: "❌ " + e.message })); }
    setLoading((p) => ({ ...p, [key]: false }));
  };

  const blocks = [
    { id: "pose", icon: "📸", name: "Промпты для фото", sub: "Midjourney / DALL-E промпты", color: "#F135A8" },
    { id: "carousel", icon: "🖼️", name: "Карусель Instagram", sub: "Сценарий слайдов с текстами", color: "#7C3AED" },
    { id: "stories", icon: "📱", name: "Stories сценарий", sub: "Серия из 8 кадров", color: "#C8F135" },
    { id: "shorts", icon: "🎬", name: "Shorts / Reels", sub: "Сценарий короткого видео", color: "#F59E0B" },
  ];

  return (
    <div className="screen-scroll">
      <div className="section-title">Визуальный контент</div>
      <div className="section-sub">Промпты, сторибоарды и сценарии</div>

      {blocks.map((b) => (
        <div key={b.id} className="hub-card mb-3">
          <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setActiveBlock(activeBlock === b.id ? null : b.id)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${b.color}18` }}>{b.icon}</div>
              <div>
                <div className="text-sm font-bold text-white">{b.name}</div>
                <div className="text-xs text-[#50506A]">{b.sub}</div>
              </div>
            </div>
            <span className="text-[#50506A] transition-transform" style={{ transform: activeBlock === b.id ? "rotate(90deg)" : "" }}>▶</span>
          </div>

          {activeBlock === b.id && (
            <div className="border-t border-[#1e1e38] pt-3">
              {b.id === "pose" && (
                <>
                  <textarea className="hub-input mb-2" style={{ minHeight: 60, resize: "none" }} placeholder="Поза, стиль, детали (уверенная поза, деловой стиль...)" value={poseTopic} onChange={(e) => setPoseTopic(e.target.value)} />
                  <button className="hub-btn w-full justify-center" style={{ background: b.color, color: "#000" }} onClick={() => run("visualPose", "pose", { poseDesc: poseTopic, subject: user.name || "эксперт", locations: ["студия с нейтральным фоном", "современный офис", "кафе с ноутбуком"] })} disabled={loading.pose}>
                    {loading.pose ? "⏳" : "📸 Сгенерировать промпты"}
                  </button>
                </>
              )}
              {b.id === "carousel" && (
                <>
                  <textarea className="hub-input mb-2" style={{ minHeight: 60, resize: "none" }} placeholder="Тема карусели..." value={carouselTopic} onChange={(e) => setCarouselTopic(e.target.value)} />
                  <button className="hub-btn w-full justify-center" style={{ background: b.color, color: "#fff" }} onClick={() => run("carousel", "carousel", { topic: carouselTopic, slides: 7 })} disabled={loading.carousel}>
                    {loading.carousel ? "⏳" : "🖼️ Создать карусель"}
                  </button>
                </>
              )}
              {b.id === "stories" && (
                <>
                  <textarea className="hub-input mb-2" style={{ minHeight: 60, resize: "none" }} placeholder="Тема серии Stories..." value={storyTopic} onChange={(e) => setStoryTopic(e.target.value)} />
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {["прогрев", "продажа", "вовлечение", "анонс"].map((g) => (
                      <button key={g} onClick={() => setStoryGoal(g)} className={`pill-btn text-xs ${storyGoal === g ? "active" : ""}`}>{g}</button>
                    ))}
                  </div>
                  <button className="hub-btn w-full justify-center text-black" style={{ background: b.color }} onClick={() => run("stories", "stories", { topic: storyTopic, goal: storyGoal })} disabled={loading.stories}>
                    {loading.stories ? "⏳" : "📱 Создать Stories"}
                  </button>
                </>
              )}
              {b.id === "shorts" && (
                <>
                  <textarea className="hub-input mb-2" style={{ minHeight: 60, resize: "none" }} placeholder="Тема Short/Reels..." value={poseTopic} onChange={(e) => setPoseTopic(e.target.value)} />
                  <button className="hub-btn w-full justify-center" style={{ background: b.color, color: "#000" }} onClick={() => run("content", "shorts", { platform: "TikTok", contentType: "Скрипт", topic: poseTopic, tone: "мотивирующий", funnelGoal: "прогрев аудитории" })} disabled={loading.shorts}>
                    {loading.shorts ? "⏳" : "🎬 Создать Shorts"}
                  </button>
                </>
              )}

              {results[b.id] && (
                <div className="mt-3">
                  <div className="result-box text-xs" style={{ borderLeftColor: b.color }}>{results[b.id]}</div>
                  <button className="hub-btn hub-btn-ghost text-xs mt-2" onClick={() => { navigator.clipboard.writeText(results[b.id]); toast("✓ Скопировано!"); }}>📋 Копировать</button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────
function LandingScreen({ user, products, hubCall, toast, addNote }: any) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [analysis, setAnalysis] = useState("");
  const [sectionResults, setSectionResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [fullLanding, setFullLanding] = useState("");
  const [step, setStep] = useState(1);

  const runAnalysis = async () => {
    if (!selectedProduct) { toast("Выбери продукт"); return; }
    setLoading((p) => ({ ...p, analysis: true }));
    try {
      const r = await hubCall("landingAnalysis", { user, product: selectedProduct });
      setAnalysis(r);
      setStep(2);
      toast("✅ Анализ готов!");
    } catch (e: any) { toast("❌ " + e.message); }
    setLoading((p) => ({ ...p, analysis: false }));
  };

  const runSection = async (sectionId: string) => {
    setLoading((p) => ({ ...p, [sectionId]: true }));
    setSectionResults((p) => ({ ...p, [sectionId]: "⏳ Генерирую..." }));
    try {
      const r = await hubCall("landingSection", { user, product: selectedProduct, section: sectionId, analysis });
      setSectionResults((p) => ({ ...p, [sectionId]: r }));
    } catch (e: any) { setSectionResults((p) => ({ ...p, [sectionId]: "❌ " + e.message })); }
    setLoading((p) => ({ ...p, [sectionId]: false }));
  };

  const generateFull = async () => {
    if (!selectedProduct) { toast("Выбери продукт"); return; }
    setLoading((p) => ({ ...p, full: true }));
    setFullLanding("⏳ Генерирую полный лендинг...");
    try {
      const r = await hubCall("landingFull", { user, product: selectedProduct, analysis });
      setFullLanding(r);
      setStep(3);
      addNote(`🌐 Лендинг: ${selectedProduct.name}`, r);
      toast("✅ Лендинг готов!");
    } catch (e: any) { setFullLanding("❌ " + e.message); }
    setLoading((p) => ({ ...p, full: false }));
  };

  // If no products, show select
  const allProducts = [
    ...products,
    ...(!products.find((p: Product) => p.name) ? [{ id: 0, name: user.products || "Основной продукт", type: "Курс", price: "497" }] : []),
  ];

  return (
    <div className="screen-scroll">
      <div className="section-title">Лендинг</div>
      <div className="section-sub">3 шага к продающей странице</div>

      {/* Steps */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} onClick={() => step >= s && setStep(s)} className={`flex-1 py-2 rounded-xl text-center text-xs font-bold cursor-pointer border transition-all ${step === s ? "border-[#C8F135] bg-[#C8F135]/10 text-[#C8F135]" : step > s ? "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]" : "border-[#1e1e38] text-[#50506A]"}`}>
            {step > s ? "✓" : s}. {s === 1 ? "Анализ" : s === 2 ? "Разделы" : "Полный"}
          </div>
        ))}
      </div>

      {/* Step 1: Select product + analysis */}
      {step >= 1 && (
        <div className="hub-card mb-4">
          <div className="text-sm font-bold text-white mb-3">Шаг 1: Выбор продукта</div>
          {allProducts.length === 0 ? (
            <div className="text-xs text-[#50506A] text-center py-4">Добавь продукты в разделе Продукты</div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {allProducts.map((p: any, i: number) => (
                <div
                  key={p.id || i}
                  onClick={() => setSelectedProduct(p)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedProduct?.id === p.id || selectedProduct?.name === p.name ? "border-[#C8F135] bg-[#C8F135]/5" : "border-[#1e1e38]"}`}
                >
                  <div>
                    <div className="text-sm font-bold text-white">{p.name}</div>
                    {p.price && <div className="text-xs text-[#22C55E] font-bold">${p.price}</div>}
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedProduct?.id === p.id || selectedProduct?.name === p.name ? "border-[#C8F135] bg-[#C8F135]" : "border-[#2a2a50]"}`}>
                    {(selectedProduct?.id === p.id || selectedProduct?.name === p.name) && <span className="text-xs font-black text-black">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="hub-btn hub-btn-primary w-full justify-center" onClick={runAnalysis} disabled={loading.analysis || !selectedProduct}>
            {loading.analysis ? "⏳ Анализирую..." : "🔍 Анализировать продукт"}
          </button>
          {analysis && <div className="result-box mt-3 text-xs">{analysis}</div>}
        </div>
      )}

      {/* Step 2: Sections */}
      {step >= 2 && (
        <div className="mb-4">
          <div className="text-sm font-bold text-white mb-3">Шаг 2: Разделы лендинга</div>
          {LANDING_SECTIONS.map((s) => (
            <div key={s.id} className="hub-card mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-white">{s.label}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${s.color}20`, color: s.color }}>{s.badge}</span>
                </div>
                {sectionResults[s.id] && <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(sectionResults[s.id]); toast("✓"); }}>📋</button>}
              </div>
              {sectionResults[s.id] ? (
                <div className="result-box text-xs mb-2" style={{ borderLeftColor: s.color }}>{sectionResults[s.id]}</div>
              ) : null}
              <button className="hub-btn hub-btn-ghost text-xs w-full justify-center" onClick={() => runSection(s.id)} disabled={loading[s.id]}>
                {loading[s.id] ? "⏳" : sectionResults[s.id] ? "↺ Перегенерировать" : `✦ Написать "${s.label}"`}
              </button>
            </div>
          ))}
          <button className="hub-btn hub-btn-purple w-full justify-center mt-2" onClick={generateFull} disabled={loading.full}>
            {loading.full ? "⏳ Генерирую..." : "🌐 Создать полный лендинг"}
          </button>
        </div>
      )}

      {/* Step 3: Full landing */}
      {step >= 3 && fullLanding && (
        <div className="hub-card mb-3" style={{ border: "1px solid #7C3AED" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-purple-300">✅ Полный лендинг</div>
            <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(fullLanding); toast("✓ Скопировано!"); }}>📋 Копировать</button>
          </div>
          <div className="text-xs leading-relaxed text-[#F0F0FF] bg-[#161628] rounded-xl p-3 max-h-80 overflow-y-auto whitespace-pre-wrap">{fullLanding}</div>
        </div>
      )}
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────
function NotesScreen({ notes, setNotes, toast }: any) {
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const addNote = () => {
    if (!newTitle.trim()) { toast("Введи заголовок"); return; }
    const n: Note = { id: Date.now(), title: newTitle, sub: new Date().toLocaleDateString("ru"), body: newBody.slice(0, 120) + (newBody.length > 120 ? "..." : ""), full: newBody };
    setNotes([n, ...notes]);
    setNewTitle(""); setNewBody("");
    toast("💾 Заметка сохранена");
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter((n: Note) => n.id !== id));
    toast("🗑 Удалено");
  };

  const filtered = notes.filter((n: Note) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.full.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="screen-scroll">
      <div className="section-title">Заметки</div>
      <div className="section-sub">Все сохранённые тексты и результаты</div>

      {/* Add */}
      <div className="hub-card mb-4">
        <input className="hub-input mb-2" placeholder="Заголовок" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} />
        <textarea className="hub-input mb-2" style={{ minHeight: 70, resize: "none" }} placeholder="Текст заметки..." value={newBody} onChange={(e) => setNewBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote(); }} />
        <button className="hub-btn hub-btn-primary w-full justify-center" onClick={addNote}>+ Добавить заметку</button>
      </div>

      {/* Search */}
      <input className="hub-input mb-3" placeholder="🔍 Поиск по заметкам..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Notes */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#2a2a50] rounded-2xl">
          <div className="text-4xl mb-3">📝</div>
          <div className="text-sm text-[#50506A]">{search ? "Ничего не найдено" : "Заметок пока нет"}</div>
        </div>
      ) : (
        filtered.map((n: Note) => (
          <div key={n.id} className="hub-card mb-2 relative">
            <button onClick={() => deleteNote(n.id)} className="absolute top-3 right-3 text-[#50506A] hover:text-red-400 text-sm transition-colors">🗑</button>
            <div className="text-sm font-bold text-white mb-1 pr-7">{n.title}</div>
            <div className="text-[11px] text-[#50506A] mb-2">{n.sub}</div>
            <div
              className={`text-xs text-[#9090B8] leading-relaxed cursor-pointer ${expanded === n.id ? "whitespace-pre-wrap" : "line-clamp-3"}`}
              onClick={() => setExpanded(expanded === n.id ? null : n.id)}
            >
              {expanded === n.id ? n.full : n.body}
            </div>
            {expanded === n.id && (
              <div className="flex gap-2 mt-2">
                <button className="hub-btn hub-btn-ghost text-xs" onClick={() => { navigator.clipboard.writeText(n.full); toast("✓ Скопировано!"); }}>📋 Копировать</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Onboarding Wizard ───────────────────────────────────────────
function OnboardingWizard({ onComplete }: { onComplete: (profile: Partial<UserProfile>) => void }) {
  const [step, setStep]             = useState(0);
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [channels, setChannels]     = useState<string[]>([]);
  const [tone, setTone]             = useState("экспертный");
  const [fileError, setFileError]   = useState("");

  const CHANNEL_OPTIONS = ["Instagram", "Telegram", "YouTube", "TikTok", "VK", "Email"];
  const total   = ONBOARDING_QUESTIONS.length;
  const q       = ONBOARDING_QUESTIONS[step];
  const pct     = Math.round((step / total) * 100);

  function getCurrentAnswer(): string {
    if (q.type === "channels") return channels.join(", ");
    if (q.type === "tone")     return tone;
    return answers[q.key as string] ?? "";
  }

  const canProceed = q.optional || q.type === "channels" || q.type === "tone" || getCurrentAnswer().trim().length > 0;

  function advance() {
    if (step < total - 1) { setStep(step + 1); setFileError(""); }
    else {
      const profile: Partial<UserProfile> = {};
      ONBOARDING_QUESTIONS.forEach((oq) => {
        if (oq.type === "channels") (profile as Record<string, unknown>).channels = channels;
        else if (oq.type === "tone") (profile as Record<string, unknown>).tone = tone;
        else if (answers[oq.key as string] !== undefined) (profile as Record<string, unknown>)[oq.key as string] = answers[oq.key as string];
      });
      onComplete(profile);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setFileError("Поддерживаются только .txt и .md файлы");
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ((ev.target?.result as string) ?? "").slice(0, 3000);
      if (q.type === "text" || q.type === "multiline") {
        setAnswers((p) => ({ ...p, [q.key as string]: text }));
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 overflow-y-auto"
      style={{ background: "#04040e", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 rounded-full bg-purple-700 opacity-5 blur-3xl -top-32 -left-32 animate-pulse" />
        <div className="absolute w-72 h-72 rounded-full bg-[#C8F135] opacity-[0.03] blur-3xl bottom-0 right-0 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-lg py-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#C8F135] flex items-center justify-center font-black text-xs text-black">OS</div>
          <span className="text-[#9090B8] text-sm">ContentOS · Настройка профиля</span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[#50506A] mb-2">
            <span>Вопрос {step + 1} из {total}</span>
            <span>{pct}% заполнено</span>
          </div>
          <div className="h-1 bg-[#1e1e38] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C8F135] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Dot indicator */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {ONBOARDING_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: i < step ? "#C8F135" : i === step ? "#7C3AED" : "#1e1e38" }}
              />
            ))}
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl p-6 mb-4 border border-[#1e1e38]" style={{ background: "#0d0d1c" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#50506A" }}>
            {step + 1} / {total}{q.optional ? " · необязательно" : ""}
          </div>
          <h2 className="text-xl font-black text-white mb-1 leading-tight">{q.label}</h2>
          <p className="text-sm mb-5" style={{ color: "#9090B8" }}>{q.hint}</p>

          {/* Channels */}
          {q.type === "channels" && (
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setChannels((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c])}
                  className={`pill-btn ${channels.includes(c) ? "active-purple" : ""}`}
                >{c}</button>
              ))}
            </div>
          )}

          {/* Tone */}
          {q.type === "tone" && (
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`pill-btn ${tone === t ? "active-purple" : ""}`}
                >{t}</button>
              ))}
            </div>
          )}

          {/* Text / Multiline */}
          {(q.type === "text" || q.type === "multiline") && (
            <>
              <textarea
                rows={q.type === "multiline" ? 4 : 2}
                className="hub-input w-full resize-none text-sm"
                placeholder={q.placeholder}
                value={answers[q.key as string] ?? ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.key as string]: e.target.value }))}
                onKeyDown={(e) => {
                  if (q.type === "text" && e.key === "Enter" && !e.shiftKey && canProceed) {
                    e.preventDefault();
                    advance();
                  } else if (q.type === "multiline" && e.key === "Enter" && (e.ctrlKey || e.metaKey) && canProceed) {
                    e.preventDefault();
                    advance();
                  }
                }}
              />
              {/* File upload */}
              <label
                className="mt-3 flex items-center gap-2 text-xs cursor-pointer transition-colors"
                style={{ color: "#50506A" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#9090B8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#50506A")}
              >
                <input type="file" accept=".txt,.md" className="sr-only" onChange={handleFile} />
                <span>📎</span>
                <span>Загрузить .txt или .md файл вместо ввода текста</span>
              </label>
              {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => { setStep(step - 1); setFileError(""); }}
                className="hub-btn hub-btn-ghost text-sm"
              >← Назад</button>
            )}
            {q.optional && (
              <button onClick={advance} className="text-xs" style={{ color: "#50506A" }}>
                Пропустить
              </button>
            )}
          </div>
          <button
            onClick={advance}
            disabled={!canProceed}
            className="hub-btn hub-btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === total - 1 ? "✓ Начать работу" : "Далее →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────
function ProfileScreen({ user, setUser, onClose, toast }: any) {
  const [form, setForm] = useState({ ...user });

  const save = () => {
    setUser(form);
    toast("✅ Профиль сохранён");
    onClose();
  };

  const channels = ["Instagram", "Telegram", "YouTube", "TikTok", "VK", "Email"];

  const toggleChannel = (c: string) => {
    const current = form.channels || [];
    setForm({ ...form, channels: current.includes(c) ? current.filter((x: string) => x !== c) : [...current, c] });
  };

  const fields = [
    { key: "name", label: "Имя / Бренд", placeholder: "Зарина Галымжан" },
    { key: "niche", label: "Ниша", placeholder: "Онлайн-образование, SMM..." },
    { key: "audience", label: "Целевая аудитория", placeholder: "Женщины 25-40, предприниматели..." },
    { key: "products", label: "Продукт / Услуга", placeholder: "Курс по SMM, Менторство..." },
    { key: "revenue", label: "Текущая выручка ($)", placeholder: "0" },
    { key: "subs", label: "Подписчиков", placeholder: "0" },
    { key: "avgCheck", label: "Средний чек ($)", placeholder: "0" },
    { key: "budget", label: "Рекламный бюджет ($)", placeholder: "500" },
    { key: "flagship_product", label: "Флагманский продукт", placeholder: "Продюсирование $3000/мес" },
    { key: "income_goal",      label: "Цель по доходу ($)",  placeholder: "20000" },
    { key: "utp",              label: "УТП / Отличие от конкурентов", placeholder: "Клиент снимает видео раз в месяц..." },
    { key: "content_topics",   label: "Темы для контента",   placeholder: "AI, кейсы, жизнь в Нячанге..." },
    { key: "audience_pains",   label: "Боли аудитории",      placeholder: "Нет системы, не умеют монетизировать..." },
    { key: "expertise",        label: "Экспертиза и опыт",   placeholder: "7 лет в дизайне, 50+ клиентов..." },
  ];

  return (
    <div className="screen-scroll">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title">Профиль</div>
        <button className="hub-btn hub-btn-ghost text-xs" onClick={onClose}>← Закрыть</button>
      </div>

      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "linear-gradient(135deg,#1a0640,#0e0028)" }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2" style={{ background: "linear-gradient(135deg,#7C3AED,#C8F135)" }}>
          {form.name ? form.name[0].toUpperCase() : "👤"}
        </div>
        <div className="text-xs text-purple-300/70 uppercase tracking-widest font-bold">Аватар эксперта</div>
        <div className="text-xl font-black text-white tracking-tight">{form.name || "Твоё имя"}</div>
        <div className="text-sm text-[#9090B8]">{form.niche || "Ниша"}</div>
        {form.utp && <div className="text-xs text-[#C8F135] mt-1 font-semibold">УТП: {form.utp}</div>}
        {form.income_goal && <div className="text-xs text-[#22C55E] mt-0.5">Цель: ${form.income_goal}/мес</div>}
      </div>

      {fields.map((f) => (
        <div key={f.key} className="mb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-1.5">{f.label}</div>
          <input
            className="hub-input"
            placeholder={f.placeholder}
            value={form[f.key] || ""}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          />
        </div>
      ))}

      {/* Channels */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Каналы продвижения</div>
        <div className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <button key={c} onClick={() => toggleChannel(c)} className={`pill-btn ${(form.channels || []).includes(c) ? "active-purple" : ""}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="mb-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#50506A] mb-2">Тон общения</div>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button key={t} onClick={() => setForm({ ...form, tone: t })} className={`pill-btn ${form.tone === t ? "active-purple" : ""}`}>{t}</button>
          ))}
        </div>
      </div>

      <button className="hub-btn hub-btn-primary w-full justify-center text-sm" onClick={save}>
        ✓ Сохранить профиль
      </button>
    </div>
  );
}
