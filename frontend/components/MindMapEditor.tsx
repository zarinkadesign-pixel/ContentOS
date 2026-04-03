"use client";

import { useState, useMemo, useRef } from "react";
import type { MindMapData, MindMapNode, Client } from "@/lib/types";
import { Sparkles, Plus, BarChart2, Save, Check, ZoomIn, ZoomOut } from "lucide-react";

// ── Layout constants ──────────────────────────────────────────────────────────
const NW = 154;   // node width
const NH = 44;    // node height
const LG = 170;   // horizontal gap between levels
const RH = 62;    // row height per leaf slot

// ── Color palette ─────────────────────────────────────────────────────────────
const C: Record<string, { bg: string; bd: string; tx: string; ln: string }> = {
  root:    { bg: "#0d2240", bd: "#3b82f6", tx: "#93c5fd", ln: "#3b82f6" },
  violet:  { bg: "#1a0b36", bd: "#7c3aed", tx: "#c4b5fd", ln: "#7c3aed" },
  blue:    { bg: "#0b1d3a", bd: "#2563eb", tx: "#93c5fd", ln: "#2563eb" },
  emerald: { bg: "#02271e", bd: "#059669", tx: "#6ee7b7", ln: "#059669" },
  amber:   { bg: "#251202", bd: "#d97706", tx: "#fcd34d", ln: "#d97706" },
  pink:    { bg: "#280415", bd: "#db2777", tx: "#f9a8d4", ln: "#db2777" },
  cyan:    { bg: "#031c2a", bd: "#0891b2", tx: "#67e8f9", ln: "#0891b2" },
  rose:    { bg: "#280410", bd: "#e11d48", tx: "#fda4af", ln: "#e11d48" },
  default: { bg: "#111827", bd: "#374151", tx: "#9ca3af", ln: "#374151" },
};

// ── Tree layout ───────────────────────────────────────────────────────────────
function buildChildren(nodes: MindMapNode[]) {
  const map: Record<string, string[]> = {};
  nodes.forEach(n => {
    if (!map[n.id]) map[n.id] = [];
    if (n.parent) {
      if (!map[n.parent]) map[n.parent] = [];
      map[n.parent].push(n.id);
    }
  });
  return map;
}

function leafCount(id: string, ch: Record<string, string[]>): number {
  const kids = ch[id] || [];
  if (!kids.length) return 1;
  return kids.reduce((s, k) => s + leafCount(k, ch), 0);
}

function computeLayout(nodes: MindMapNode[]) {
  const ch = buildChildren(nodes);
  const root = nodes.find(n => !n.parent);
  if (!root) return { pos: {}, w: 600, h: 400, ch };

  const pos: Record<string, { x: number; y: number }> = {};

  function place(id: string, level: number, yOff: number): number {
    const kids = ch[id] || [];
    const leaves = leafCount(id, ch);
    const cy = yOff + (leaves * RH) / 2 - NH / 2;
    pos[id] = { x: level * (NW + LG) + 32, y: cy };
    let y = yOff;
    kids.forEach(kid => {
      place(kid, level + 1, y);
      y += leafCount(kid, ch) * RH;
    });
    return leaves;
  }

  const totalLeaves = place(root.id, 0, 24);
  const maxLev = Math.max(...nodes.map(n => {
    let l = 0, id = n.id;
    while (true) {
      const nd = nodes.find(x => x.id === id);
      if (!nd?.parent) break;
      l++; id = nd.parent;
    }
    return l;
  }));

  return {
    pos,
    w: (maxLev + 1) * (NW + LG) + 32 + NW + 48,
    h: totalLeaves * RH + 48,
    ch,
  };
}

