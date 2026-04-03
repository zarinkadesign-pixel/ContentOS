import { NextRequest, NextResponse } from "next/server";
import { getTasks, saveTasks } from "@/lib/kv";
import { randomUUID } from "crypto";
import { demoGetGuard, demoWriteGuard } from "@/lib/demo-guard";

const DEMO_TASKS = [
  { id: "demo_task_1", title: "Снять Reels для Алины", description: "Тема: 3 ошибки в питании", period: "week", due_date: "2026-04-03", priority: "high", status: "todo", tags: ["контент", "видео"] },
  { id: "demo_task_2", title: "Созвон с Максимом", description: "Разбор результатов запуска", period: "week", due_date: "2026-04-02", priority: "medium", status: "in_progress", tags: ["встреча"] },
  { id: "demo_task_3", title: "Написать контент-план", description: "На апрель, 3 эксперта", period: "month", due_date: "2026-04-05", priority: "medium", status: "todo", tags: ["планирование"] },
  { id: "demo_task_4", title: "Отчёт для инвесторов", description: "Итоги Q1 2026", period: "month", due_date: "2026-04-10", priority: "low", status: "todo", tags: ["финансы"] },
];

export async function GET(req: NextRequest) {
  const demoRes = demoGetGuard(req, DEMO_TASKS);
  if (demoRes) return demoRes;
  return NextResponse.json(await getTasks());
}

export async function POST(req: NextRequest) {
  const demoRes = demoWriteGuard(req);
  if (demoRes) return demoRes;
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ detail: "title required" }, { status: 400 });

  const tasks = await getTasks();
  const task = {
    id:           `task_${randomUUID()}`,
    title:        body.title.trim(),
    description:  body.description ?? "",
    period:       body.period       ?? "week",
    due_date:     body.due_date     ?? new Date().toISOString().slice(0, 10),
    priority:     body.priority     ?? "medium",
    status:       "todo",
    created_at:   new Date().toISOString(),
    completed_at: null,
    tags:         body.tags         ?? [],
  };
  tasks.push(task);
  await saveTasks(tasks);
  return NextResponse.json(task, { status: 201 });
}
