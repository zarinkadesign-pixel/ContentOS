/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. app/admin/plan90/page.tsx
 */

"use client";

import { useState, useEffect } from "react";
import AdminLayout from "../_components/AdminLayout";

interface Task {
  id: number;
  apiId?: string;
  phase: 1 | 2 | 3;
  date: string;
  title: string;
  instruction: string;
  done: boolean;
  badge: string;
}

const INITIAL_TASKS: Task[] = [
  // Phase 1
  { id: 1,  phase: 1, date: "05.04", title: "Запустить рекламу в Meta Ads",       instruction: "Создать кампанию с бюджетом $5/день. Гео: Казахстан, Алматы+Астана. Возраст 25-45.",                                      done: false, badge: "Реклама"      },
  { id: 2,  phase: 1, date: "06.04", title: "Настроить бота SendPulse",            instruction: "Создать приветственное сообщение и воронку для лидов с рекламы.",                                                            done: false, badge: "Ключевое"     },
  { id: 3,  phase: 1, date: "07.04", title: "Снять 5 Reels для контента",          instruction: "Темы: ошибки экспертов, мой путь, кейс клиента, советы по Instagram, результаты клиентов.",                                  done: false, badge: "Ключевое"     },
  { id: 4,  phase: 1, date: "08.04", title: "Опубликовать страницу с отзывами",    instruction: "Собрать 5+ отзывов клиентов, оформить в Notion или Google Sites.",                                                            done: false, badge: "Делегировать" },
  { id: 5,  phase: 1, date: "10.04", title: "Провести 5 созвонов с лидами",        instruction: "Использовать скрипт созвона. Цель: 1-2 продажи наставничества.",                                                              done: false, badge: "Ключевое"     },
  { id: 6,  phase: 1, date: "12.04", title: "Запустить мини-курс $30 в рекламу",   instruction: "Создать отдельную кампанию для мини-курса. Цель: 20+ продаж за месяц.",                                                       done: false, badge: "Реклама"      },
  { id: 7,  phase: 1, date: "15.04", title: "Написать 10 постов контент-плана",    instruction: "2 поста про экспертизу, 3 кейса, 2 мотивационных, 3 продающих.",                                                              done: false, badge: "Ключевое"     },
  { id: 8,  phase: 1, date: "18.04", title: "Обновить Bio в Instagram",            instruction: "Добавить чёткий оффер: кому помогаю, какой результат, ссылка на бота.",                                                       done: false, badge: "Ключевое"     },
  { id: 9,  phase: 1, date: "22.04", title: "Анализ рекламных кампаний",           instruction: "Проверить CPL, CTR, конверсию. Масштабировать то, что работает.",                                                             done: false, badge: "Реклама"      },
  { id: 10, phase: 1, date: "30.04", title: "Подвести итоги апреля",               instruction: "Лиды, продажи, доход, выводы. Записать что работало, что нет.",                                                               done: false, badge: "Ключевое"     },
  // Phase 2
  { id: 11, phase: 2, date: "01.05", title: "Масштабировать рекламу до $7/день",   instruction: "Увеличить бюджет на лучшие аудитории. Добавить ЮВА рынок.",                                                                   done: false, badge: "Реклама"      },
  { id: 12, phase: 2, date: "03.05", title: "Запустить вебинар или мастер-класс",  instruction: "Тема: 'Как эксперту выйти на $3000+ через Instagram'. Регистрация через бота.",                                               done: false, badge: "Ключевое"     },
  { id: 13, phase: 2, date: "05.05", title: "Нанять ассистента",                   instruction: "Делегировать: публикации, ответы в директ, базовый монтаж клипов.",                                                           done: false, badge: "Делегировать" },
  { id: 14, phase: 2, date: "08.05", title: "Создать второй поток наставничества", instruction: "Открыть 3-5 мест на наставничество с новой группой клиентов.",                                                                 done: false, badge: "Ключевое"     },
  { id: 15, phase: 2, date: "12.05", title: "Запустить партнёрскую программу",     instruction: "Реферальная система: 10% с продаж для партнёров. Привлечь 3-5 партнёров.",                                                     done: false, badge: "Делегировать" },
  { id: 16, phase: 2, date: "15.05", title: "Обновить контент-стратегию",          instruction: "Добавить новые форматы: карусели, подкасты, коллаборации с экспертами.",                                                       done: false, badge: "Ключевое"     },
  { id: 17, phase: 2, date: "18.05", title: "Провести аудит воронки продаж",       instruction: "Проверить конверсию на каждом этапе. Найти узкие места.",                                                                      done: false, badge: "Ключевое"     },
  { id: 18, phase: 2, date: "22.05", title: "Записать новый мини-курс $30",        instruction: "Тема: 'Контент-план на месяц за 2 часа'. Загрузить в Gumroad/PayPal.",                                                         done: false, badge: "Ключевое"     },
  { id: 19, phase: 2, date: "25.05", title: "Собрать 10 видео-отзывов",            instruction: "Попросить клиентов записать короткое видео. Использовать для рекламы.",                                                        done: false, badge: "Делегировать" },
  { id: 20, phase: 2, date: "31.05", title: "Итоги мая + план июня",               instruction: "Анализ: лиды, продажи, доход. Цель июня: $10,000+",                                                                           done: false, badge: "Ключевое"     },
  // Phase 3
  { id: 21, phase: 3, date: "01.06", title: "Запустить продюсирование потоком",    instruction: "Открыть 2-3 места на продюсирование. Цена от $3000.",                                                                          done: false, badge: "Ключевое"     },
  { id: 22, phase: 3, date: "03.06", title: "Автоматизировать воронку полностью",  instruction: "Настроить автоматические ответы, оплату и онбординг без ручного труда.",                                                       done: false, badge: "Делегировать" },
  { id: 23, phase: 3, date: "05.06", title: "Масштабировать рекламу до $10/день",  instruction: "Тестировать новые аудитории и форматы рекламы. A/B тест хуков.",                                                               done: false, badge: "Реклама"      },
  { id: 24, phase: 3, date: "08.06", title: "Выступить на онлайн-конференции",     instruction: "Найти 2-3 релевантные конференции для экспертов. Подать заявку спикера.",                                                      done: false, badge: "Ключевое"     },
  { id: 25, phase: 3, date: "10.06", title: "Создать программу лояльности",        instruction: "Для действующих клиентов: скидки на продление, бонусы, VIP-доступ.",                                                           done: false, badge: "Делегировать" },
  { id: 26, phase: 3, date: "12.06", title: "Запустить групповое наставничество",  instruction: "Формат: мини-группа 5-8 человек × $500. Лонч через вебинар.",                                                                  done: false, badge: "Ключевое"     },
  { id: 27, phase: 3, date: "15.06", title: "Выйти на рынок Казахстана активно",   instruction: "Партнёрства с казахстанскими блогерами. Реклама на русскоязычную аудиторию Алматы.",                                           done: false, badge: "Реклама"      },
  { id: 28, phase: 3, date: "20.06", title: "Системизировать все процессы",        instruction: "Создать SOP для ассистента. Документировать все воронки и процессы.",                                                           done: false, badge: "Делегировать" },
  { id: 29, phase: 3, date: "25.06", title: "Запустить Email-рассылку",            instruction: "Собрать базу через лид-магниты. Запустить еженедельную рассылку с пользой.",                                                   done: false, badge: "Ключевое"     },
  { id: 30, phase: 3, date: "30.06", title: "Итоги 90 дней + стратегия Q3",        instruction: "Полный разбор результатов. Постановка целей на следующий квартал.",                                                            done: false, badge: "Ключевое"     },
];

