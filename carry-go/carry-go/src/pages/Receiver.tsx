import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, PackageCheck, Handshake, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import RouteMap from "@/components/RouteMap";
import { getParcelsByPhone, markReceived, type Parcel } from "@/lib/parcelStore";
import { toast } from "sonner";

export default function Receiver() {
  const [phone, setPhone] = useState("");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const data = await getParcelsByPhone(phone);
      setParcels(data);
      setSearched(true);
    } catch (err) {
      toast.error("Failed to fetch parcels");
    }
  };

  const handleReceive = async (id: string) => {
    await markReceived(id);
    toast.success("Parcel marked as received! Sender will be notified of payment.");
    handleSearch();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Track Your Parcel</h1>
        <p className="text-muted-foreground">Enter your phone number to see your parcels</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="flex-1"
          required
        />
        <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Search className="mr-2 h-4 w-4" /> Track
        </Button>
      </form>

      {searched && parcels.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <MapPin className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No parcels found for this phone number.</p>
        </div>
      )}

      <AnimatePresence>
        {parcels.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex cursor-pointer items-start justify-between" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div>
                <p className="font-heading font-semibold text-foreground">{p.fromLocation} → {p.toLocation}</p>
                <p className="text-sm text-muted-foreground">From: {p.senderName} · {p.weight}kg</p>
                {p.travellerName && (
                  <div className="mt-2 flex items-center gap-4">
                    <p className="text-xs text-secondary font-medium">Carried by: {p.travellerName}</p>
                    {p.deliveryOTP && (p.status === 'in-transit' || p.status === 'delivered') && (
                      <div className="flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-500">
                        <KeyRound className="h-3 w-3" /> CODE: {p.deliveryOTP}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <StatusBadge status={p.status} />
            </div>

            {/* Status Timeline */}
            <div className="mt-4 flex items-center gap-1">
              {(['pending', 'requested', 'accepted', 'in-transit', 'delivered', 'received'] as const).map((s, i) => {
                const statusOrder = ['pending', 'requested', 'accepted', 'in-transit', 'delivered', 'received'];
                const currentIdx = statusOrder.indexOf(p.status);
                const isComplete = i <= currentIdx;
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div className={`h-2 w-full rounded-full transition-colors ${isComplete ? (p.status === 'received' ? 'bg-indigo-500' : 'bg-secondary') : 'bg-muted'}`} />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Pending</span>
              <span>In Transit</span>
              <span>Delivered</span>
              <span>Received</span>
            </div>

            {p.status === "delivered" && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                    <Handshake className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Parcel is here!</p>
                    <p className="text-xs text-muted-foreground">Please confirm with the traveller and mark as received.</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleReceive(p.id)}
                  className="w-full bg-success font-bold hover:bg-success/90"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Received Delivery
                </Button>
              </div>
            )}

            {p.status === "received" && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-500/10 p-3">
                <PackageCheck className="h-5 w-5 text-indigo-500" />
                <p className="text-sm font-medium text-indigo-500">Delivery confirmed and received!</p>
              </div>
            )}


            {expanded === p.id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <RouteMap from={p.fromLocation} to={p.toLocation} animate={p.status === "in-transit"} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