// ── Default mind map ──────────────────────────────────────────────────────────
function defaultNodes(client: Client): MindMapNode[] {
  const prods = (client.products || []).slice(0, 4).map((p, i) => ({
    id: `prod-${i}`, label: p, type: "node" as const, parent: "products", color: "emerald",
  }));

  return [
    { id: "root",      label: client.name || "Клиент",     type: "root",     parent: null },
    { id: "meanings",  label: "💡 Смыслы",                  type: "category", parent: "root",    color: "violet" },
    { id: "m-pain",    label: "Боль ЦА",                    type: "node",     parent: "meanings", color: "violet" },
    { id: "m-desire",  label: "Желание",                    type: "node",     parent: "meanings", color: "violet" },
    { id: "m-utp",     label: "УТП",                        type: "node",     parent: "meanings", color: "violet" },
    { id: "m-voice",   label: "Голос бренда",               type: "node",     parent: "meanings", color: "violet" },
    { id: "journey",   label: "🗺 Путь клиента",             type: "category", parent: "root",    color: "blue" },
    { id: "j-aware",   label: "Осведомлённость",             type: "node",     parent: "journey",  color: "blue", conversion: 100 },
    { id: "j-int",     label: "Интерес",                    type: "node",     parent: "journey",  color: "blue", conversion: 40 },
    { id: "j-con",     label: "Рассмотрение",               type: "node",     parent: "journey",  color: "blue", conversion: 20 },
    { id: "j-buy",     label: "Покупка",                    type: "node",     parent: "journey",  color: "blue", conversion: 8 },
    { id: "j-ret",     label: "Удержание",                  type: "node",     parent: "journey",  color: "blue", conversion: 60 },
    { id: "products",  label: "📦 Продукты",                type: "category", parent: "root",    color: "emerald" },
    ...(prods.length ? prods : [{ id: "prod-0", label: "Добавить продукт", type: "node" as const, parent: "products", color: "emerald" }]),
    { id: "funnel",    label: "🔄 Воронка",                  type: "category", parent: "root",    color: "amber" },
    { id: "f-traffic", label: "Трафик (Reels)",              type: "node",     parent: "funnel",   color: "amber" },
    { id: "f-sub",     label: "Подписка",                   type: "node",     parent: "funnel",   color: "amber" },
    { id: "f-warm",    label: "Прогрев",                    type: "node",     parent: "funnel",   color: "amber" },
    { id: "f-lead",    label: "Лид / DM",                   type: "node",     parent: "funnel",   color: "amber" },
    { id: "f-sale",    label: "Продажа",                    type: "node",     parent: "funnel",   color: "amber" },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  client: Client;
  onSave: (data: MindMapData) => Promise<void>;
}

export default function MindMapEditor({ client, onSave }: Props) {
  const [nodes, setNodes] = useState<MindMapNode[]>(
    client.mind_map?.nodes?.length ? client.mind_map.nodes : defaultNodes(client)
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing]   = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showConv, setShowConv] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [zoom, setZoom]         = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { pos, w, h, ch } = useMemo(() => computeLayout(nodes), [nodes]);

  // ── Edges ──────────────────────────────────────────────────────────────────
  const edges = useMemo(() =>
    nodes
      .filter(n => n.parent && pos[n.id] && pos[n.parent!])
      .map(n => {
        const p = pos[n.parent!];
        const c = pos[n.id];
        const x1 = p.x + NW, y1 = p.y + NH / 2;
        const x2 = c.x,      y2 = c.y + NH / 2;
        const mx = (x1 + x2) / 2;
        const parentNode = nodes.find(x => x.id === n.parent);
        const ck = (n.type === "category"
          ? n.color
          : parentNode?.type === "root" ? n.color : parentNode?.color
        ) ?? "default";
        return { id: n.id, d: `M${x1} ${y1} C${mx} ${y1},${mx} ${y2},${x2} ${y2}`, ln: C[ck]?.ln ?? C.default.ln };
      }),
  [nodes, pos]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function startEdit(n: MindMapNode) {
    setEditing(n.id);
    setEditText(n.label);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function commitEdit() {
    if (!editing) return;
    setNodes(prev => prev.map(n => n.id === editing ? { ...n, label: editText } : n));
    setEditing(null);
  }

  function addChild(parentId: string) {
    const parent = nodes.find(n => n.id === parentId);
    const newId = `n-${Date.now()}`;
    const color = parent?.type === "root" ? "default" : (parent?.color ?? "default");
    const newNode: MindMapNode = { id: newId, label: "Новый узел", type: "node", parent: parentId, color };
    setNodes(prev => [...prev, newNode]);
    setTimeout(() => startEdit(newNode), 60);
  }

  function deleteNode(id: string) {
    const toDelete = new Set<string>();
    function collect(nid: string) {
      toDelete.add(nid);
      (ch[nid] || []).forEach(collect);
    }
    collect(id);
    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    if (selected === id) setSelected(null);
  }

  function setConversion(id: string, val: number) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, conversion: Math.min(100, Math.max(0, val)) } : n));
  }

  async function handleSave() {
    setSaving(true);
    await onSave({ nodes });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAI() {
    setAiLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          messages: [{
            role: "user",
            content: `Создай майнд-карту смыслов и пути клиента для:
Имя: ${client.name}
Ниша: ${client.niche}
Продукты: ${(client.products || []).join(", ")}
Воронка: ${client.funnel || "не указана"}
Стратегия: ${client.strategy || "не указана"}

Верни ТОЛЬКО JSON массив без комментариев:
[{"id":"root","label":"${client.name}","type":"root","parent":null},{"id":"meanings","label":"💡 Смыслы","type":"category","parent":"root","color":"violet"},...]

Разделы: Смыслы (боль, желание, УТП, голос бренда), Путь клиента (с conversion 0-100), Продукты (из данных), Воронка (шаги). Максимум 28 узлов.`,
          }],
        }),
      });
      const data = await res.json();
      const raw = (data.content || data.result || "") as string;
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as MindMapNode[];
        if (parsed.length > 0) setNodes(parsed);
      }
    } catch (e) {
      console.error("AI mindmap error", e);
    }
    setAiLoading(false);
  }

  // ── Journey conversion nodes ───────────────────────────────────────────────
  const journeyId = nodes.find(n => n.label.includes("Путь") || n.id === "journey")?.id;
  const convNodes = journeyId ? nodes.filter(n => n.parent === journeyId) : [];

  // ── Color for a node ───────────────────────────────────────────────────────
  function colorOf(n: MindMapNode) {
    if (n.type === "root") return C.root;
    return C[n.color ?? "default"] ?? C.default;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleAI} disabled={aiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 disabled:opacity-50 transition-colors"
        >
          <Sparkles size={13} />
          {aiLoading ? "Генерирую…" : "AI Генерация"}
        </button>
        <button
          onClick={() => addChild("root")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-subtext hover:border-accent/40 transition-colors"
        >
          <Plus size={13} /> Раздел
        </button>
        <button
          onClick={() => setShowConv(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${showConv ? "bg-blue-500/15 border-blue-500/40 text-blue-300" : "bg-surface border-border text-subtext hover:border-accent/40"}`}
        >
          <BarChart2 size={13} /> Конверсия
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1.5 rounded bg-surface border border-border text-subtext hover:text-text"><ZoomOut size={14} /></button>
          <span className="text-xs text-subtext w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.6, z + 0.1))} className="p-1.5 rounded bg-surface border border-border text-subtext hover:text-text"><ZoomIn size={14} /></button>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${saved ? "bg-green-500/20 border border-green-500/40 text-green-300" : "bg-accent text-white hover:bg-accent/80"}`}
        >
          {saved ? <><Check size={13} /> Сохранено</> : <><Save size={13} /> Сохранить</>}
        </button>
      </div>

      {/* ── Conversion funnel panel ── */}
      {showConv && convNodes.length > 0 && (
        <div className="p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs text-subtext uppercase tracking-wider mb-4">Воронка конверсий — Путь клиента</p>
          <div className="flex items-end gap-3 flex-wrap">
            {convNodes.map((n, i) => {
              const prev = i > 0 ? (convNodes[i - 1].conversion ?? 100) : 100;
              const curr = n.conversion ?? 0;
              const drop = i > 0 && prev > 0 ? Math.round(100 - (curr / prev) * 100) : 0;
              const barH  = Math.max(12, Math.round((curr / 100) * 80));
              return (
                <div key={n.id} className="flex flex-col items-center gap-1 min-w-[72px]">
                  <div className="relative flex items-end" style={{ height: 90 }}>
                    {i > 0 && drop > 0 && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-red-400 whitespace-nowrap">
                        −{drop}%
                      </span>
                    )}
                    <div
                      className="w-14 rounded-t transition-all"
                      style={{ height: barH, background: `${C.blue.bd}30`, borderTop: `2px solid ${C.blue.bd}` }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number" min={0} max={100} value={curr}
                      onChange={e => setConversion(n.id, Number(e.target.value))}
                      className="w-12 text-center text-xs bg-nav border border-border rounded text-text py-0.5"
                    />
                    <span className="text-xs text-subtext">%</span>
                  </div>
                  <p className="text-[11px] text-subtext text-center leading-tight max-w-[72px]">{n.label}</p>
                </div>
              );
            })}
          </div>
          {convNodes.length >= 2 && (
            <p className="mt-3 text-xs text-subtext">
              Итоговая конверсия:{" "}
              <span className="text-text font-medium">
                {convNodes[convNodes.length - 1].conversion ?? 0}%
              </span>
              {" "}от осведомлённости до покупки
            </p>
          )}
        </div>
      )}

      {/* ── Mind map canvas ── */}
      <div className="relative rounded-xl border border-border bg-[#070b14] overflow-auto" style={{ minHeight: 420, maxHeight: 580 }}>
        <div
          style={{
            width:  Math.max(w, 600) * zoom,
            height: Math.max(h, 400) * zoom,
            position: "relative",
            transformOrigin: "top left",
            transform: `scale(${zoom})`,
            transformBox: "fill-box",
          }}
        >
          {/* SVG edges */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {edges.map(e => (
              <path key={e.id} d={e.d} stroke={e.ln} strokeWidth={1.5} fill="none" opacity={0.45} />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map(n => {
            const p = pos[n.id];
            if (!p) return null;
            const col  = colorOf(n);
            const isSel = selected === n.id;
            const isEd  = editing  === n.id;

            return (
              <div
                key={n.id}
                style={{
                  position: "absolute",
                  left: p.x, top: p.y,
                  width: NW, height: NH,
                  background: col.bg,
                  border: `1.5px solid ${isSel ? "#ffffff90" : col.bd}`,
                  borderRadius: n.type === "root" ? 12 : n.type === "category" ? 10 : 7,
                  boxShadow: isSel ? `0 0 0 2px ${col.bd}60` : "none",
                  cursor: "pointer",
                  zIndex: isSel ? 20 : 1,
                  transition: "box-shadow 0.12s, border-color 0.12s",
                }}
                onClick={e => { e.stopPropagation(); setSelected(isSel ? null : n.id); }}
                onDoubleClick={e => { e.stopPropagation(); startEdit(n); }}
              >
                <div className="relative w-full h-full flex items-center px-2 gap-1 overflow-hidden">
                  {isEd ? (
                    <input
                      ref={inputRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: col.tx, fontSize: n.type === "root" ? 13 : 11, fontWeight: n.type === "root" ? 700 : 400 }}
                    />
                  ) : (
                    <span style={{ color: col.tx, fontSize: n.type === "root" ? 13 : 11, fontWeight: n.type === "root" ? 700 : n.type === "category" ? 600 : 400, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.label}
                    </span>
                  )}

                  {/* Conversion badge */}
                  {showConv && n.conversion !== undefined && !isEd && (
                    <span style={{ fontSize: 9, flexShrink: 0, background: "#00000050", borderRadius: 4, padding: "1px 4px", color: n.conversion > 20 ? "#4ade80" : n.conversion > 5 ? "#facc15" : "#f87171" }}>
                      {n.conversion}%
                    </span>
                  )}
                </div>

                {/* Action buttons (shown when selected) */}
                {isSel && !isEd && (
                  <div style={{ position: "absolute", right: -72, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 3, zIndex: 30 }}>
                    <button
                      onClick={e => { e.stopPropagation(); startEdit(n); }}
                      title="Редактировать"
                      style={{ width: 24, height: 24, background: "#1f2937", border: "1px solid #374151", borderRadius: 4, color: "#9ca3af", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >✏</button>
                    <button
                      onClick={e => { e.stopPropagation(); addChild(n.id); }}
                      title="Добавить дочерний"
                      style={{ width: 24, height: 24, background: "#1f2937", border: "1px solid #374151", borderRadius: 4, color: "#9ca3af", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >+</button>
                    {n.type !== "root" && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteNode(n.id); }}
                        title="Удалить"
                        style={{ width: 24, height: 24, background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 4, color: "#f87171", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >×</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-subtext">
        Клик — выделить · Двойной клик — редактировать · Выбери узел → <span className="text-text">+</span> добавить дочерний · <span className="text-text">×</span> удалить
      </p>
    </div>
  );
}
