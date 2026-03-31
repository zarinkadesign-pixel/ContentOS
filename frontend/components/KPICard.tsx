import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: "accent" | "green" | "yellow" | "red";
}

const COLOR_MAP = {
  accent: "text-accent bg-accent/10",
  green:  "text-green-400 bg-green-400/10",
  yellow: "text-yellow-400 bg-yellow-400/10",
  red:    "text-red-400 bg-red-400/10",
};

export default function KPICard({ label, value, sub, icon: Icon, color = "accent" }: Props) {
  return (
    <div className="card flex items-start gap-4">
      <div className={clsx("p-2.5 rounded-lg shrink-0", COLOR_MAP[color])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-subtext uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-text mt-0.5">{value}</p>
        {sub && <p className="text-xs text-subtext mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
