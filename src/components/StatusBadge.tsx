import type { ParcelStatus } from "@/lib/parcelStore";

const statusConfig: Record<ParcelStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  requested: { label: "Requested", className: "bg-warning/15 text-warning" },
  accepted: { label: "Accepted", className: "bg-secondary/15 text-secondary" },
  "in-transit": { label: "In Transit", className: "bg-primary/15 text-primary" },
  "picked-up": { label: "Picked Up", className: "bg-amber-500/15 text-amber-500" },
  delivered: { label: "Delivered", className: "bg-success/15 text-success" },
  received: { label: "Received", className: "bg-indigo-500/15 text-indigo-500 font-bold" },
  completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-500" },
  cancelled: { label: "Cancelled", className: "bg-red-500/15 text-red-500" },
};

export default function StatusBadge({ status }: { status: ParcelStatus }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
