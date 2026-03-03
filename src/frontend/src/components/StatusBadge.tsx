import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "../backend.d";

interface StatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  },
  sent: {
    label: "Sent",
    className: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  },
  overdue: {
    label: "Overdue",
    className: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono tracking-wide",
        config.className,
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}
