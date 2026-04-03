"use client";
import { useState } from "react";
import {
  Package, Plus, X, Edit2, Check, Sparkles, DollarSign,
  Users, BookOpen, Star, ChevronDown, RefreshCw, Copy,
  Zap, Target, TrendingUp, Crown,
} from "lucide-react";
import clsx from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────
type ProductType = "mini" | "group" | "personal";

interface Product {
  id: string;
  type: ProductType;
  name: string;
  description: string;
  price: number;
  currency: "USD" | "KZT" | "RUB";
  features: string[];
  status: "active" | "draft" | "archived";
  salesCount: number;
  platform?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<ProductType, { label: string; icon: React.ElementType; color: string; description: string }> = {
  mini: {
    label: "Мини-продукт",
    icon: BookOpen,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    description: "Гайд, PDF, мини-курс в боте, закрытый канал",
  },
  group: {
    label: "Наставничество",
    icon: Users,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    description: "Групповая работа, средний чек, поток",
  },
  personal: {
    label: "Продюсирование",
    icon: Crown,
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    description: "Личная работа, высокий чек, VIP",
  },
};

const STATUS_CONFIG: Record<Product["status"], { label: string; color: string }> = {
  active:   { label: "Активен",  color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  draft:    { label: "Черновик", color: "text-amber-400 bg-amber-400/10 border-amber-400/20"       },
  archived: { label: "Архив",    color: "text-subtext bg-white/5 border-border"                    },
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1", type: "mini", name: "PDF-гайд: Первые 100K в нише",
    description: "Пошаговый план монетизации знаний с нуля. Включает шаблоны и чеклисты.",
    price: 29, currency: "USD", features: ["PDF 40+ страниц", "3 шаблона", "Чеклист запуска"],
    status: "active", salesCount: 47, platform: "Telegram бот",
  },
  {
    id: "p2", type: "group", name: "Групповое наставничество «Взлёт»",
    description: "8 недель групповой работы: стратегия, контент, запуск продукта.",
    price: 500, currency: "USD", features: ["8 недель", "Еженедельные звонки", "Чат поддержки", "Обратная связь"],
    status: "active", salesCount: 12,
  },
  {
    id: "p3", type: "personal", name: "VIP Продюсирование",
    description: "Полное сопровождение: упаковка, продвижение, монетизация.",
    price: 3000, currency: "USD", features: ["3 месяца работы", "Ежедневная связь", "Команда под ключ", "Гарантия результата"],
    status: "active", salesCount: 3,
  },
];

const EMPTY_PRODUCT: Omit<Product, "id" | "salesCount"> = {
  type: "mini", name: "", description: "", price: 0, currency: "USD",
  features: [], status: "draft",
};

// ── Product card ───────────────────────────────────────────────────────────────
function ProductCard({
  product, onEdit, onDelete, onAI,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onAI: (p: Product) => void;
}) {
  const typeCfg   = TYPE_CONFIG[product.type];
  const statusCfg = STATUS_CONFIG[product.status];
  const TypeIcon  = typeCfg.icon;

  return (
    <div className="card p-4 flex flex-col gap-3 hover:border-accent/30 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border", typeCfg.color)}>
            <TypeIcon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-text truncate">{product.name}</p>
            <p className={clsx("text-[10px] font-medium", typeCfg.color.split(" ")[0])}>{typeCfg.label}</p>
          </div>
        </div>
        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border shrink-0", statusCfg.color)}>
          {statusCfg.label}
        </span>
      </div>

      <p className="text-xs text-subtext leading-snug line-clamp-2">{product.description}</p>

