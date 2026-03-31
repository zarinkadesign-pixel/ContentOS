import { NextRequest, NextResponse } from "next/server";
import { getTeamTasks, saveTeamTasks } from "@/lib/kv";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks  = await getTeamTasks();
  const task   = tasks.find((t: any) => t.id === id);
  if (!task) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }  = await params;
  const tasks   = await getTeamTasks();
  const updated = tasks.filter((t: any) => t.id !== id);
  await saveTeamTasks(updated);
  return new NextResponse(null, { status: 204 });
}
