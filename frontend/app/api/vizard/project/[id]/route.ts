import { NextRequest, NextResponse } from "next/server";
import { pollProject } from "@/lib/vizard";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await pollProject(id);
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
