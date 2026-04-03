"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Zap, Globe, Clapperboard, CheckCircle, ArrowRight, Star,
  Play, LayoutDashboard, Users, DollarSign, BrainCircuit,
  Kanban, Video, Bot, LayoutGrid, ChevronRight, X,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL MOCKUPS — mini CSS screenshots of each module
// ─────────────────────────────────────────────────────────────────────────────

function MockupDashboard() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Дашборд</span>
        <div className="ml-auto flex gap-1.5"><div className="w-12 h-1.5 rounded bg-[#1a1f3a]"/><div className="w-8 h-1.5 rounded bg-[#1a1f3a]"/></div>
      </div>
      <div className="p-3 space-y-2.5">
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-1.5">
          {[["$12 400","Доход","text-green-400"],["5","Клиенты","text-[#6c63ff]"],["$10 300","Прибыль","text-emerald-400"]] .map(([v,l,c])=>(
            <div key={l} className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2 text-center">
              <div className={`text-xs font-bold ${c}`}>{v}</div>
              <div className="text-[8px] text-[#64748b] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2">
          <div className="text-[8px] text-[#64748b] mb-1.5">Доход по месяцам ($)</div>
          <div className="flex items-end gap-1" style={{height:36}}>
            {[35,50,42,68,58,80,92].map((h,i)=>(
              <div key={i} className="flex-1 rounded-t-sm transition-all" style={{height:`${h}%`,background:i===6?"#6c63ff":i===5?"#4f46e5":"#1a1f3a"}}/>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["Янв","Фев","Мар","Апр","Май","Июн","Июл"].map(m=>(
              <div key={m} className="text-[7px] text-[#374151] flex-1 text-center">{m}</div>
            ))}
          </div>
        </div>
        {/* Clients */}
        <div className="space-y-1">
          <div className="text-[8px] text-[#64748b] uppercase tracking-wider mb-1">Активные клиенты</div>
          {[["А","Алина Мороз","$8K → $25K","green"],["М","Максим К.","$3.5K → $10K","blue"],["Ю","Юлия З.","$5.2K → $15K","amber"]] .map(([init,name,income,dot])=>(
            <div key={name} className="flex items-center gap-1.5 bg-[#0d1527] rounded-lg px-2 py-1">
              <div className="w-4 h-4 rounded-full bg-[#6c63ff]/20 text-[#6c63ff] text-[7px] flex items-center justify-center font-bold">{init}</div>
              <span className="text-[9px] text-[#e2e8f0] flex-1">{name}</span>
              <span className="text-[8px] text-[#64748b]">{income}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${dot==="green"?"bg-green-400":dot==="amber"?"bg-amber-400":"bg-blue-400"}`}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupAITeam() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · AI Команда</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-[8px] text-[#64748b] uppercase tracking-wider">Офис AI-сотрудников</div>
        <div className="grid grid-cols-5 gap-1.5">
          {[["🧠","Стратег","done"],["✍️","Копир.","done"],["🎯","Таргет","run"],["📊","Аналит","idle"],["🎬","SMM","idle"],["🔮","Продюс","done"],["🌀","Воронка","idle"],["📦","Продукт","idle"],["💰","Сейлз","idle"],["📈","Бизнес","run"]] .map(([em,name,status])=>(
            <div key={name} className={`rounded-xl p-1.5 text-center border ${status==="done"?"border-green-500/30 bg-green-500/5":status==="run"?"border-[#6c63ff]/40 bg-[#6c63ff]/10 animate-pulse":"border-[#1a1f3a] bg-[#0d1527]"}`}>
              <div className="text-sm">{em}</div>
              <div className="text-[7px] text-[#64748b] mt-0.5">{name}</div>
              <div className={`mt-0.5 w-1.5 h-1.5 rounded-full mx-auto ${status==="done"?"bg-green-400":status==="run"?"bg-[#6c63ff]":"bg-[#374151]"}`}/>
            </div>
          ))}
        </div>
        {/* Task result */}
        <div className="bg-[#0d1527] border border-green-500/20 rounded-lg p-2 mt-1">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-3 h-3 rounded bg-green-500/20 flex items-center justify-center"><span className="text-[7px]">✓</span></div>
            <span className="text-[9px] text-green-400 font-medium">Стратег завершил задачу</span>
            <span className="ml-auto text-[7px] text-[#374151]">2 мин назад</span>
          </div>
          <div className="space-y-0.5">
            <div className="h-1.5 bg-[#1a1f3a] rounded w-full"/>
            <div className="h-1.5 bg-[#1a1f3a] rounded w-4/5"/>
            <div className="h-1.5 bg-[#1a1f3a] rounded w-3/5"/>
          </div>
          <div className="flex gap-1 mt-1.5">
            <div className="text-[7px] bg-[#6c63ff]/20 text-[#6c63ff] px-1.5 py-0.5 rounded">Скачать .md</div>
            <div className="text-[7px] bg-[#1a1f3a] text-[#64748b] px-1.5 py-0.5 rounded">Сохранить в профиль</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupCRM() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · CRM Лиды</span>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { col: "Новые", color: "border-blue-500/30 bg-blue-500/5", badge: "bg-blue-500/20 text-blue-300",
              cards: [["Иван П.","Нутрициология","$2K/мес"],["Сабина М.","Коучинг","—"]] },
            { col: "В работе", color: "border-amber-500/30 bg-amber-500/5", badge: "bg-amber-500/20 text-amber-300",
              cards: [["Артур Н.","Фитнес","$5K/мес"]] },
            { col: "Закрыты", color: "border-green-500/30 bg-green-500/5", badge: "bg-green-500/20 text-green-300",
              cards: [["Алина М.","Питание","$8K/мес"],["Юлия З.","Психолог","$5.2K"]] },
          ].map(({col,color,badge,cards})=>(
            <div key={col} className={`border rounded-xl p-2 ${color}`}>
              <div className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full inline-block mb-2 ${badge}`}>{col} {cards.length}</div>
              <div className="space-y-1.5">
                {cards.map(([name,niche,rev])=>(
                  <div key={name} className="bg-[#080d1e] border border-[#1a1f3a] rounded-lg p-1.5">
                    <div className="text-[9px] font-medium text-[#e2e8f0]">{name}</div>
                    <div className="text-[7px] text-[#64748b]">{niche}</div>
                    <div className="text-[8px] text-green-400 mt-0.5">{rev}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 bg-[#0d1527] border border-[#1a1f3a] rounded-lg px-2 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#6c63ff]"/>
          <span className="text-[8px] text-[#64748b]">Перетащи карточку в следующий этап…</span>
        </div>
      </div>
    </div>
  );
}

function MockupClients() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">Алина Мороз · профиль</span>
      </div>
      <div className="p-3 space-y-2">
        {/* Profile header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#6c63ff]/20 flex items-center justify-center text-[#6c63ff] font-bold text-sm">А</div>
          <div><div className="text-[10px] font-bold text-[#e2e8f0]">Алина Мороз</div><div className="text-[8px] text-[#64748b]">Нутрициология · @alina</div></div>
          <div className="ml-auto text-right"><div className="text-[10px] font-bold text-green-400">$8 000</div><div className="text-[7px] text-[#64748b]">→ $25 000</div></div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#1a1f3a] pb-1">
          {["Задачи","Обзор","Бренд","Контент","AI"].map((t,i)=>(
            <div key={t} className={`text-[7px] px-1.5 py-0.5 rounded ${i===0?"text-[#6c63ff] border-b border-[#6c63ff]":"text-[#64748b]"}`}>{t}</div>
          ))}
        </div>
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[7px] text-[#64748b] mb-1"><span>Прогресс</span><span>7/10 (70%)</span></div>
          <div className="h-1.5 bg-[#1a1f3a] rounded-full"><div className="h-full bg-[#6c63ff] rounded-full" style={{width:"70%"}}/></div>
        </div>
        {/* Checklist */}
        <div className="space-y-1">
          {[["✓","Распаковка личности","done"],["✓","Контент-план","done"],["○","Запуск рекламы","todo"],["○","Воронка продаж","todo"]] .map(([ic,task,s])=>(
            <div key={task} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${s==="done"?"bg-green-500/5":"bg-[#0d1527] border border-[#1a1f3a]"}`}>
              <span className={`text-[9px] ${s==="done"?"text-green-400":"text-[#374151]"}`}>{ic}</span>
              <span className={`text-[8px] flex-1 ${s==="done"?"text-[#64748b] line-through":"text-[#e2e8f0]"}`}>{task}</span>
              {s==="todo" && <div className="text-[6px] bg-[#6c63ff]/20 text-[#6c63ff] px-1 py-0.5 rounded">▶ Старт</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupFinance() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Финансы</span>
      </div>
      <div className="p-3 space-y-2">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
            <div className="text-[10px] font-bold text-green-400">$12 400</div>
            <div className="text-[7px] text-[#64748b]">Доход</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
            <div className="text-[10px] font-bold text-red-400">$2 100</div>
            <div className="text-[7px] text-[#64748b]">Расходы</div>
          </div>
          <div className="bg-[#6c63ff]/10 border border-[#6c63ff]/20 rounded-lg p-2 text-center">
            <div className="text-[10px] font-bold text-[#6c63ff]">$10 300</div>
            <div className="text-[7px] text-[#64748b]">Прибыль</div>
          </div>
        </div>
        {/* P&L bar */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2">
          <div className="text-[7px] text-[#64748b] mb-1.5">Доходы / Расходы</div>
          <div className="flex gap-1 items-end" style={{height:30}}>
            <div className="rounded-t-sm bg-green-500/60 flex-1" style={{height:"100%"}}/>
            <div className="rounded-t-sm bg-red-500/50 flex-1" style={{height:"17%"}}/>
          </div>
          <div className="flex gap-1 mt-0.5">
            <div className="text-[7px] text-[#64748b] flex-1 text-center">Доход</div>
            <div className="text-[7px] text-[#64748b] flex-1 text-center">Расход</div>
          </div>
        </div>
        {/* Transactions */}
        <div className="space-y-1">
          <div className="text-[7px] text-[#64748b] uppercase tracking-wider">Последние транзакции</div>
          {[["+$3 000","Алина Мороз · продюс.","green","10 июл"],["+$2 400","Максим К. · пакет","green","09 июл"],["−$350","Инструменты","red","08 июл"],["+$1 500","Юлия З. · консульт","green","07 июл"]] .map(([amt,desc,color,date])=>(
            <div key={desc} className="flex items-center gap-1.5 bg-[#0d1527] rounded-lg px-2 py-1">
              <span className={`text-[9px] font-bold ${color==="green"?"text-green-400":"text-red-400"}`}>{amt}</span>
              <span className="text-[8px] text-[#64748b] flex-1">{desc}</span>
              <span className="text-[7px] text-[#374151]">{date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupWorkspace() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Рабочий кабинет</span>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1.5 mb-1">
          {[["12","Всего"],["4","Активных"],["8","Готово"]].map(([v,l])=>(
            <div key={l} className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2 text-center">
              <div className="text-xs font-bold text-[#6c63ff]">{v}</div>
              <div className="text-[7px] text-[#64748b]">{l}</div>
            </div>
          ))}
        </div>
        {/* Task list */}
        <div className="space-y-1.5">
          {[
            {t:"Стратегия для Алины Мороз",s:"done",ai:true},
            {t:"Написать контент-план на август",s:"todo",ai:false},
            {t:"Реклама Meta Ads для Максима",s:"run",ai:true},
            {t:"Аналитический отчёт Q2",s:"todo",ai:false},
          ].map(({t,s,ai})=>(
            <div key={t} className={`border rounded-lg px-2 py-1.5 ${s==="done"?"border-green-500/20 bg-green-500/5":s==="run"?"border-[#6c63ff]/30 bg-[#6c63ff]/5":"border-[#1a1f3a] bg-[#0d1527]"}`}>
              <div className="flex items-center gap-1.5">
                <span className={`text-[8px] ${s==="done"?"text-green-400":s==="run"?"text-[#6c63ff]":"text-[#374151]"}`}>{s==="done"?"✓":s==="run"?"●":"○"}</span>
                <span className={`text-[8px] flex-1 ${s==="done"?"text-[#64748b] line-through":"text-[#e2e8f0]"}`}>{t}</span>
                {s==="todo" && <div className="text-[6px] bg-[#6c63ff] text-white px-1.5 py-0.5 rounded font-bold">▶ AI</div>}
                {s==="run" && <div className="text-[6px] text-[#6c63ff] animate-pulse">⏳</div>}
              </div>
              {s==="done" && ai && (
                <div className="mt-1 ml-3">
                  <div className="h-1 bg-[#1a1f3a] rounded w-full mb-0.5"/>
                  <div className="h-1 bg-[#1a1f3a] rounded w-3/4"/>
                  <div className="flex gap-1 mt-1">
                    <div className="text-[6px] text-[#6c63ff] bg-[#6c63ff]/10 px-1 py-0.5 rounded">Скачать</div>
                    <div className="text-[6px] text-[#64748b] bg-[#1a1f3a] px-1 py-0.5 rounded">Сохранить</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockupAutopilot() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Автопилот</span>
      </div>
      <div className="p-3 space-y-2">
        {/* Pipeline */}
        <div className="text-[7px] text-[#64748b] uppercase tracking-wider mb-1">Пайплайн агентов</div>
        <div className="flex items-center gap-1">
          {[["🔮","Продюсер","done"],["🧠","Стратег","done"],["✍️","Копир.","run"],["🎯","Таргет","wait"]].map(([em,name,s],i)=>(
            <div key={name} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 rounded-lg p-1.5 text-center border ${s==="done"?"border-green-500/30 bg-green-500/5":s==="run"?"border-[#6c63ff]/40 bg-[#6c63ff]/10":"border-[#1a1f3a] bg-[#0d1527]"}`}>
                <div className="text-xs">{em}</div>
                <div className="text-[6px] text-[#64748b] mt-0.5">{name}</div>
                <div className={`w-1 h-1 rounded-full mx-auto mt-0.5 ${s==="done"?"bg-green-400":s==="run"?"bg-[#6c63ff] animate-pulse":"bg-[#374151]"}`}/>
              </div>
              {i<3 && <div className={`w-2 h-px ${s==="done"?"bg-green-500/50":"bg-[#1a1f3a]"}`}/>}
            </div>
          ))}
        </div>
        {/* AI Chat */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2 space-y-1.5">
          <div className="text-[7px] text-[#64748b] uppercase tracking-wider">AI Ассистент</div>
          <div className="flex gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#374151] flex items-center justify-center text-[8px] shrink-0">👤</div>
            <div className="bg-[#1a1f3a] rounded-lg px-2 py-1 flex-1">
              <div className="text-[8px] text-[#e2e8f0]">Создай стратегию для Алины</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#6c63ff]/30 flex items-center justify-center text-[8px] shrink-0">🤖</div>
            <div className="bg-[#6c63ff]/10 border border-[#6c63ff]/20 rounded-lg px-2 py-1 flex-1">
              <div className="space-y-0.5">
                <div className="h-1 bg-[#6c63ff]/30 rounded w-full"/>
                <div className="h-1 bg-[#6c63ff]/30 rounded w-4/5"/>
                <div className="h-1 bg-[#6c63ff]/30 rounded w-3/5"/>
              </div>
              <div className="flex gap-1 mt-1">
                <div className="text-[6px] bg-[#6c63ff]/20 text-[#6c63ff] px-1 py-0.5 rounded">→ Алине в профиль</div>
                <div className="text-[6px] bg-[#1a1f3a] text-[#64748b] px-1 py-0.5 rounded">.md</div>
              </div>
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="flex gap-1.5 items-center bg-[#0d1527] border border-[#1a1f3a] rounded-lg px-2 py-1.5">
          <div className="flex-1 h-1.5 bg-[#1a1f3a] rounded"/>
          <div className="w-12 h-4 bg-[#6c63ff] rounded text-[6px] text-white flex items-center justify-center">Отправить</div>
        </div>
      </div>
    </div>
  );
}

function MockupContent() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Генератор контента</span>
      </div>
      <div className="p-3 space-y-2">
        {/* Mode */}
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-[#6c63ff] text-white text-[8px] text-center py-1 rounded-lg font-bold">✦ Создать</div>
          <div className="bg-[#0d1527] border border-[#1a1f3a] text-[#64748b] text-[8px] text-center py-1 rounded-lg">↺ Переработать</div>
        </div>
        {/* Platform */}
        <div>
          <div className="text-[6px] text-[#64748b] uppercase tracking-wider mb-1">Платформа</div>
          <div className="flex gap-1 flex-wrap">
            {["Instagram","Telegram","TikTok","YouTube","Email"].map((p,i)=>(
              <div key={p} className={`text-[7px] px-1.5 py-0.5 rounded-full border ${i===0?"border-[#6c63ff]/50 bg-[#6c63ff]/20 text-[#6c63ff]":"border-[#1a1f3a] text-[#64748b]"}`}>{p}</div>
            ))}
          </div>
        </div>
        {/* Format + Tone */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[6px] text-[#64748b] uppercase tracking-wider mb-1">Формат</div>
            <div className="flex gap-1 flex-wrap">
              {["Рилс","Сторис","Пост"].map((t,i)=>(
                <div key={t} className={`text-[7px] px-1.5 py-0.5 rounded-full border ${i===0?"border-[#6c63ff]/50 bg-[#6c63ff]/10 text-[#6c63ff]":"border-[#1a1f3a] text-[#64748b]"}`}>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[6px] text-[#64748b] uppercase tracking-wider mb-1">Цель</div>
            <div className="flex gap-1 flex-wrap">
              {["Прогрев","Продажа"].map((g,i)=>(
                <div key={g} className={`text-[7px] px-1.5 py-0.5 rounded-full border ${i===0?"border-green-500/40 bg-green-500/10 text-green-400":"border-[#1a1f3a] text-[#64748b]"}`}>{g}</div>
              ))}
            </div>
          </div>
        </div>
        {/* Topic input */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg px-2 py-1.5">
          <div className="text-[7px] text-[#374151]">Как я вышла на $10K за 3 месяца...</div>
        </div>
        {/* Generate */}
        <div className="bg-[#6c63ff] text-white text-[8px] text-center py-1.5 rounded-lg font-bold">✦ Сгенерировать</div>
        {/* Preview result */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded-full" style={{background:"conic-gradient(from 240deg,#f09433,#dc2743,#cc2366)"}}/>
            <div><div className="text-[8px] font-bold text-[#e2e8f0]">Instagram</div><div className="text-[6px] text-[#64748b]">@alina.moroz</div></div>
            <div className="ml-auto text-[6px] bg-green-500/20 text-green-400 px-1 rounded">Рилс</div>
          </div>
          <div className="space-y-0.5">
            <div className="h-1 bg-[#1a1f3a] rounded w-full"/>
            <div className="h-1 bg-[#1a1f3a] rounded w-5/6"/>
            <div className="h-1 bg-[#1a1f3a] rounded w-4/5"/>
            <div className="h-1 bg-[#1a1f3a] rounded w-3/5"/>
          </div>
          <div className="flex gap-1 mt-1.5">
            <div className="text-[6px] bg-[#1a1f3a] text-[#64748b] px-1.5 py-0.5 rounded">Копировать</div>
            <div className="text-[6px] bg-[#1a1f3a] text-[#64748b] px-1.5 py-0.5 rounded">.txt</div>
            <div className="text-[6px] bg-[#1a1f3a] text-[#64748b] px-1.5 py-0.5 rounded">📅 В план</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupHub() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Хаб</span>
      </div>
      <div className="flex h-[200px]">
        {/* Sidebar */}
        <div className="w-12 bg-[#0d1527] border-r border-[#1a1f3a] p-1.5 space-y-1">
          {[["🏠","ДОМ","1"],["🧠","СТРАТЕГ","0"],["🌀","ВОРОНКА","0"],["✍️","ТЕКСТ","0"],["🎬","РЕКЛАМА","0"],["🤖","БОТ","0"]].map(([em,l,a])=>(
            <div key={l} className={`rounded-lg p-1 text-center ${a==="1"?"bg-[#6c63ff]/20":""}`}>
              <div className="text-[10px]">{em}</div>
              <div className={`text-[5px] ${a==="1"?"text-[#6c63ff]":"text-[#374151]"}`}>{l}</div>
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
          <div className="text-[8px] font-bold text-[#e2e8f0]">Добро пожаловать, Зарина 👋</div>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-[#6c63ff]/10 border border-[#6c63ff]/20 rounded-lg p-1.5">
              <div className="text-[7px] text-[#6c63ff] font-bold mb-0.5">🧠 Стратегия</div>
              <div className="space-y-0.5"><div className="h-1 bg-[#6c63ff]/20 rounded"/><div className="h-1 bg-[#6c63ff]/20 rounded w-3/4"/></div>
            </div>
            <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/20 rounded-lg p-1.5">
              <div className="text-[7px] text-[#a78bfa] font-bold mb-0.5">🌀 Воронка</div>
              <div className="flex items-end gap-0.5 h-4">
                {[100,70,45,25,12].map((h,i)=>(
                  <div key={i} className="flex-1 rounded-t-sm" style={{height:`${h}%`,background:"#a78bfa33"}}/>
                ))}
              </div>
            </div>
          </div>
          {/* Onboarding progress */}
          <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-1.5">
            <div className="flex justify-between text-[7px] text-[#64748b] mb-1"><span>Профиль заполнен</span><span>12/15</span></div>
            <div className="h-1 bg-[#1a1f3a] rounded"><div className="h-full bg-[#6c63ff] rounded" style={{width:"80%"}}/></div>
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-1">
            {[["📝","8","Заметок"],["🎯","3","Цели"],["📅","12","Контент"]].map(([em,v,l])=>(
              <div key={l} className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-1 text-center">
                <div className="text-[8px]">{em}</div>
                <div className="text-[9px] font-bold text-[#e2e8f0]">{v}</div>
                <div className="text-[6px] text-[#64748b]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupStudio() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1a1f3a] bg-[#080d1e] select-none">
      <div className="bg-[#0d1527] px-3 py-2 flex items-center gap-2 border-b border-[#1a1f3a]">
        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-red-500/50"/><div className="w-2 h-2 rounded-full bg-yellow-500/50"/><div className="w-2 h-2 rounded-full bg-green-500/50"/></div>
        <span className="text-[9px] text-[#64748b] ml-1">ContentOS · Студия</span>
      </div>
      <div className="p-3 space-y-2">
        {/* Format cards */}
        <div className="grid grid-cols-3 gap-1.5">
          {[["🎬","Рилс","Скрипт + таймкоды","1"],["📸","Сторис","Серия 5-7 слайдов","0"],["🎙️","Подкаст","Сценарий эпизода","0"]].map(([em,t,s,a])=>(
            <div key={t} className={`border rounded-xl p-2 text-center ${a==="1"?"border-[#a78bfa]/40 bg-[#a78bfa]/10":"border-[#1a1f3a] bg-[#0d1527]"}`}>
              <div className="text-lg">{em}</div>
              <div className={`text-[8px] font-bold ${a==="1"?"text-[#a78bfa]":"text-[#e2e8f0]"}`}>{t}</div>
              <div className="text-[6px] text-[#64748b] mt-0.5">{s}</div>
            </div>
          ))}
        </div>
        {/* Script preview */}
        <div className="bg-[#0d1527] border border-[#a78bfa]/20 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="text-[7px] text-[#a78bfa] font-bold uppercase tracking-wider">Сценарий Reels</div>
            <div className="ml-auto text-[6px] bg-green-500/20 text-green-400 px-1.5 rounded">✓ Готово</div>
          </div>
          <div className="space-y-1">
            <div className="flex gap-1.5 items-start">
              <div className="text-[6px] bg-amber-500/20 text-amber-400 px-1 rounded shrink-0 mt-0.5">ХУК</div>
              <div className="space-y-0.5 flex-1"><div className="h-1 bg-[#1a1f3a] rounded"/><div className="h-1 bg-[#1a1f3a] rounded w-4/5"/></div>
            </div>
            <div className="flex gap-1.5 items-start">
              <div className="text-[6px] bg-blue-500/20 text-blue-400 px-1 rounded shrink-0 mt-0.5">0:05</div>
              <div className="space-y-0.5 flex-1"><div className="h-1 bg-[#1a1f3a] rounded"/><div className="h-1 bg-[#1a1f3a] rounded w-3/5"/></div>
            </div>
            <div className="flex gap-1.5 items-start">
              <div className="text-[6px] bg-blue-500/20 text-blue-400 px-1 rounded shrink-0 mt-0.5">0:15</div>
              <div className="space-y-0.5 flex-1"><div className="h-1 bg-[#1a1f3a] rounded"/></div>
            </div>
            <div className="flex gap-1.5 items-start">
              <div className="text-[6px] bg-[#6c63ff]/30 text-[#6c63ff] px-1 rounded shrink-0 mt-0.5">CTA</div>
              <div className="space-y-0.5 flex-1"><div className="h-1 bg-[#1a1f3a] rounded"/><div className="h-1 bg-[#1a1f3a] rounded w-2/3"/></div>
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <div className="text-[6px] bg-[#a78bfa]/20 text-[#a78bfa] px-1.5 py-0.5 rounded">Копировать</div>
            <div className="text-[6px] bg-[#1a1f3a] text-[#64748b] px-1.5 py-0.5 rounded">Скачать .txt</div>
            <div className="text-[6px] bg-[#1a1f3a] text-[#64748b] px-1.5 py-0.5 rounded">↺ Ещё</div>
          </div>
        </div>
        {/* Ads row */}
        <div className="bg-[#0d1527] border border-[#1a1f3a] rounded-lg p-2">
          <div className="text-[7px] text-[#64748b] mb-1">Рекламные форматы</div>
          <div className="flex gap-1">
            {[["🖼️","Баннер"],["🎬","Видео"],["🎙️","Озвучка"]].map(([em,l])=>(
              <div key={l} className="flex-1 bg-[#1a1f3a] rounded-lg p-1 text-center">
                <div className="text-[9px]">{em}</div>
                <div className="text-[6px] text-[#64748b]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Map module label → preview component
const PREVIEWS: Record<string, () => JSX.Element> = {
  "Дашборд":   MockupDashboard,
  "AI Команда": MockupAITeam,
  "CRM":       MockupCRM,
  "Клиенты":   MockupClients,
  "Финансы":   MockupFinance,
  "Кабинет":   MockupWorkspace,
  "Автопилот": MockupAutopilot,
  "Контент":   MockupContent,
  "Хаб":       MockupHub,
  "Студия":    MockupStudio,
};

// ── Module detailed data ──────────────────────────────────────────────────────
const MODULE_DETAILS = [
  {
    icon: LayoutDashboard,
    label: "Дашборд",
    desc: "Центр управления агентством",
    color: "#6c63ff",
    emoji: "🏠",
    fullDesc: "Все KPI в одном экране — доходы, расходы, прибыль, активные клиенты и статус проектов. Вы всегда знаете, что происходит в агентстве.",
    problems: [
      "Не понимаю, сколько зарабатывает агентство",
      "Данные разбросаны по таблицам и мессенджерам",
      "Нет единой картины по всем клиентам",
      "Трачу час каждое утро на сбор отчётов",
    ],
    example: "Открываете приложение утром — видите: 5 активных клиентов, доход $12,400 за месяц, 3 срочных задачи и предупреждение о просроченном клиенте.",
    features: ["Финансовые KPI в реальном времени", "Статус всех клиентов", "Очередь задач", "Алерты и уведомления"],
  },
  {
    icon: BrainCircuit,
    label: "AI Команда",
    desc: "10 AI-сотрудников 24/7",
    color: "#a78bfa",
    emoji: "🤖",
    fullDesc: "Виртуальная команда из 10 AI-специалистов: продюсер, стратег, копирайтер, таргетолог, SMM, аналитик, сейлз и другие. Каждый делает свою работу автоматически.",
    problems: [
      "Дорого нанимать полноценную команду",
      "Не успеваю делать контент + продажи + аналитику",
      "Каждая задача требует моего участия",
      "Сотрудники делают ошибки или уходят",
    ],
    example: "Добавляете нового клиента → AI-стратег автоматически пишет стратегию, копирайтер создаёт контент-план, таргетолог готовит рекламные тексты — всё за 2 минуты.",
    features: ["Продюсер, стратег, копирайтер", "Таргетолог, SMM, аналитик", "Автосохранение результатов в профиль", "База знаний для каждого агента"],
  },
  {
    icon: Kanban,
    label: "CRM",
    desc: "Лиды и сделки",
    color: "#f59e0b",
    emoji: "🎯",
    fullDesc: "Канбан-доска для управления лидами: от первого контакта до закрытой сделки. Видите воронку продаж и знаете, на каком этапе каждый потенциальный клиент.",
    problems: [
      "Лиды теряются в переписках и мессенджерах",
      "Не помню, на каком этапе каждый клиент",
      "Нет системы follow-up",
      "Не понимаю, почему не закрываются сделки",
    ],
    example: "Добавляете лида из Instagram → перетаскиваете по этапам: первый контакт → КП → переговоры → закрыто → система напоминает о следующем шаге.",
    features: ["Канбан-воронка drag & drop", "Карточки лидов с историей", "Статусы и теги", "Конверсия по этапам"],
  },
  {
    icon: Users,
    label: "Клиенты",
    desc: "Профили и онбординг",
    color: "#22c55e",
    emoji: "👥",
    fullDesc: "Полные профили клиентов с историей, задачами, контент-планом, аналитикой и AI-рекомендациями. AI анализирует каждого клиента и предлагает следующие шаги.",
    problems: [
      "Информация о клиенте в разных местах",
      "Нет системного онбординга новых клиентов",
      "Забываю, что было договорено",
      "Не знаю, на каком этапе клиент в его развитии",
    ],
    example: "Клиент Алина Мороз: доход $8K → цель $25K. AI автоматически создаёт стратегию, контент-план и чеклист задач. Вы видите прогресс и следующие шаги.",
    features: ["AI-анализ клиента", "Чеклист задач с автовыполнением", "Генератор контента под клиента", "История всех AI-генераций"],
  },
  {
    icon: DollarSign,
    label: "Финансы",
    desc: "Учёт и отчёты",
    color: "#10b981",
    emoji: "💰",
    fullDesc: "Учёт доходов и расходов, прибыль по клиентам, финансовые отчёты. Знаете, сколько зарабатываете реально и куда уходят деньги.",
    problems: [
      "Не знаю реальную прибыль агентства",
      "Нет учёта расходов на инструменты",
      "Трачу 3 часа в конце месяца на сведение",
      "Не вижу, какие клиенты прибыльные",
    ],
    example: "Получаете оплату от клиента → добавляете транзакцию за 10 секунд → дашборд обновляет P&L, показывает налоговую базу и прибыль по месяцам.",
    features: ["Доходы и расходы", "Прибыль по клиентам", "Финансовый отчёт", "История транзакций"],
  },
  {
    icon: LayoutGrid,
    label: "Кабинет",
    desc: "Задачи и проекты",
    color: "#3b82f6",
    emoji: "📋",
    fullDesc: "Рабочее пространство с задачами, проектами и тайм-трекером. AI автоматически выполняет задачи — достаточно нажать кнопку Старт.",
    problems: [
      "Задачи записаны в Notion, Telegram и блокноте",
      "Не понимаю, что делать первым",
      "Рутинные задачи занимают весь день",
      "Нет системы приоритетов",
    ],
    example: "Задача 'Написать стратегию для клиента' → нажимаете Старт → AI автоматически пишет стратегию за 30 секунд → результат сохраняется в профиль клиента.",
    features: ["Задачи с приоритетами", "AI-автовыполнение по кнопке", "Статусы и дедлайны", "Сохранение результатов в БД"],
  },
  {
    icon: Bot,
    label: "Автопилот",
    desc: "Автоматизация агентства",
    color: "#6c63ff",
    emoji: "⚡",
    fullDesc: "Полный автопилот для агентства: AI-ассистент с доступом ко всем данным системы, пайплайн из 4 агентов, маршрутизация результатов куда нужно.",
    problems: [
      "Трачу весь день на операционку",
      "Не могу масштабироваться без новых людей",
      "Результаты AI нужно вручную копировать",
      "Нет единого AI-ассистента по всем данным",
    ],
    example: "Говорите AI-ассистенту: 'Создай стратегию для Алины и сохрани в её профиль' → ассистент находит клиента, генерирует и сохраняет автоматически.",
    features: ["AI-ассистент по всей системе", "Пайплайн из 4 агентов", "Маршрутизация в нужное место", "Скачивание в .txt, .md, .html"],
  },
  {
    icon: Video,
    label: "Контент",
    desc: "Видео и нарезки",
    color: "#f43f5e",
    emoji: "🎬",
    fullDesc: "Контент-студия: генерация текстов для всех платформ, сценарии, нарезки видео. Всё что нужно для регулярного присутствия в соцсетях.",
    problems: [
      "Не знаю, о чём писать каждый день",
      "Контент занимает 4+ часов в неделю",
      "Тексты получаются безличными и скучными",
      "Нет системного контент-плана",
    ],
    example: "Выбираете Instagram, формат Рилс, тему 'Как я вышел на $10K' → за 20 секунд готов профессиональный сценарий с хуком, развитием и CTA.",
    features: ["Instagram, TikTok, YouTube, Telegram", "Рилс, сторис, посты, письма", "Перезапись под ваш стиль", "Контент-план с календарём"],
  },
  {
    icon: Globe,
    label: "Хаб",
    desc: "Личный AI-центр",
    color: "#0ea5e9",
    emoji: "🌐",
    fullDesc: "Персональный AI-центр для эксперта или фрилансера: стратегия, воронки, контент, реклама, лендинги — всё с учётом ваших данных.",
    problems: [
      "Нет системной стратегии роста",
      "Трачу деньги на рекламу без понимания воронки",
      "Не знаю, как монетизировать экспертизу",
      "Разные инструменты не связаны между собой",
    ],
    example: "Проходите 15-минутный онбординг → AI строит полную стратегию роста, воронку, контент-план на неделю, рекламные тексты и бот-цепочки под вас.",
    features: ["Онбординг-опросник (15 вопросов)", "Стратегия и воронки", "Генератор всех форматов контента", "Лендинг-генератор"],
  },
  {
    icon: Clapperboard,
    label: "Студия",
    desc: "Контент и сценарии",
    color: "#a78bfa",
    emoji: "🎞️",
    fullDesc: "Профессиональная контент-студия: сценарии Reels, сторис-серии, рекламные видео, визуальные концепции и советы по монтажу.",
    problems: [
      "Видео выходят редко и без системы",
      "Не знаю, как составить сценарий",
      "Дорого заказывать у копирайтера",
      "Нет времени придумывать идеи",
    ],
    example: "Вводите тему и нишу → AI пишет сценарий Reels с хуком, 3 основными блоками, призывом к действию и таймкодами для монтажёра.",
    features: ["Сценарии Reels и TikTok", "Бот-цепочки (прогрев, продажа)", "Визуальные концепции", "Рекламные тексты Meta Ads"],
  },
];

// ── Pain points ──────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  { icon: "😩", pain: "Операционка съедает 8 часов в день", solution: "AI-команда делает всё автоматически — вы только контролируете" },
  { icon: "💸", pain: "Команда стоит $3000+ в месяц", solution: "10 AI-сотрудников за $29/мес — стратег, копирайтер, таргетолог" },
  { icon: "📊", pain: "Данные везде — Notion, Sheets, Telegram", solution: "Единая база: клиенты, финансы, задачи, контент — в одном месте" },
  { icon: "🔄", pain: "Каждый клиент требует индивидуального подхода", solution: "AI анализирует каждого клиента и создаёт персональные стратегии" },
  { icon: "⏰", pain: "Нет времени на масштабирование", solution: "Автопилот берёт рутину — у вас остаётся время на рост" },
  { icon: "📉", pain: "Не знаю, прибыльно ли агентство", solution: "Финансовый дашборд показывает P&L в реальном времени" },
];

const FOR_WHO = [
  { icon: "🎯", title: "Контент-продюсеры", desc: "Ведёте 3–15 клиентов, устали от операционки. ContentOS — ваш второй мозг и команда." },
  { icon: "💡", title: "Эксперты и коучи", desc: "Продаёте знания, но нет системы. Хаб строит воронку, контент и стратегию под вас." },
  { icon: "📱", title: "SMM-фрилансеры", desc: "Делаете контент для клиентов. AI берёт рутину: посты, сторис, планы, отчёты." },
  { icon: "🚀", title: "Онлайн-агентства", desc: "Масштабируетесь без найма. 10 AI-сотрудников работают 24/7 без выходных." },
];

// ── Module Modal ──────────────────────────────────────────────────────────────
function ModuleModal({ mod, onClose }: { mod: typeof MODULE_DETAILS[0]; onClose: () => void }) {
  const Icon = mod.icon;
  const Preview = PREVIEWS[mod.label];
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d1527] border border-[#1a1f3a] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl overflow-y-auto"
        style={{ maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#1a1f3a]"/>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748b] hover:text-[#e2e8f0] transition-colors p-1.5 rounded-lg hover:bg-white/5 z-10"
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5 pr-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ backgroundColor: `${mod.color}20`, border: `1px solid ${mod.color}40` }}
            >
              <Icon size={22} style={{ color: mod.color }} />
            </div>
            <div>
              <div className="text-xl font-bold text-[#e2e8f0]">{mod.emoji} {mod.label}</div>
              <div className="text-sm text-[#64748b]">{mod.desc}</div>
            </div>
          </div>

          {/* ── VISUAL PREVIEW (new) ─────────────────────────────────────── */}
          {Preview && (
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-2.5">
                Как выглядит в приложении
              </div>
              <div className="rounded-2xl overflow-hidden p-3" style={{ background: `${mod.color}08`, border: `1px solid ${mod.color}20` }}>
                {/* Fake browser chrome */}
                <div className="rounded-t-xl bg-[#060b18] border border-b-0 border-[#1a1f3a] px-3 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"/>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"/>
                  </div>
                  <div className="flex-1 bg-[#0d1527] rounded-md h-4 mx-2 flex items-center px-2">
                    <span className="text-[8px] text-[#374151]">app.contentos.ai / {mod.label.toLowerCase()}</span>
                  </div>
                </div>
                <div className="rounded-b-xl border border-t-0 border-[#1a1f3a] overflow-hidden">
                  <Preview />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-[#94a3b8] leading-relaxed mb-5">{mod.fullDesc}</p>

          {/* How to use steps */}
          <div className="mb-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Как с этим работать</div>
            <div className="grid grid-cols-2 gap-2">
              {mod.features.map((f, i) => (
                <div key={f} className="flex items-start gap-2 bg-[#080d1e] border border-[#1a1f3a] rounded-xl p-2.5">
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: mod.color }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[11px] text-[#94a3b8] leading-tight">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Problems */}
          <div className="mb-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-3">Какие проблемы решает</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {mod.problems.map((p) => (
                <div key={p} className="flex items-start gap-2 text-[11px] text-[#94a3b8]">
                  <span className="text-red-400 mt-0.5 shrink-0 text-xs">✕</span>
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Example */}
          <div
            className="rounded-xl p-4 mb-5 text-sm text-[#94a3b8] leading-relaxed"
            style={{ background: `${mod.color}08`, border: `1px solid ${mod.color}20` }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: mod.color }}>
              💡 Пример реального использования
            </div>
            {mod.example}
          </div>

          {/* CTA */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg text-white"
            style={{ backgroundColor: mod.color }}
            onClick={onClose}
          >
            <Play size={14} />
            Попробовать бесплатно — без карты
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [selectedModule, setSelectedModule] = useState<typeof MODULE_DETAILS[0] | null>(null);

  const HUB_FEATURES = [
    "AI-дашборд с аналитикой и KPI",
    "CRM для ведения клиентов и лидов",
    "Финансовый учёт и отчёты",
    "AI-команда: 10 специалистов 24/7",
    "Планировщик задач с AI-автовыполнением",
    "Автопилот — полная автоматизация",
    "Стратег, копирайтер, таргетолог, аналитик",
    "Генератор контента для всех платформ",
  ];

  const STUDIO_FEATURES = [
    "AI-генерация постов, Reels, Stories",
    "Воронки и контент-стратегии",
    "Еженедельный контент-план",
    "Адаптация под все соцсети",
    "Рекламные тексты для Meta Ads",
    "Бот-цепочки в SendPulse",
    "Визуальные концепции для фото",
    "Лендинг-генератор за 3 шага",
  ];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0d1126] text-[#e2e8f0]">

      {/* Module modal */}
      {selectedModule && (
        <ModuleModal mod={selectedModule} onClose={() => setSelectedModule(null)} />
      )}

      {/* ── NAVBAR ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1f3a] bg-[#080d1e]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between" style={{ height: 60 }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#6c63ff] flex items-center justify-center shadow-lg shadow-[#6c63ff]/40">
              <Zap size={15} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-[#e2e8f0] text-sm block">ContentOS</span>
              <span className="text-[10px] text-[#64748b]">Producer Center</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:flex items-center gap-1.5 text-xs text-[#64748b] hover:text-amber-400 px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-colors">
              <Play size={13} />
              Попробовать бесплатно
            </Link>
            <Link href="/login" className="text-sm text-[#64748b] hover:text-[#e2e8f0] transition-colors px-3 py-2 rounded-lg hover:bg-white/5">
              Войти
            </Link>
            <Link href="/register" className="text-sm bg-[#6c63ff] hover:bg-[#5b53ee] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-[#6c63ff]/20">
              Начать
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#6c63ff]/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-[#a78bfa]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#6c63ff]/10 border border-[#6c63ff]/25 rounded-full px-4 py-1.5 mb-7">
              <Star size={11} className="text-[#6c63ff]" fill="currentColor" />
              <span className="text-xs text-[#6c63ff] font-semibold tracking-wide uppercase">AI-платформа для продюсеров и экспертов</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold leading-[1.1] mb-6 tracking-tight">
              Агентство и бизнес<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c63ff] via-[#8b7cf6] to-[#a78bfa]">
                на автопилоте
              </span>
            </h1>

            <p className="text-lg text-[#64748b] max-w-2xl mx-auto leading-relaxed mb-4">
              ContentOS берёт на себя 90% операционки: находит клиентов, создаёт контент, ведёт CRM, отправляет рассылки и считает деньги. Вы — только принимаете решения.
            </p>

            {/* Social proof bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#64748b] mb-10">
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> 10 AI-специалистов 24/7</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> CRM + контент + финансы в одном месте</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Без технических знаний</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-400" /> Бесплатное демо — без карты</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link
                href="/register?plan=hub_monthly"
                className="flex items-center gap-2 bg-[#6c63ff] hover:bg-[#5b53ee] text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-xl shadow-[#6c63ff]/30 group w-full sm:w-auto justify-center"
              >
                <Globe size={16} />
                Начать бесплатно
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/register?plan=studio_monthly"
                className="flex items-center gap-2 border border-[#1a1f3a] hover:border-[#a78bfa]/40 text-[#e2e8f0] hover:text-[#a78bfa] px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-[#a78bfa]/5 w-full sm:w-auto justify-center"
              >
                <Clapperboard size={16} />
                Студия — $15/мес
              </Link>
            </div>

            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-[#64748b]">Хотите сначала посмотреть?</span>
              <Link href="/login" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors">
                <Play size={13} />
                Попробовать бесплатно
              </Link>
            </div>
          </div>

          {/* App screens grid — clickable with hints */}
          <div>
            <p className="text-center text-xs text-[#64748b] mb-3 opacity-70">
              👇 Нажмите на любой модуль — посмотрите как он выглядит
            </p>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {MODULE_DETAILS.map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.label}
                    onClick={() => setSelectedModule(mod)}
                    className="group relative bg-[#0d1527] border border-[#1a1f3a] rounded-xl p-2.5 flex flex-col items-center gap-1.5 hover:border-[#6c63ff]/40 hover:bg-[#6c63ff]/5 transition-all cursor-pointer"
                    title={`${mod.label} — ${mod.desc}`}
                  >
                    <Icon size={16} className="text-[#64748b] group-hover:text-[#6c63ff] transition-colors" />
                    <span className="text-[9px] text-[#64748b] text-center leading-tight">{mod.label}</span>
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#6c63ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[10px] text-[#374151] mt-2">10 модулей · всё включено</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-[#1a1f3a] bg-[#080d1e]/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e2e8f0] mb-3">Как это работает</h2>
            <p className="text-[#64748b]">Начните за 5 минут — без настроек и технических знаний</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#6c63ff]/30 via-[#6c63ff] to-[#6c63ff]/30" />
            {[
              {
                step: "01",
                color: "#6c63ff",
                icon: "🚀",
                title: "Регистрируетесь бесплатно",
                desc: "Только имя и email. Без карты и паролей. За 30 секунд вы внутри приложения с демо-данными.",
                detail: "Посмотрите как выглядят все 10 модулей с реальным контентом.",
              },
              {
                step: "02",
                color: "#a78bfa",
                icon: "⚙️",
                title: "Заполняете профиль",
                desc: "Расскажите что продаёте и кто ваша аудитория. AI настраивает систему под вас.",
                detail: "Добавьте продукты, подключите Telegram или email — и готово.",
              },
              {
                step: "03",
                color: "#22c55e",
                icon: "💰",
                title: "Система работает сама",
                desc: "AI ищет клиентов, пишет контент, отправляет рассылки и следит за деньгами.",
                detail: "Вы получаете уведомления о новых лидах, продажах и задачах.",
              },
            ].map(({ step, color, icon, title, desc, detail }) => (
              <div key={step} className="relative bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-6 flex flex-col gap-3" style={{ borderColor: `${color}20` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${color}15` }}>{icon}</div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>{step}</div>
                </div>
                <h3 className="font-bold text-[#e2e8f0] text-base">{title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
                <p className="text-[11px] text-[#374151] italic">{detail}</p>
              </div>
            ))}
          </div>

          {/* Use-case pills */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#64748b] mb-4">ContentOS подходит для:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Контент-продюсер с 3–15 клиентами",
                "Эксперт или коуч без команды",
                "SMM-фрилансер с нагрузкой",
                "Онлайн-школа или агентство",
                "Маркетолог на личном бренде",
                "Эксперт, который хочет масштабироваться",
              ].map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 rounded-full border border-[#1a1f3a] bg-[#0d1527] text-[#64748b] hover:border-[#6c63ff]/30 hover:text-[#a78bfa] transition-colors cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-[#1a1f3a] bg-[#080d1e]/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e2e8f0] mb-3">Знакомо?</h2>
            <p className="text-[#64748b]">ContentOS решает боли, с которыми сталкивается каждый продюсер</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PAIN_POINTS.map(({ icon, pain, solution }) => (
              <div key={pain} className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-5 hover:border-red-500/20 transition-colors">
                <div className="text-2xl mb-3">{icon}</div>
                <div className="text-sm font-semibold text-red-400/70 mb-2 line-through">{pain}</div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHO ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-[#1a1f3a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e2e8f0] mb-3">Для кого ContentOS</h2>
            <p className="text-[#64748b]">Платформа создана для тех, кто работает с контентом и клиентами</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FOR_WHO.map(({ icon, title, desc }) => (
              <div key={title} className="bg-[#0d1527] border border-[#1a1f3a] hover:border-[#6c63ff]/30 rounded-2xl p-5 transition-all">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-[#e2e8f0] mb-2">{title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULE SHOWCASE ──────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-[#1a1f3a] bg-[#080d1e]/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e2e8f0] mb-3">10 модулей — один инструмент</h2>
            <p className="text-[#64748b]">Нажмите на модуль — увидите как он выглядит и как работает</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULE_DETAILS.map((mod) => {
              const Icon = mod.icon;
              const Preview = PREVIEWS[mod.label];
              return (
                <button
                  key={mod.label}
                  onClick={() => setSelectedModule(mod)}
                  className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-5 text-left transition-all group cursor-pointer overflow-hidden"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${mod.color}50`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1a1f3a"; }}
                >
                  {/* Mini preview thumbnail */}
                  {Preview && (
                    <div className="mb-4 rounded-xl overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity scale-[0.85] origin-top-left" style={{height:120,overflow:"hidden",borderRadius:12,border:`1px solid ${mod.color}20`}}>
                      <div style={{transform:"scale(0.55)",transformOrigin:"top left",width:"182%",height:"182%",pointerEvents:"none"}}>
                        <Preview />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${mod.color}15` }}
                    >
                      <Icon size={15} style={{ color: mod.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-[#e2e8f0] text-sm">{mod.emoji} {mod.label}</div>
                      <div className="text-[10px] text-[#64748b]">{mod.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium mt-2" style={{ color: mod.color }}>
                    Смотреть демо <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── THREE PATHS / PRICING ────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-[#1a1f3a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#e2e8f0] mb-3">Выберите свой тариф</h2>
            <p className="text-[#64748b]">Демо бесплатно — платить только если понравится</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ─ FREE DEMO ─ */}
            <div className="relative bg-gradient-to-b from-amber-500/10 to-amber-500/5 border border-amber-500/25 rounded-2xl p-6 flex flex-col">
              <div className="absolute -top-3 left-6">
                <span className="bg-amber-500 text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Бесплатно</span>
              </div>
              <div className="mt-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4">
                  <Play size={20} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-[#e2e8f0] mb-1">Бесплатный доступ</h3>
                <p className="text-2xl font-bold text-amber-400">$0<span className="text-sm font-normal text-[#64748b]"> навсегда</span></p>
                <p className="text-sm text-[#64748b] leading-relaxed mt-2">Все 10 модулей. Только имя и email. Без карты.</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {["Все 10 модулей приложения","Демо-данные для изучения","Без карты и пароля","Аккаунт сохраняется"].map(f=>(
                  <li key={f} className="flex items-start gap-2 text-xs text-[#64748b]">
                    <CheckCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-sm transition-all">
                <Play size={15} />Начать бесплатно
              </Link>
            </div>

            {/* ─ HUB ─ */}
            <div className="relative bg-gradient-to-b from-[#6c63ff]/10 to-[#6c63ff]/5 border border-[#6c63ff]/30 rounded-2xl p-6 flex flex-col">
              <div className="absolute -top-3 left-6">
                <span className="bg-[#6c63ff] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Хаб · Популярный</span>
              </div>
              <div className="mt-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-[#6c63ff]/15 flex items-center justify-center mb-4">
                  <Globe size={20} className="text-[#6c63ff]" />
                </div>
                <h3 className="text-lg font-bold text-[#e2e8f0] mb-1">ContentOS Хаб</h3>
                <p className="text-2xl font-bold text-[#e2e8f0]">$29<span className="text-sm font-normal text-[#64748b]"> / мес</span></p>
                <p className="text-xs text-[#64748b] mt-1">или $249 / год (экономия −28%)</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {HUB_FEATURES.map(f=>(
                  <li key={f} className="flex items-start gap-2 text-xs text-[#64748b]">
                    <CheckCircle size={13} className="text-[#6c63ff] shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=hub_monthly" className="w-full flex items-center justify-center gap-2 bg-[#6c63ff] hover:bg-[#5b53ee] text-white font-bold py-3 rounded-xl text-sm transition-all group">
                Выбрать Хаб <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* ─ STUDIO ─ */}
            <div className="relative bg-gradient-to-b from-[#a78bfa]/10 to-[#a78bfa]/5 border border-[#a78bfa]/25 rounded-2xl p-6 flex flex-col">
              <div className="absolute -top-3 left-6">
                <span className="bg-[#a78bfa] text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Студия</span>
              </div>
              <div className="mt-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center mb-4">
                  <Clapperboard size={20} className="text-[#a78bfa]" />
                </div>
                <h3 className="text-lg font-bold text-[#e2e8f0] mb-1">ContentOS Студия</h3>
                <p className="text-2xl font-bold text-[#e2e8f0]">$15<span className="text-sm font-normal text-[#64748b]"> / мес</span></p>
                <p className="text-xs text-[#64748b] mt-1">или $129 / год (экономия −28%)</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {STUDIO_FEATURES.map(f=>(
                  <li key={f} className="flex items-start gap-2 text-xs text-[#64748b]">
                    <CheckCircle size={13} className="text-[#a78bfa] shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=studio_monthly" className="w-full flex items-center justify-center gap-2 bg-[#a78bfa] hover:bg-[#9470f0] text-black font-bold py-3 rounded-xl text-sm transition-all group">
                Выбрать Студию <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-[#1a1f3a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#e2e8f0] mb-3">Как это работает</h2>
          <p className="text-[#64748b] mb-12">Три шага от регистрации до работающего агентства</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step:"01", icon:"🔑", title:"Регистрируетесь", desc:"Выбираете тариф, вводите имя и email — без карты. Доступ открывается мгновенно. Демо бесплатно.", color:"#6c63ff" },
              { step:"02", icon:"👤", title:"Добавляете клиента", desc:"AI-команда автоматически запускается: стратегия, контент-план, рекламные тексты — без вашего участия за 2 минуты.", color:"#a78bfa" },
              { step:"03", icon:"📊", title:"Наблюдаете", desc:"Вы смотрите на дашборд. Продюсер, стратег, копирайтер, таргетолог — работают 24/7 автономно.", color:"#f59e0b" },
            ].map(({step,icon,title,desc,color})=>(
              <div key={step} className="bg-[#0d1527] border border-[#1a1f3a] rounded-2xl p-6 text-left relative overflow-hidden">
                <span className="absolute top-4 right-5 text-5xl font-black opacity-5 text-[#6c63ff] select-none">{step}</span>
                <div className="text-2xl mb-3">{icon}</div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mb-4 text-white" style={{backgroundColor:color}}>{step}</div>
                <h3 className="font-bold text-[#e2e8f0] mb-2">{title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 border-t border-[#1a1f3a] bg-[#080d1e]/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value:"10", label:"модулей в системе",  color:"text-[#6c63ff]" },
              { value:"10", label:"AI-сотрудников",     color:"text-[#a78bfa]" },
              { value:"24/7", label:"работает автономно", color:"text-amber-400" },
              { value:"0",  label:"ручных задач",       color:"text-emerald-400" },
            ].map(({value,label,color})=>(
              <div key={label}>
                <div className={`text-4xl font-black mb-1 ${color}`}>{value}</div>
                <div className="text-xs text-[#64748b]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 border-t border-[#1a1f3a]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#6c63ff] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#6c63ff]/40">
            <Zap size={26} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold text-[#e2e8f0] mb-4">
            Готовы запустить<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c63ff] to-[#a78bfa]">
              автономное агентство?
            </span>
          </h2>
          <p className="text-[#64748b] mb-10 text-lg max-w-xl mx-auto">
            Начните с бесплатного демо — посмотрите как всё работает изнутри. Регистрация занимает 1 минуту. Карта не нужна.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/login" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-amber-500/25 w-full sm:w-auto justify-center">
              <Play size={15} />Попробовать бесплатно
            </Link>
            <Link href="/register" className="flex items-center gap-2 bg-[#6c63ff] hover:bg-[#5b53ee] text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-[#6c63ff]/25 w-full sm:w-auto justify-center group">
              Зарегистрироваться <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-xs text-[#64748b]">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#6c63ff] hover:underline">Войти →</Link>
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1a1f3a] py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#6c63ff] flex items-center justify-center">
              <Zap size={11} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[#64748b]">ContentOS</span>
            <span className="text-xs text-[#1a1f3a] mx-1">·</span>
            <span className="text-xs text-[#64748b]">by AMAImedia</span>
          </div>
          <p className="text-xs text-[#64748b] order-last sm:order-none">© 2026 AMAImedia. Все права защищены.</p>
          <div className="flex items-center gap-5">
            <Link href="/login"    className="text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors">Войти</Link>
            <Link href="/register" className="text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors">Регистрация</Link>
            <Link href="/pricing"  className="text-xs text-[#64748b] hover:text-[#e2e8f0] transition-colors">Тарифы</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
