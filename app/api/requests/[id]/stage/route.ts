import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const id = params.id;
  const { status } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  // Basic schema strictness
  const validStages = ["new", "in_progress", "repaired", "scrap"];
  if (!validStages.includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 422 });
  }

  // Update request stage
  const { error: reqError, data: updatedReq } = await supabase
    .from("maintenance_requests")
    .update({ stage: status })
    .eq("id", id)
    .select("equipment_id").single();

  if (reqError) {
    return NextResponse.json({ error: reqError.message }, { status: 500 });
  }

  // Smart logic: If moved to "scrap", flag corresponding equipment as scrap
  if (status === "scrap" && updatedReq && updatedReq.equipment_id) {
    await supabase
      .from("equipment")
      .update({ status: "scrap", scrap_note: `Scrapped via maintenance request ${id}`, scrap_date: new Date().toISOString() })
      .eq("id", updatedReq.equipment_id);
  }

  return NextResponse.json({ ok: true });
}