      {/* Features */}
      {product.features.length > 0 && (
        <ul className="space-y-0.5">
          {product.features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[11px] text-text">
              <Check size={9} className="text-emerald-400 shrink-0" /> {f}
            </li>
          ))}
        </ul>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div>
          <p className="text-base font-bold text-text">
            {product.price.toLocaleString()} <span className="text-xs text-subtext font-normal">{product.currency}</span>
          </p>
          {product.platform && <p className="text-[10px] text-subtext">{product.platform}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-accent">{product.salesCount}</p>
          <p className="text-[10px] text-subtext">продаж</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button onClick={() => onEdit(product)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-subtext hover:text-text text-[11px] transition-colors">
          <Edit2 size={10} /> Изменить
        </button>
        <button onClick={() => onAI(product)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-[11px] transition-colors">
          <Sparkles size={10} /> AI Описание
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isNew, setIsNew]             = useState(false);
  const [draft, setDraft] = useState<Omit<Product, "id" | "salesCount">>(EMPTY_PRODUCT);
  const [newFeature, setNewFeature]   = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiResult, setAiResult]       = useState("");
  const [aiProduct, setAiProduct]     = useState<Product | null>(null);
  const [copied, setCopied]           = useState(false);

  function openNew() {
    setDraft({ ...EMPTY_PRODUCT });
    setIsNew(true);
    setEditProduct(null);
  }

  function openEdit(p: Product) {
    setDraft({ type: p.type, name: p.name, description: p.description, price: p.price, currency: p.currency, features: [...p.features], status: p.status, platform: p.platform });
    setEditProduct(p);
    setIsNew(false);
  }

  function saveProduct() {
    if (!draft.name.trim()) return;
    if (isNew) {
      const newP: Product = { ...draft, id: `p_${Date.now()}`, salesCount: 0 };
      setProducts((prev) => [newP, ...prev]);
    } else if (editProduct) {
      setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...draft } : p));
    }
    setEditProduct(null);
    setIsNew(false);
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function addFeature() {
    if (!newFeature.trim()) return;
    setDraft((d) => ({ ...d, features: [...d.features, newFeature.trim()] }));
    setNewFeature("");
  }

  async function generateAIDesc(product: Product) {
    setAiProduct(product);
    setAiResult("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "productDescription",
          data: { product: { name: product.name, type: product.type, price: product.price, currency: product.currency, features: product.features, description: product.description } },
        }),
      });
      const json = await res.json();
      setAiResult(json.result ?? "");
    } catch {
      setAiResult("Ошибка генерации.");
    } finally {
      setAiLoading(false);
    }
  }

  // KPI
  const revenue   = products.filter(p => p.status === "active").reduce((s, p) => s + p.price * p.salesCount, 0);
  const totalSales = products.reduce((s, p) => s + p.salesCount, 0);

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Package size={20} className="text-accent" /> Продукты
          </h1>
          <p className="text-sm text-subtext mt-0.5">
            Мини-продукты · Наставничество · Продюсирование
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Новый продукт
        </button>
      </div>

      {/* ── KPI ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-text">{products.filter(p => p.status === "active").length}</p>
          <p className="text-[10px] text-subtext mt-0.5">Активных</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-accent">{totalSales}</p>
          <p className="text-[10px] text-subtext mt-0.5">Всего продаж</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">${revenue.toLocaleString()}</p>
          <p className="text-[10px] text-subtext mt-0.5">Выручка</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-lg font-bold text-amber-400">
            {totalSales > 0 ? `$${Math.round(revenue / totalSales)}` : "—"}
          </p>
          <p className="text-[10px] text-subtext mt-0.5">Средний чек</p>
        </div>
      </div>

      {/* ── Type sections ─────────────────────────────────────────────────────── */}
      {(["mini", "group", "personal"] as ProductType[]).map((type) => {
        const typeProd = products.filter((p) => p.type === type);
        if (typeProd.length === 0) return null;
        const cfg = TYPE_CONFIG[type];
        const Icon = cfg.icon;
        return (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center border text-[11px]", cfg.color)}>
                <Icon size={12} />
              </div>
              <h2 className="text-sm font-semibold text-text">{cfg.label}</h2>
              <span className="text-xs text-subtext">— {cfg.description}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
              {typeProd.map((p) => (
                <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={deleteProduct} onAI={generateAIDesc} />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Funnel tip ────────────────────────────────────────────────────────── */}
      <div className="card p-4 border-accent/20 bg-accent/5">
        <p className="text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
          <Zap size={13} className="text-accent" /> Рекомендуемая продуктовая лестница
        </p>
        <div className="flex flex-wrap gap-2 items-center text-xs text-subtext">
          {[
            { label: "Бесплатный лид-магнит", color: "border-border" },
            "→",
            { label: "Мини-продукт $29–99", color: "border-blue-400/30 text-blue-400" },
            "→",
            { label: "Группа $300–700", color: "border-amber-400/30 text-amber-400" },
            "→",
            { label: "VIP $1000–5000+", color: "border-purple-400/30 text-purple-400" },
          ].map((step, i) =>
            typeof step === "string"
              ? <span key={i} className="text-border">{step}</span>
              : <span key={i} className={clsx("px-2.5 py-1 rounded-full border bg-surface2", step.color, !step.color.includes("text-") && "text-subtext")}>{step.label}</span>
          )}
        </div>
      </div>

      {/* ── Edit / Create modal ───────────────────────────────────────────────── */}
      {(editProduct || isNew) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="text-sm font-semibold text-text">{isNew ? "Новый продукт" : "Редактировать"}</p>
              <button onClick={() => { setEditProduct(null); setIsNew(false); }} className="p-2 rounded-lg hover:bg-white/5 text-subtext">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Тип продукта</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["mini", "group", "personal"] as ProductType[]).map((t) => {
                    const c = TYPE_CONFIG[t];
                    const Icon = c.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setDraft((d) => ({ ...d, type: t }))}
                        className={clsx("flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[11px] transition-colors", draft.type === t ? c.color : "border-border text-subtext hover:border-accent/30")}
                      >
                        <Icon size={16} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Название</label>
                <input
                  className="input w-full text-sm"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") saveProduct(); }}
                  placeholder="Название продукта"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Описание</label>
                <textarea
                  className="input w-full text-sm h-20 resize-none"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Что получает клиент?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Цена</label>
                  <input
                    type="number"
                    className="input w-full text-sm"
                    value={draft.price}
                    onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Валюта</label>
                  <select className="input w-full text-sm" value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value as any }))}>
                    <option value="USD">USD</option>
                    <option value="KZT">KZT</option>
                    <option value="RUB">RUB</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Статус</label>
                  <select className="input w-full text-sm" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as any }))}>
                    <option value="active">Активен</option>
                    <option value="draft">Черновик</option>
                    <option value="archived">Архив</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-subtext uppercase tracking-wide">Платформа</label>
                  <input
                    className="input w-full text-sm"
                    value={draft.platform ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))}
                    placeholder="Telegram бот, Notion…"
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-subtext uppercase tracking-wide">Включает</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                    placeholder="Добавить пункт..."
                  />
                  <button onClick={addFeature} className="btn-ghost px-3"><Plus size={14} /></button>
                </div>
                {draft.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-text">
                    <Check size={10} className="text-emerald-400" />
                    <span className="flex-1">{f}</span>
                    <button onClick={() => setDraft((d) => ({ ...d, features: d.features.filter((_, j) => j !== i) }))} className="text-subtext hover:text-red-400">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
              <button onClick={() => { setEditProduct(null); setIsNew(false); }} className="btn-ghost flex-1">Отмена</button>
              <button onClick={saveProduct} disabled={!draft.name.trim()} className="btn-primary flex-1">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI description modal ──────────────────────────────────────────────── */}
      {aiProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <p className="text-sm font-semibold text-text">AI Описание: {aiProduct.name}</p>
              <button onClick={() => { setAiProduct(null); setAiResult(""); }} className="p-2 rounded-lg hover:bg-white/5 text-subtext">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {aiLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center text-subtext text-sm">
                  <RefreshCw size={14} className="animate-spin" /> Генерируем продающее описание…
                </div>
              ) : (
                <pre className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans">{aiResult || "Нажми «Сгенерировать»"}</pre>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-border shrink-0">
              <button onClick={() => generateAIDesc(aiProduct)} disabled={aiLoading} className="btn-ghost flex-1 flex items-center justify-center gap-2">
                <RefreshCw size={13} className={aiLoading ? "animate-spin" : ""} /> Ещё вариант
              </button>
              {aiResult && (
                <button onClick={async () => { await navigator.clipboard.writeText(aiResult); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
