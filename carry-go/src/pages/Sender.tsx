import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Check, Trash2, MapPin, Weight, ArrowRight, Sparkles, Box, Bike, Bus, Car, Truck, Info, Layers, CreditCard, QrCode, Smartphone, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import RouteMap from "@/components/RouteMap";
import { createParcel, getAllParcels, updateParcelStatus, deleteParcel, updateParcelPayment, type Parcel } from "@/lib/parcelStore";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";

export default function Sender() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // New form fields
  const [weight, setWeight] = useState("");
  const [size, setSize] = useState<any>("small");
  const [itemCount, setItemCount] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'pay-now' | 'pay-on-delivery'>('pay-now');

  // Checkout/Payment states
  const [checkoutParcel, setCheckoutParcel] = useState<any>(null);
  const [showScanner, setShowScanner] = useState<string | null>(null); // parcel id for scanning

  const refresh = async () => {
    try {
      const data = await getAllParcels();
      setParcels(data);
    } catch (err) {
      console.error("Failed to load parcels:", err);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parcelData = {
      senderName: user?.name || "Me",
      receiverName: fd.get("receiverName") as string,
      receiverPhone: fd.get("receiverPhone") as string,
      fromLocation: fd.get("fromLocation") as string,
      toLocation: fd.get("toLocation") as string,
      weight: parseFloat(weight) || 0,
      size: size as any,
      itemCount: itemCount,
      vehicleType: selectedVehicle,
      paymentMethod: paymentMethod,
      paymentStatus: 'unpaid' as const,
      description: fd.get("description") as string,
    };

    if (paymentMethod === 'pay-now') {
      setCheckoutParcel(parcelData);
    } else {
      await createParcel(parcelData);
      toast.success("Parcel created with Pay on Delivery!");
      resetForm();
    }
  };

  const finalizePayment = async () => {
    if (checkoutParcel) {
      await createParcel({
        ...checkoutParcel,
        paymentStatus: 'paid'
      });
      toast.success("Payment successful! Parcel created.");
      resetForm();
    }
  };

  const handleManualPayment = async (id: string) => {
    await updateParcelPayment(id, 'paid');
    toast.success("Payment received! Delivery complete.");
    setShowScanner(null);
    refresh();
  };

  const resetForm = () => {
    setShowForm(false);
    setCheckoutParcel(null);
    setWeight("");
    setSize("small");
    setItemCount(1);
    setSelectedVehicle("");
    setPaymentMethod('pay-now');
    refresh();
  };

  const getRecommendedVehicle = () => {
    const w = parseFloat(weight) || 0;
    const n = itemCount;

    if (w <= 10 && size === 'small' && n <= 2) return { id: 'bike', label: 'Bike', icon: Bike, color: 'text-blue-400' };
    if (w <= 50 && (size === 'small' || size === 'medium') && n <= 10) return { id: 'car', label: 'Car', icon: Car, color: 'text-green-400' };
    if (w <= 200 && size !== 'very-large' && n <= 50) return { id: 'van', label: 'Van', icon: Truck, color: 'text-purple-400' };
    return { id: 'bus', label: 'Bus', icon: Bus, color: 'text-orange-400' };
  };

  const recommended = getRecommendedVehicle();

  const handleAccept = async (id: string) => {
    await updateParcelStatus(id, "accepted");
    toast.success("Traveller request accepted!");
    refresh();
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteParcel(id);
    if (ok) {
      toast.success("Parcel deleted");
      refresh();
      if (selected?.id === id) setSelected(null);
    } else {
      toast.error("Failed to delete parcel");
    }
  };

  const statusCounts = {
    total: parcels.length,
    pending: parcels.filter(p => p.status === "pending").length,
    inTransit: parcels.filter(p => p.status === "in-transit").length,
    delivered: parcels.filter(p => p.status === "delivered").length,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-20">

      {/* ── Animated page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative mb-8 overflow-hidden rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, hsl(222 60% 14%) 0%, hsl(232 55% 20%) 50%, hsl(222 55% 16%) 100%)",
        }}
      >
        {/* Glow orbs */}
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-secondary/25 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <Package className="h-6 w-6 text-secondary" />
              </motion.div>
              <h1 className="font-heading text-2xl font-bold text-white">Sender Dashboard</h1>
            </div>
            <p className="text-sm text-white/60">Create and manage your parcels</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowForm(!showForm)}
            className="relative inline-flex items-center gap-2 overflow-hidden rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(28 100% 55%), hsl(20 100% 45%))" }}
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
            <Plus className="h-4 w-4" />
            New Parcel
          </motion.button>
        </div>

        {/* Stats strip */}
        <div className="relative mt-5 grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: statusCounts.total, color: "hsl(28 100% 55%)" },
            { label: "Pending", value: statusCounts.pending, color: "#f59e0b" },
            { label: "In Transit", value: statusCounts.inTransit, color: "#60a5fa" },
            { label: "Delivered", value: statusCounts.delivered, color: "#34d399" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="font-heading text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-white/50">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── New Parcel Form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="mb-6 overflow-hidden rounded-2xl border border-secondary/30 bg-card p-6 shadow-card"
            style={{ boxShadow: "0 0 0 1px hsl(28 100% 55% / 0.12), 0 8px 32px hsl(28 100% 55% / 0.08)" }}
          >
            {/* Form header */}
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15">
                <Sparkles className="h-4 w-4 text-secondary" />
              </div>
              <h2 className="font-heading text-lg font-semibold text-foreground">New Parcel</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="group">
                <Label htmlFor="receiverName" className="text-sm font-medium text-foreground/80">Receiver Name</Label>
                <Input
                  id="receiverName"
                  name="receiverName"
                  required
                  placeholder="John Doe"
                  className="mt-1 border-border transition-all focus:border-secondary focus:ring-secondary/20"
                />
              </div>
              <div className="group">
                <Label htmlFor="receiverPhone" className="text-sm font-medium text-foreground/80">Receiver Phone</Label>
                <Input
                  id="receiverPhone"
                  name="receiverPhone"
                  required
                  placeholder="+234..."
                  className="mt-1 border-border transition-all focus:border-secondary focus:ring-secondary/20"
                />
              </div>
              <div className="group">
                <Label htmlFor="fromLocation" className="text-sm font-medium text-foreground/80">From</Label>
                <Input
                  id="fromLocation"
                  name="fromLocation"
                  required
                  placeholder="Lagos"
                  className="mt-1 border-border transition-all focus:border-secondary focus:ring-secondary/20"
                />
              </div>
              <div className="group">
                <Label htmlFor="toLocation" className="text-sm font-medium text-foreground/80">To</Label>
                <Input
                  id="toLocation"
                  name="toLocation"
                  required
                  placeholder="Accra"
                  className="mt-1 border-border transition-all focus:border-secondary focus:ring-secondary/20"
                />
              </div>

              {/* Enhanced Physics-based Fields */}
              <div className="grid grid-cols-2 gap-3 sm:col-span-2">
                <div className="group">
                  <Label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Weight className="h-3 w-3" /> Weight (kg)
                  </Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    placeholder="2.5"
                    step="0.1"
                    className="border-border transition-all focus:border-secondary"
                  />
                </div>
                <div className="group">
                  <Label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Box className="h-3 w-3" /> Size
                  </Label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger className="border-border focus:ring-1 focus:ring-secondary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (Envelope/Box)</SelectItem>
                      <SelectItem value="medium">Medium (Suitcase)</SelectItem>
                      <SelectItem value="large">Large (Furniture/Multiple)</SelectItem>
                      <SelectItem value="very-large">Very Large (Bulk)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="group">
                <Label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Layers className="h-3 w-3" /> No. of Items
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={itemCount}
                    onChange={(e) => setItemCount(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full border-border"
                  />
                </div>
              </div>

              <div className="group sm:col-span-2">
                <Label className="mb-3 block text-sm font-semibold text-foreground">Select Vehicle</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { id: 'bike', label: 'Bike', icon: Bike, desc: '< 10kg' },
                    { id: 'car', label: 'Car', icon: Car, desc: '< 50kg' },
                    { id: 'van', label: 'Van', icon: Truck, desc: '< 200kg' },
                    { id: 'bus', label: 'Bus', icon: Bus, desc: 'Bulk' },
                  ].map((v) => {
                    const isRecommended = recommended.id === v.id;
                    const isSelected = selectedVehicle === v.id;
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVehicle(v.id)}
                        className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${isSelected
                          ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                          : 'border-border bg-background hover:border-secondary/40'
                          }`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-2 rounded-full bg-secondary px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
                            SUGGESTED
                          </span>
                        )}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground group-hover:text-secondary'
                          }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-tight">{v.label}</p>
                          <p className="text-[8px] text-muted-foreground">{v.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="group sm:col-span-2">
                <Label className="mb-3 block text-sm font-semibold text-foreground">Payment Method</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay-now')}
                    className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${paymentMethod === 'pay-now' ? 'border-secondary bg-secondary/5' : 'border-border'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${paymentMethod === 'pay-now' ? 'bg-secondary text-white' : 'bg-muted'}`}>
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">Pay Now</p>
                        <p className="text-[10px] text-muted-foreground">Prepaid Delivery</p>
                      </div>
                    </div>
                    {paymentMethod === 'pay-now' && <Check className="h-4 w-4 text-secondary" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay-on-delivery')}
                    className={`flex items-center justify-between rounded-xl border-2 p-4 transition-all ${paymentMethod === 'pay-on-delivery' ? 'border-indigo-500 bg-indigo-500/5' : 'border-border'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${paymentMethod === 'pay-on-delivery' ? 'bg-indigo-500 text-white' : 'bg-muted'}`}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">Pay on Delivery</p>
                        <p className="text-[10px] text-muted-foreground">Receiver Pays</p>
                      </div>
                    </div>
                    {paymentMethod === 'pay-on-delivery' && <Check className="h-4 w-4 text-indigo-500" />}
                  </button>
                </div>
              </div>

              <div className="group sm:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground/80">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="What are you sending?"
                  className="mt-1 border-border transition-all focus:border-secondary focus:ring-secondary/20"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="rounded-full px-8 py-2.5 text-sm font-bold text-white shadow-xl"
                style={{ background: paymentMethod === 'pay-now' ? "linear-gradient(135deg, hsl(28 100% 55%), hsl(20 100% 45%))" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {paymentMethod === 'pay-now' ? 'Proceed to Payment' : 'Create Parcel'}
              </motion.button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="rounded-full font-semibold">
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── QR Payment Modal (Checkout) ── */}
      <AnimatePresence>
        {checkoutParcel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-2xl border border-white/10"
            >
              <div className="bg-secondary p-6 text-center text-white">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <QrCode className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-tight">Scan to Pay</h2>
                <p className="text-sm opacity-80">Complete payment to finalize parcel</p>
              </div>

              <div className="p-8 text-center">
                <div className="relative mx-auto mb-6 aspect-square w-48 rounded-2xl bg-white p-4 shadow-inner">
                  {/* Decorative QR Corners */}
                  <div className="absolute left-2 top-2 h-6 w-6 border-l-4 border-t-4 border-secondary" />
                  <div className="absolute right-2 top-2 h-6 w-6 border-r-4 border-t-4 border-secondary" />
                  <div className="absolute bottom-2 left-2 h-6 w-6 border-b-4 border-l-4 border-secondary" />
                  <div className="absolute bottom-2 right-2 h-6 w-6 border-b-4 border-r-4 border-secondary" />

                  {/* Faux QR Code - Stylized UI instead of image for speed */}
                  <div className="grid h-full w-full grid-cols-4 gap-1 opacity-90">
                    {[...Array(64)].map((_, i) => (
                      <div key={i} className={`rounded-[1px] ${Math.random() > 0.4 ? 'bg-slate-900' : 'bg-transparent'}`} />
                    ))}
                  </div>

                  {/* Scanner line animation */}
                  <motion.div
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-1/2 h-0.5 w-[80%] -translate-x-1/2 bg-secondary shadow-[0_0_10px_#f97316] z-10"
                  />
                </div>

                <div className="mb-6 rounded-2xl bg-muted p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount to Pay:</span>
                    <span className="font-bold text-foreground">₹{(checkoutParcel.weight * 50 + 20).toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-muted-foreground text-[10px] uppercase">Service Tax Included</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={finalizePayment}
                    className="h-12 w-full bg-secondary font-bold text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                  >
                    Confirm Payment
                  </Button>
                  <button
                    onClick={() => setCheckoutParcel(null)}
                    className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Go back
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* ── Empty state ── */}
      {parcels.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-secondary/20 py-20 text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10"
          >
            <Package className="h-8 w-8 text-secondary" />
          </motion.div>
          <p className="mb-1 font-heading text-lg font-semibold text-foreground">No parcels yet</p>
          <p className="mb-5 text-sm text-muted-foreground">Create your first parcel to get started</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, hsl(28 100% 55%), hsl(20 100% 45%))" }}
          >
            <Plus className="h-4 w-4" /> Create Parcel
          </motion.button>
        </motion.div>
      ) : (
        /* ── Parcel cards ── */
        <motion.div
          className="grid gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {parcels.map((p) => {
            const isSelected = selected?.id === p.id;
            const isHovered = hoveredId === p.id;

            return (
              <motion.div
                key={p.id}
                layout
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                onHoverStart={() => setHoveredId(p.id)}
                onHoverEnd={() => setHoveredId(null)}
                onClick={() => setSelected(isSelected ? null : p)}
                className="relative cursor-pointer overflow-hidden rounded-xl border bg-card"
                style={{
                  borderColor: isSelected
                    ? "hsl(28 100% 55% / 0.6)"
                    : isHovered
                      ? "hsl(28 100% 55% / 0.3)"
                      : "hsl(var(--border))",
                  boxShadow: isSelected
                    ? "0 0 0 2px hsl(28 100% 55% / 0.2), 0 12px 36px hsl(28 100% 55% / 0.12)"
                    : isHovered
                      ? "0 8px 28px hsl(28 100% 55% / 0.10)"
                      : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "border-color 0.25s, box-shadow 0.25s",
                }}
              >
                {/* Orange top accent bar (animates in on hover/select) */}
                <motion.div
                  className="absolute left-0 top-0 h-0.5 rounded-t-xl"
                  style={{ background: "linear-gradient(90deg, hsl(28 100% 55%), hsl(40 100% 65%))" }}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: isHovered || isSelected ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Glow blob on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-secondary/10 blur-2xl"
                    />
                  )}
                </AnimatePresence>

                <div className="relative p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon + route info */}
                    <div className="flex items-start gap-3">
                      <motion.div
                        animate={{ backgroundColor: isHovered || isSelected ? "hsl(28 100% 55%)" : "hsl(28 100% 55% / 0.12)" }}
                        transition={{ duration: 0.25 }}
                        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                      >
                        <Package
                          className="h-4 w-4 transition-colors duration-200"
                          style={{ color: isHovered || isSelected ? "#fff" : "hsl(28 100% 55%)" }}
                        />
                      </motion.div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-semibold text-foreground">{p.fromLocation}</span>
                          <motion.div
                            animate={{ x: isHovered ? [0, 4, 0] : 0 }}
                            transition={{ repeat: isHovered ? Infinity : 0, duration: 0.8 }}
                          >
                            <ArrowRight className="h-3.5 w-3.5 text-secondary" />
                          </motion.div>
                          <span className="font-heading font-semibold text-foreground">{p.toLocation}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-secondary/70" />
                            To: {p.receiverName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="h-3 w-3 text-secondary/70" />
                            {p.weight}kg
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-secondary/70" />
                            {p.itemCount} items
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {p.vehicleType && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                              {p.vehicleType === 'bike' && <Bike className="h-3 w-3" />}
                              {p.vehicleType === 'car' && <Car className="h-3 w-3" />}
                              {p.vehicleType === 'van' && <Truck className="h-3 w-3" />}
                              {p.vehicleType === 'bus' && <Bus className="h-3 w-3" />}
                              {p.vehicleType}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Box className="h-3 w-3" /> {p.size}
                          </span>
                        </div>
                        {p.travellerName && (
                          <p className="mt-2 text-xs font-medium text-secondary">
                            ✦ Traveller: {p.travellerName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: badge + actions */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.paymentStatus === 'paid' ? 'bg-success/15 text-success' : 'bg-red-500/15 text-red-500'
                          }`}>
                          {p.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.status === "requested" && (
                          <motion.button
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.93 }}
                            className="flex items-center gap-1 rounded-full border border-green-500/40 px-3 py-1 text-xs font-semibold text-green-600 transition-colors hover:bg-green-500 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }}
                          >
                            <Check className="h-3 w-3" /> Accept
                          </motion.button>
                        )}

                        {p.status === "received" && p.paymentStatus === "unpaid" && (
                          <motion.button
                            whileHover={{ scale: 1.07 }}
                            whileTap={{ scale: 0.93 }}
                            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white shadow-lg shadow-secondary/20 transition-all"
                            onClick={(e) => { e.stopPropagation(); setShowScanner(p.id); }}
                          >
                            <QrCode className="h-3 w-3" /> Pay Now
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.1, color: "#ef4444" }}
                          whileTap={{ scale: 0.9 }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded map */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className="mb-2 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Payment Detail</p>
                            <div className="flex items-center gap-2">
                              {p.paymentMethod === 'pay-now' ? <Check className="h-4 w-4 text-success" /> : <Smartphone className="h-4 w-4 text-indigo-500" />}
                              <p className="text-sm font-semibold text-foreground">
                                {p.paymentMethod === 'pay-now' ? 'Prepaid (Paid)' : 'Pay on Delivery'}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Items & Size</p>
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-secondary" />
                              <p className="text-sm font-semibold text-foreground">{p.itemCount} Units · {p.size}</p>
                            </div>
                          </div>
                        </div>
                        {p.description && (
                          <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>
                        )}
                        <RouteMap from={p.fromLocation} to={p.toLocation} animate={p.status === "in-transit"} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Payment Scanner (Manual) ── */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[2.5rem] bg-[#1a1a1a] p-8 shadow-2xl border border-white/5"
            >
              <button
                onClick={() => setShowScanner(null)}
                className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Complete Payment</h2>
                <p className="mt-1 text-sm text-white/40">Receiver has confirmed the delivery</p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4">
                <div className="relative aspect-square w-full rounded-2xl bg-[#222] p-8">
                  {/* Floating scanner elements */}
                  <div className="absolute inset-0 border-[2px] border-indigo-500/20 rounded-2xl" />
                  <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 opacity-20">
                    <QrCode className="h-full w-full text-white" />
                  </div>

                  {/* Scanner focus corners */}
                  <div className="absolute left-4 top-4 h-10 w-10 border-l-[3px] border-t-[3px] border-indigo-500" />
                  <div className="absolute right-4 top-4 h-10 w-10 border-r-[3px] border-t-[3px] border-indigo-500" />
                  <div className="absolute bottom-4 left-4 h-10 w-10 border-b-[3px] border-l-[3px] border-indigo-500" />
                  <div className="absolute bottom-4 right-4 h-10 w-10 border-b-[3px] border-r-[3px] border-indigo-500" />

                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 h-1 w-full bg-indigo-500 shadow-[0_0_20px_#6366f1]"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Total Bill</p>
                    <p className="text-xl font-bold text-white">₹{(parcels.find(p => p.id === showScanner)?.weight || 0) * 50 + 20}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                    <ExternalLink className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <Button
                  onClick={() => handleManualPayment(showScanner)}
                  className="h-14 w-full rounded-2xl bg-indigo-600 text-lg font-bold text-white hover:bg-indigo-500 shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all"
                >
                  Confirm Receipt & Pay
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
