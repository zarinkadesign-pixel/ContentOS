import { NextRequest, NextResponse } from "next/server";
import { getOpusSocialCopy } from "@/lib/opus";

export async function POST(req: NextRequest) {
  const { clip_id } = await req.json();
  if (!clip_id) return NextResponse.json({ detail: "clip_id required" }, { status: 400 });
  const result = await getOpusSocialCopy(clip_id);
  if (result.error) return NextResponse.json({ detail: result.error }, { status: 400 });
  return NextResponse.json(result);
}
