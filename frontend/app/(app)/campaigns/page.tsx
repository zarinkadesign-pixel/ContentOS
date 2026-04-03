"use client";
import { useState, useEffect } from "react";
import {
  Mail, Plus, X, Send, RefreshCw, Sparkles, Users, CheckCircle2,
  Clock, AlertCircle, Trash2, Copy, Check, ChevronDown, Zap,
  MessageSquare, BarChart2,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
type CampaignType = "telegram_broadcast" | "email" | "telegram_sequence";
type CampaignStatus = "draft" | "active" | "paused" | "completed";

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  targetNiche: string;
  message: string;
  subject?: string;
  recipients: string[];
  sentCount: number;
  openRate: number;
  replyCount: number;
  createdAt: string;
  sentAt?: string;
}

const TYPE_CONFIG: Record<CampaignType, { label: string; color: string; icon: React.ElementType }> = {
  telegram_broadcast: { label: "Telegram рассылка", color: "text-blue-400 bg-blue-400/10 border-blue-400/20",   icon: Send           },
  email:              { label: "Email кампания",     color: "text-amber-400 bg-amber-400/10 border-amber-400/20", icon: Mail           },
  telegram_sequence:  { label: "Telegram цепочка",  color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: MessageSquare },
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Черновик",    color: "text-subtext bg-white/5 border-border",                            icon: Clock        },
  active:    { label: "Активна",     color: "text-blue-400 bg-blue-400/10 border-blue-400/20",                  icon: RefreshCw    },
  paused:    { label: "Пауза",       color: "text-amber-400 bg-amber-400/10 border-amber-400/20",               icon: Clock        },
  completed: { label: "Завершена",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",         icon: CheckCircle2 },
};

const SEQUENCE_TEMPLATES = [
  { label: "7 дней прогрева",    days: [0, 1, 3, 5, 7],     goal: "прогрев и продажа" },
  { label: "5 шагов к покупке",  days: [0, 1, 2, 4, 7],     goal: "продажа" },
  { label: "Онбординг клиента",  days: [0, 1, 3, 7, 14],    goal: "онбординг" },
  { label: "Реактивация",        days: [0, 2, 5, 10],        goal: "реактивация" },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [sending,   setSending]     = useState<Record<string, boolean>>({});
  const [sendResult, setSendResult] = useState<Record<string, string>>({});

  // Form
  const [form, setForm] = useState({
    name:        "",
    type:        "telegram_broadcast" as CampaignType,
    targetNiche: "",
    message:     "",
    subject:     "",
    recipientsRaw: "",  // comma-separated
  });
  const [saving,    setSaving]    = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTemplates, setAiTemplates] = useState<string[]>([]);
  const [selectedTplIdx, setSelectedTplIdx] = useState<number | null>(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const res  = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  }

  async function createCampaign() {
    if (!form.name.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/campaigns", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        form.name,
          type:        form.type,
          targetNiche: form.targetNiche,
          message:     form.message,
          subject:     form.subject || undefined,
          recipients:  form.recipientsRaw.split(/[,\n]/).map((r) => r.trim()).filter(Boolean),
        }),
      });
      await loadCampaigns();
      setShowModal(false);
      setAiTemplates([]);
      setSelectedTplIdx(null);
      setTestRecipient("");
      setTestResult("");
      setForm({ name: "", type: "telegram_broadcast", targetNiche: "", message: "", subject: "", recipientsRaw: "" });
    } finally { setSaving(false); }
  }

  async function sendCampaign(id: string) {
    setSending((prev) => ({ ...prev, [id]: true }));
    try {
      const res  = await fetch(`/api/campaigns/${id}/send`, { method: "POST" });
      const data = await res.json();
      setSendResult((prev) => ({ ...prev, [id]: data.message ?? (data.ok ? "Отправлено!" : "Ошибка") }));
      await loadCampaigns();
      setTimeout(() => setSendResult((prev) => { const n = { ...prev }; delete n[id]; return n; }), 5000);
    } finally {
      setSending((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function deleteCampaign(id: string) {
    // Optimistic delete
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  async function generateAIMessage() {
    if (!form.targetNiche && !form.name) return;
    setAiLoading(true);
    setAiTemplates([]);
    setSelectedTplIdx(null);
    try {
      const res  = await fetch("/api/hub", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action: "bulkOutreachScript",
          data: {
            niche:    form.targetNiche || "онлайн-образование",
            goal:     "продажа продукта",
            platform: form.type === "email" ? "Email" : "Telegram",
          },
        }),
      });
      const json = await res.json();
      if (json.result) {
        // Parse numbered templates: "1. ...\n\n2. ..."
        const raw = json.result as string;
        const parts = raw.split(/\n{2,}(?=\d+\.)/).map((t) => t.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
        const templates = parts.length >= 2 ? parts : [raw];
        setAiTemplates(templates);
      }
    } finally { setAiLoading(false); }
  }

  function selectTemplate(idx: number) {
    setSelectedTplIdx(idx);
    setForm((f) => ({ ...f, message: aiTemplates[idx] }));
  }

  async function testSend() {
    if (!testRecipient.trim() || !form.message.trim()) return;
    setTestSending(true);
    setTestResult("");
    try {
      // Create temp campaign
      const createRes = await fetch("/api/campaigns", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:       `[Тест] ${form.name || new Date().toLocaleTimeString()}`,
          type:       form.type,
          message:    form.message,
          subject:    form.subject || undefined,
          recipients: [testRecipient.trim()],
        }),
      });
      const campaign = await createRes.json();
      if (campaign.id) {
        const sendRes  = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
        const sendData = await sendRes.json();
        setTestResult(sendData.message ?? (sendData.ok ? "Отправлено!" : "Ошибка при отправке"));
      }
    } catch (e: any) {
      setTestResult("Ошибка: " + e.message);
    } finally {
      setTestSending(false);
    }
  }

  const stats = {
    total:     campaigns.length,
    sent:      campaigns.reduce((s, c) => s + c.sentCount, 0),
    active:    campaigns.filter((c) => c.status === "active").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Mail size={20} className="text-accent" /> Рассылки и кампании
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            Telegram-рассылки · Email кампании · Цепочки прогрева
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Новая кампания
        </button>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-text">{stats.total}</p>
          <p className="text-[10px] text-subtext">Кампаний</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-accent">{stats.sent.toLocaleString()}</p>
          <p className="text-[10px] text-subtext">Отправлено</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{stats.active}</p>
          <p className="text-[10px] text-subtext">Активных</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{stats.completed}</p>
          <p className="text-[10px] text-subtext">Завершено</p>
        </div>
      </div>

      {/* ── Automation workflow tip ───────────────────────────────────────────── */}
      <div className="card p-4 border-accent/20 bg-accent/5">
        <p className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
          <Zap size={13} className="text-accent" /> Автоматическая воронка продаж
        </p>
        <div className="flex flex-wrap gap-2 items-center text-xs text-subtext">
          {["Парсинг лидов", "→", "Первое сообщение", "→", "Цепочка прогрева", "→", "Оффер + ссылка оплаты", "→", "Продажа"].map((s, i) => (
            <span key={i} className={s === "→" ? "text-border" : "px-2 py-0.5 rounded-full border border-border bg-surface2 text-text"}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ── Campaigns list ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="card p-4 animate-pulse h-24" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <Mail size={24} className="text-accent" />
          </div>
          <p className="text-sm font-medium text-text">Нет кампаний</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={13} /> Создать первую кампанию
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const typeCfg   = TYPE_CONFIG[campaign.type];
            const statusCfg = STATUS_CONFIG[campaign.status];
            const TypeIcon   = typeCfg.icon;
            const StatusIcon = statusCfg.icon;

            return (
              <div key={campaign.id} className="card p-4 hover:border-accent/30 transition-all">
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", typeCfg.color)}>
                    <TypeIcon size={16} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-text">{campaign.name}</p>
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1", statusCfg.color)}>
                        <StatusIcon size={9} /> {statusCfg.label}
                      </span>
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border", typeCfg.color)}>
                        {typeCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-subtext line-clamp-1">{campaign.message.slice(0, 120)}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-subtext">
                      <span className="flex items-center gap-1"><Users size={9} /> {campaign.recipients.length} получателей</span>
                      <span className="flex items-center gap-1"><Send size={9} /> {campaign.sentCount} отправлено</span>
                      {campaign.replyCount > 0 && <span className="flex items-center gap-1"><MessageSquare size={9} /> {campaign.replyCount} ответов</span>}
                    </div>
                    {sendResult[campaign.id] && (
                      <p className="text-[10px] text-emerald-400 mt-1">{sendResult[campaign.id]}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {campaign.status !== "completed" && campaign.recipients.length > 0 && (
                      <button
                        onClick={() => sendCampaign(campaign.id)}
                        disabled={sending[campaign.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-[11px] font-medium transition-colors"
                      >
                        {sending[campaign.id] ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                        {sending[campaign.id] ? "Отправка…" : "Отправить"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="p-1.5 rounded-lg hover:bg-red-400/10 text-subtext hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create campaign modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="text-sm font-semibold text-text">Новая кампания</p>
              <button onClick={() => { setShowModal(false); setAiTemplates([]); setSelectedTplIdx(null); setTestResult(""); }} className="p-2 rounded-lg hover:bg-white/5 text-subtext"><X size={16} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Тип кампании</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(TYPE_CONFIG) as [CampaignType, typeof TYPE_CONFIG[CampaignType]][]).map(([t, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className={clsx(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[10px] transition-colors",
                          form.type === t ? cfg.color : "border-border text-subtext hover:border-accent/30"
                        )}
                      >
                        <Icon size={15} />
                        <span className="text-center leading-tight">{cfg.label.split(" ")[0]}<br/>{cfg.label.split(" ")[1]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Название</label>
                <input className="input w-full text-sm" placeholder="Название кампании" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Ниша аудитории</label>
                <input className="input w-full text-sm" placeholder="онлайн-образование, коучинг..." value={form.targetNiche}
                  onChange={(e) => setForm((f) => ({ ...f, targetNiche: e.target.value }))} />
              </div>

              {form.type === "email" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Тема письма</label>
                  <input className="input w-full text-sm" placeholder="Тема email..." value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
                </div>
              )}

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Текст сообщения</label>
                  <button onClick={generateAIMessage} disabled={aiLoading}
                    className="flex items-center gap-1.5 text-[10px] text-accent hover:text-accent/80 px-2 py-1 rounded-lg hover:bg-accent/10 transition-colors">
                    {aiLoading ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    {aiLoading ? "Генерируем…" : "Сгенерировать AI варианты"}
                  </button>
                </div>

                {/* AI template buttons */}
                {aiTemplates.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-subtext">Выберите вариант для редактирования:</p>
                    <div className="space-y-1.5">
                      {aiTemplates.map((tpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectTemplate(idx)}
                          className={clsx(
                            "w-full text-left px-3 py-2 rounded-xl border text-xs transition-all",
                            selectedTplIdx === idx
                              ? "border-accent/50 bg-accent/10 text-text"
                              : "border-border text-subtext hover:border-accent/30 hover:bg-accent/5"
                          )}
                        >
                          <span className="font-semibold text-accent mr-1">#{idx + 1}</span>
                          {tpl.slice(0, 100)}{tpl.length > 100 ? "…" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  className="input w-full h-32 resize-none text-sm"
                  placeholder="Текст рассылки. Используй {{имя}} для персонализации..."
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>

              {/* Test send */}
              <div className="space-y-1.5 border border-border rounded-xl p-3 bg-white/[0.02]">
                <p className="text-[10px] text-subtext uppercase tracking-wide font-semibold">Тестовая отправка</p>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-xs"
                    placeholder={form.type === "email" ? "your@email.com" : "@username или chat_id"}
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                  />
                  <button
                    onClick={testSend}
                    disabled={testSending || !testRecipient.trim() || !form.message.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium transition-colors disabled:opacity-40 shrink-0"
                  >
                    {testSending ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                    {testSending ? "Отправляем…" : "Отправить мне"}
                  </button>
                </div>
                {testResult && (
                  <p className={clsx("text-[10px]", testResult.startsWith("Ошибка") ? "text-red-400" : "text-emerald-400")}>
                    {testResult}
                  </p>
                )}
              </div>

              {/* Recipients */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">
                    Получатели ({form.type === "email" ? "emails" : "Telegram ID / username"})
                  </label>
                  <div className="flex items-center gap-1">
                    {["10", "50", "100"].map((n) => (
                      <button key={n}
                        onClick={() => {
                          const lines = form.recipientsRaw.split(/[,\n]/).map(r => r.trim()).filter(Boolean);
                          const sample = lines.slice(0, parseInt(n)).join("\n");
                          if (sample) setForm(f => ({ ...f, recipientsRaw: sample }));
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-border text-subtext hover:border-accent/30 hover:text-accent transition-colors"
                        title={`Отправить первым ${n}`}
                      >
                        Топ {n}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="input w-full h-20 resize-none text-xs font-mono"
                  placeholder={form.type === "email" ? "user@email.com\nuser2@email.com" : "@username1\n@username2\n-100123456789"}
                  value={form.recipientsRaw}
                  onChange={(e) => setForm((f) => ({ ...f, recipientsRaw: e.target.value }))}
                />
                <p className="text-[10px] text-subtext">
                  Каждый получатель с новой строки или через запятую
                  {form.recipientsRaw && ` · ${form.recipientsRaw.split(/[,\n]/).filter(Boolean).length} получателей`}
                </p>
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
              <button onClick={() => { setShowModal(false); setAiTemplates([]); setSelectedTplIdx(null); setTestResult(""); }} className="btn-ghost flex-1">Отмена</button>
              <button onClick={createCampaign} disabled={!form.name.trim() || !form.message.trim() || saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />}
                Создать кампанию
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
