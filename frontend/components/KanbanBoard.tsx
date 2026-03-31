"use client";
import { useState } from "react";
import clsx from "clsx";
import { STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, type Lead } from "@/lib/types";
import { moveLead } from "@/lib/api";
import { User, ArrowRight } from "lucide-react";

interface Props {
  leads: Lead[];
  onUpdate: () => void;
}

export default function KanbanBoard({ leads, onUpdate }: Props) {
  const [moving, setMoving] = useState<string | null>(null);

  async function handleMove(leadId: string, stage: string) {
    setMoving(leadId);
    try {
      await moveLead(leadId, stage);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setMoving(null);
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGE_ORDER.map((stage) => {
        const col = leads.filter((l) => l.stage === stage);
        return (
          <div key={stage} className="shrink-0 w-52">
            {/* Column header */}
            <div className="flex items-center justify-between mb-2">
              <span className={clsx("badge text-xs", STAGE_COLORS[stage])}>
                {STAGE_LABELS[stage]}
              </span>
              <span className="text-xs text-subtext">{col.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-20">
              {col.map((lead) => (
                <div key={lead.id} className="card p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={10} className="text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text truncate">{lead.name}</p>
                      <p className="text-xs text-subtext truncate">{lead.niche}</p>
                    </div>
                  </div>

                  {lead.source && (
                    <p className="text-xs text-subtext">📍 {lead.source}</p>
                  )}

                  {/* Move buttons */}
                  {stage !== "contract" && (
                    <button
                      disabled={moving === lead.id}
                      onClick={() => {
                        const next = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
                        if (next) handleMove(lead.id, next);
                      }}
                      className="w-full flex items-center justify-center gap-1 text-xs text-accent hover:text-white
                                 bg-accent/10 hover:bg-accent/30 rounded px-2 py-1 transition-colors"
                    >
                      {STAGE_LABELS[STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1]]}
                      <ArrowRight size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