const BADGE_COLORS: Record<string, string> = {
  "Ключевое":     "#5c6af0",
  "Реклама":      "#f59e0b",
  "Делегировать": "#6b7280",
};

const PHASE_LABELS: Record<1 | 2 | 3, string> = {
  1: "Фаза 1: 5–30 апреля",
  2: "Фаза 2: 1–31 мая",
  3: "Фаза 3: 1–30 июня",
};

export default function Plan90Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workspace/tasks");
        const apiTasks: any[] = res.ok ? await res.json() : [];
        const plan90Tasks = apiTasks.filter((t: any) => t.period === "plan90");

        if (plan90Tasks.length === 0) {
          // Seed all 30 tasks to the API
          const seeded = await Promise.all(
            INITIAL_TASKS.map(t =>
              fetch("/api/workspace/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title:       t.title,
                  description: t.instruction,
                  period:      "plan90",
                  priority:    "medium",
                  tags:        [t.badge, `phase-${t.phase}`],
                }),
              }).then(r => r.ok ? r.json() : null)
            )
          );
          setTasks(INITIAL_TASKS.map((t, i) => ({
            ...t,
            apiId: seeded[i]?.id,
            done:  false,
          })));
        } else {
          // Map API task done states onto INITIAL_TASKS by title match
          setTasks(INITIAL_TASKS.map(t => {
            const api = plan90Tasks.find((a: any) => a.title === t.title);
            return { ...t, apiId: api?.id, done: api?.status === "done" };
          }));
        }
      } catch {
        setTasks(INITIAL_TASKS);
      }
    }
    load();
  }, []);

  const toggleDone = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    if (task.apiId) {
      await fetch(`/api/workspace/tasks/${task.apiId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newDone ? "done" : "todo" }),
      }).catch(() => {});
    }
  };

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalDone = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const phaseTasks = tasks.filter((t) => t.phase === activePhase);

  return (
    <AdminLayout>
    <div style={{ minHeight: "100vh", background: "#050710", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 20, letterSpacing: "-0.5px" }}>
          📅 90 дней
        </h1>

        {/* Goal metrics row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Лидов", value: "180+" },
            { label: "Продажи $30", value: "60–90 шт" },
            { label: "Наставничество", value: "8–15 клиентов" },
            { label: "Доход", value: "$14–22k" },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: "#0d1126",
                border: "1px solid #1e2a4a",
                borderRadius: 10,
                padding: "10px 18px",
                flex: "1 1 160px",
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#22c55e" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div style={{ background: "#0d1126", border: "1px solid #1e2a4a", borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#94a3b8" }}>
            <span>Общий прогресс</span>
            <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{totalDone} / {totalTasks} задач — {progressPct}%</span>
          </div>
          <div style={{ background: "#1e2a4a", borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #5c6af0, #22c55e)",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Phase tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {([1, 2, 3] as const).map((phase) => {
            const pDone = tasks.filter((t) => t.phase === phase && t.done).length;
            const pTotal = tasks.filter((t) => t.phase === phase).length;
            const isActive = activePhase === phase;
            return (
              <button
                key={phase}
                onClick={() => setActivePhase(phase)}
                style={{
                  background: isActive ? "#5c6af0" : "#0d1126",
                  border: `1px solid ${isActive ? "#5c6af0" : "#1e2a4a"}`,
                  borderRadius: 8,
                  padding: "9px 16px",
                  color: isActive ? "#fff" : "#94a3b8",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {PHASE_LABELS[phase]}
                <span
                  style={{
                    background: isActive ? "rgba(255,255,255,0.2)" : "#1e2a4a",
                    borderRadius: 99,
                    padding: "1px 7px",
                    fontSize: 11,
                    color: isActive ? "#fff" : "#64748b",
                  }}
                >
                  {pDone}/{pTotal}
                </span>
              </button>
            );
          })}
        </div>

        {/* Task cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {phaseTasks.map((task) => {
            const isExpanded = expanded.has(task.id);
            const badgeColor = BADGE_COLORS[task.badge] ?? "#6b7280";
            return (
              <div
                key={task.id}
                style={{
                  background: "#0d1126",
                  border: `1px solid ${task.done ? "#1a3a2a" : "#1e2a4a"}`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  opacity: task.done ? 0.65 : 1,
                  transition: "opacity 0.2s, border-color 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                  {/* Checkbox */}
                  <div
                    onClick={() => toggleDone(task.id)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      border: `2px solid ${task.done ? "#22c55e" : "#334155"}`,
                      background: task.done ? "#22c55e" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: 2,
                      transition: "all 0.2s",
                    }}
                  >
                    {task.done && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#475569", fontVariantNumeric: "tabular-nums" }}>{task.date}</span>
                      <span
                        style={{
                          background: `${badgeColor}22`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}44`,
                          borderRadius: 99,
                          padding: "2px 9px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {task.badge}
                      </span>
                    </div>

                    {/* Title — clickable to expand */}
                    <div
                      onClick={() => toggleExpanded(task.id)}
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: task.done ? "#475569" : "#e2e8f0",
                        textDecoration: task.done ? "line-through" : "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        userSelect: "none",
                      }}
                    >
                      <span style={{ flex: 1 }}>{task.title}</span>
                      <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Expandable instruction */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 12px",
                          background: "#070d1f",
                          borderRadius: 7,
                          fontSize: 13,
                          color: "#94a3b8",
                          lineHeight: 1.6,
                          borderLeft: `3px solid ${badgeColor}`,
                        }}
                      >
                        {task.instruction}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </AdminLayout>
  );
}
