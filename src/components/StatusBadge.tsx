import type { ParcelStatus } from "@/lib/parcelStore";

const statusConfig: Record<ParcelStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  pending_payment: { label: "Pending Payment", className: "bg-amber-100 text-amber-700" },
  open_for_travellers: { label: "Available", className: "bg-blue-50 text-blue-600 font-bold" },
  requested: { label: "Requested", className: "bg-warning/15 text-warning" },
  accepted: { label: "Accepted", className: "bg-secondary/15 text-secondary" },
  assigned: { label: "Assigned", className: "bg-emerald-50 text-emerald-600 font-black" },
  arrived: { label: "At Pickup", className: "bg-emerald-100 text-emerald-700 font-bold animate-pulse" },
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
