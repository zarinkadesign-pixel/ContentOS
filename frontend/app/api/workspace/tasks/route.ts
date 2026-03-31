import { NextRequest, NextResponse } from "next/server";
import { getTasks, saveTasks } from "@/lib/kv";
import { randomUUID } from "crypto";

export async function GET() {
  return NextResponse.json(await getTasks());
}

export async function POST(req: NextRequest) {
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
