import { NextResponse } from "next/server";
import { getFinance } from "@/lib/kv";

export async function GET() {
  return NextResponse.json(await getFinance());
}
