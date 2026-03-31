import { NextRequest, NextResponse } from "next/server";
import { getFinance, saveFinance } from "@/lib/kv";

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id }  = await params;
  const finance = await getFinance();
  const before  = (finance.transactions ?? []).length;
  finance.transactions = (finance.transactions ?? []).filter((t: any) => t.id !== id);
  if (finance.transactions.length === before)
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  await saveFinance(finance);
  return new NextResponse(null, { status: 204 });
}
