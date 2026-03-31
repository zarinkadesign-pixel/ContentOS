import { NextRequest, NextResponse } from "next/server";
import { getTasks, saveTasks } from "@/lib/kv";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body   = await req.json();
  const tasks  = await getTasks();
  const idx    = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  // Auto-set completed_at when marking done
  const updates: any = { ...body };
  if (body.status === "done" && !tasks[idx].completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  if (body.status && body.status !== "done") {
    updates.completed_at = null;
  }

  tasks[idx] = { ...tasks[idx], ...updates };
  await saveTasks(tasks);
  return NextResponse.json(tasks[idx]);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks  = await getTasks();
  const updated = tasks.filter((t) => t.id !== id);
  if (updated.length === tasks.length) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await saveTasks(updated);
  return new NextResponse(null, { status: 204 });
}
