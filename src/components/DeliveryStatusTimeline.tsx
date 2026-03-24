import { CheckCircle2, Navigation, Package, Truck, MapPin } from "lucide-react";

export default function DeliveryStatusTimeline({ status }: { status: string }) {
  const steps = [
    { key: "picked-up", label: "Picked Up", icon: Package },
    { key: "in-transit", label: "In Transit", icon: Truck },
    { key: "near-destination", label: "Near Destination", icon: Navigation },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  // Logic to determine active index
  let activeIndex = -1;
  if (status === "picked-up" || status === "accepted") activeIndex = 0;
  if (status === "in-transit") activeIndex = 1; // Wait, we don't have near-destination in standard status yet.
  if (status === "near-destination") activeIndex = 2;
  if (status === "delivered" || status === "received" || status === "completed") activeIndex = 3;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isActive = i <= activeIndex;
          const isLast = i === steps.length - 1;
          const Icon = step.icon;
          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-[50%] top-4 h-1 w-full -translate-y-[50%] rounded-full ${
                    i < activeIndex ? "bg-secondary" : "bg-muted"
                  }`}
                />
              )}
              {/* Icon Circle */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  isActive
                    ? "border-secondary bg-secondary text-white shadow-md shadow-secondary/20"
                    : "border-muted bg-card text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`mt-2 text-[10px] font-bold uppercase text-center ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
