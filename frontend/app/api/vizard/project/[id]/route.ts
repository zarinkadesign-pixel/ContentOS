import { NextRequest, NextResponse } from "next/server";
import { pollProject } from "@/lib/vizard";

type Params = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Params) {
  const result = await pollProject(params.id);
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
