import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Truck, Package, ArrowRight, Bike, Bus, Car, Box, Layers, Weight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import RouteMap from "@/components/RouteMap";
import { searchParcels, updateParcelStatus, confirmPickup, confirmDelivery, requestParcel, type Parcel } from "@/lib/parcelStore";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Traveller() {
  const { user } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<Parcel[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // OTP States
  const [otpModal, setOtpModal] = useState<{ id: string, type: 'pickup' | 'delivery' } | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSearch = async () => {
    try {
      const data = await searchParcels(from, to);
      setResults(data);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  useEffect(() => { handleSearch(); }, []);


  const handleStartTransit = async (id: string, hasOtp: boolean) => {
    if (hasOtp) {
      setOtpModal({ id, type: 'pickup' });
      setOtpValue("");
    } else {
      await updateParcelStatus(id, "in-transit");
      toast.success("Parcel is now in transit!");
      handleSearch();
    }
  };

  const handleDeliver = async (id: string, hasOtp: boolean) => {
    if (hasOtp) {
      setOtpModal({ id, type: 'delivery' });
      setOtpValue("");
    } else {
      await updateParcelStatus(id, "delivered");
      toast.success("Parcel delivered! 🎉");
      handleSearch();
    }
  };

  const handleOtpSubmit = async () => {
    if (!otpModal) return;
    setIsConfirming(true);
    try {
      if (otpModal.type === 'pickup') {
        const res = await confirmPickup(otpModal.id, otpValue);
        if (res) {
          toast.success("Pickup confirmed! Now in transit.");
          setOtpModal(null);
          handleSearch();
        }
      } else {
        const res = await confirmDelivery(otpModal.id, otpValue);
        if (res) {
          toast.success("Delivery confirmed! Great job.");
          setOtpModal(null);
          handleSearch();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid Code");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRequest = async (id: string) => {
    if (!user) return;
    try {
      await requestParcel(id, user.name);
      toast.success("Request sent! Waiting for Sender to approve.");
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Traveller Dashboard</h1>
        <p className="text-muted-foreground">Find parcels along your route</p>
      </div>

      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-foreground">From</label>
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Origin city" />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-foreground">To</label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Destination city" />
        </div>
        <Button onClick={handleSearch} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <Truck className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No parcels found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-5 shadow-card hover:border-secondary/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="cursor-pointer flex-1" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-secondary" />
                    <p className="font-heading font-semibold text-foreground">{p.fromLocation}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <p className="font-heading font-semibold text-foreground">{p.toLocation}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Weight className="h-3 w-3" /> {p.weight}kg</span>
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {p.itemCount} items</span>
                    <span>To: {p.receiverName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.vehicleType && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        {p.vehicleType === 'bike' && <Bike className="h-3 w-3" />}
                        {p.vehicleType === 'car' && <Car className="h-3 w-3" />}
                        {p.vehicleType === 'van' && <Truck className="h-3 w-3" />}
                        {p.vehicleType === 'bus' && <Bus className="h-3 w-3" />}
                        {p.vehicleType} Needed
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Box className="h-3 w-3" /> {p.size}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.status === "pending" && (
                    <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => handleRequest(p.id)}>
                      Request
                    </Button>
                  )}
                  {p.status === "accepted" && (
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleStartTransit(p.id, !!p.pickupOTP)}>
                      Start Transit
                    </Button>
                  )}
                  {p.status === "in-transit" && (
                    <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => handleDeliver(p.id, !!p.deliveryOTP)}>
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
              {expanded === p.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  {p.description && <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>}
                  <RouteMap from={p.fromLocation} to={p.toLocation} animate={p.status === "in-transit"} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <Dialog open={!!otpModal} onOpenChange={(open) => !open && setOtpModal(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-secondary" />
              {otpModal?.type === 'pickup' ? "Confirm Pickup" : "Confirm Delivery"}
            </DialogTitle>
            <DialogDescription>
              Please enter the 4-digit code provided by the {otpModal?.type === 'pickup' ? "sender" : "receiver"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <InputOTP
              maxLength={4}
              value={otpValue}
              onChange={(value) => setOtpValue(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpModal(null)}>Cancel</Button>
            <Button
              className="bg-secondary text-white hover:bg-secondary/90"
              onClick={handleOtpSubmit}
              disabled={otpValue.length < 4 || isConfirming}
            >
              {isConfirming ? "Verifying..." : "Confirm Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
