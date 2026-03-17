import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, Check, Trash2, MapPin, Weight, ArrowRight, Sparkles, Box, Bike, Bus, Car, Truck, Info, Layers, CreditCard, QrCode, Smartphone, ExternalLink, X, KeyRound, Navigation, Bell, CheckCircle2, Camera, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import RouteMap from "@/components/RouteMap";
import RouteMap3D from "@/components/RouteMap3D";
import {
  createParcel, getAllParcels, updateParcelStatus, deleteParcel,
  updateParcelPayment, acceptRequest, releaseParcelPayment, type Parcel
} from "@/lib/parcelStore";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabaseClient";
import UserProfileModal from "@/components/UserProfileModal";
import { UserData } from "@/lib/parcelStore";

export default function Sender() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [detailModal, setDetailModal] = useState<Parcel | null>(null);
  const [trackingModal, setTrackingModal] = useState<Parcel | null>(null); // auto-opens on transit
  const [latestCreated, setLatestCreated] = useState<Parcel | null>(null); // auto-opens after creation
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "inTransit" | "delivered">("all");
  const [profileUser, setProfileUser] = useState<UserData | null>(null);

  // New form fields
  const [weight, setWeight] = useState("");
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'very-large'>("small");
  const [itemCount, setItemCount] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'pay-now' | 'pay-on-delivery'>('pay-now');
  const [parcelPhoto, setParcelPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Could not access camera");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `parcel-${Date.now()}.jpg`, { type: "image/jpeg" });
            setParcelPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
            stopCamera();
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Checkout/Payment states
  const [checkoutParcel, setCheckoutParcel] = useState<Omit<Parcel, 'id' | 'status' | 'createdAt'> | null>(null);
  const [showScanner, setShowScanner] = useState<string | null>(null); // parcel id for scanning

  const refresh = async () => {
    try {
      const data = await getAllParcels();
      setParcels(data);
    } catch (err) {
      console.error("Failed to load parcels:", err);
    }
  };

  // Request browser notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Supabase Realtime for Parcel Status Updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('sender-parcels')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parcels',
          filter: `sender_id=eq.${user.id}`,
        },
        async (payload) => {
          const oldParcel = payload.old;
          const newParcel = payload.new;

          // Someone requested your parcel
          if (oldParcel.status === 'pending' && newParcel.status === 'requested') {
            toast.info(`📦 ${newParcel.traveller_name || 'A traveller'} requested your parcel! Go accept it.`, { duration: 7000 });
            sendBrowserNotification('CarryGo – New Request! 🚚', `${newParcel.traveller_name || 'A traveller'} wants to carry your parcel.`);
            refresh();
          }

          // Traveller started transit
          if (oldParcel.status !== 'in-transit' && newParcel.status === 'in-transit') {
            await refresh();
            const fresh = await getAllParcels();
            const updated = fresh.find(p => p.id === newParcel.id);
            if (updated) setTrackingModal(updated);
            toast.success(`🚚 Traveller has picked up and started transit!`, { duration: 6000 });
            sendBrowserNotification('CarryGo – Transit Started! 🚚', 'Your parcel is now in transit. Tracking is live!');
          }

          // Parcel delivered
          if (oldParcel.status !== 'delivered' && newParcel.status === 'delivered') {
            await refresh();
            toast.success('🎉 Your parcel has been delivered!');
            sendBrowserNotification('CarryGo – Delivered! 📦', 'Your parcel has been successfully delivered.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, sendBrowserNotification]);

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parcelData = {
      senderName: user?.name || "Me",
      receiverName: fd.get("receiverName") as string,
      receiverPhone: `+91${fd.get("receiverPhone")}`,
      fromLocation: fd.get("fromLocation") as string,
      toLocation: fd.get("toLocation") as string,
      weight: parseFloat(weight) || 0,
      size: size,
      itemCount: itemCount,
      vehicleType: selectedVehicle,
      paymentMethod: paymentMethod,
      paymentStatus: 'unpaid' as const,
      description: fd.get("description") as string,
      senderId: user?.id || "",
    };

    if (paymentMethod === 'pay-now') {
      setCheckoutParcel(parcelData);
    } else {
      setLoading(true);
      try {
        const resp = await createParcel(parcelData, parcelPhoto || undefined);
        toast.success("Parcel created with Pay on Delivery!");
        setLatestCreated(resp);
        resetForm();
      } catch (err: any) {
        toast.error("Failed to create parcel: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const finalizePayment = async () => {
    if (checkoutParcel) {
      setLoading(true);
      try {
        const resp = await createParcel({
          ...checkoutParcel,
          paymentStatus: 'paid'
        }, parcelPhoto || undefined);
        toast.success("Payment successful! Parcel created.");
        setLatestCreated(resp);
        resetForm();
      } catch (err: any) {
        toast.error("Payment successful but parcel creation failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReleasePayment = async (id: string) => {
    try {
      await releaseParcelPayment(id);
      toast.success("Payout released to Traveller! Transaction complete.");
      refresh();
    } catch (err) {
      toast.error("Failed to release payout");
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
    setParcelPhoto(null);
    setPhotoPreview(null);
    stopCamera();
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
    const result = await updateParcelStatus(id, "accepted");
    toast.success("Traveller request accepted! Share the OTP with them.");
    await refresh();
    // Re-fetch the fresh parcel with OTP from backend list
    const fresh = await getAllParcels();
    const updated = fresh.find(p => p.id === id);
    if (updated) setDetailModal(updated);
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
    pending: parcels.filter(p => {
      const s = p.status?.toLowerCase();
      return s === "pending" || s === "requested" || s === "accepted";
    }).length,
    inTransit: parcels.filter(p => {
      const s = p.status?.toLowerCase();
      return s === "in-transit" || s === "picked-up";
    }).length,
    delivered: parcels.filter(p => {
      const s = p.status?.toLowerCase();
      return s === "delivered" || s === "received" || s === "completed";
    }).length,
  };

  const filteredParcels = parcels.filter(p => {
    const status = p.status?.toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'pending') return status === 'pending' || status === 'requested' || status === 'accepted';
    if (filter === 'inTransit') return status === 'in-transit' || status === 'picked-up';
    if (filter === 'delivered') return status === 'delivered' || status === 'received' || status === 'completed';
    return true;
  });

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
            { id: "all", label: "Total", value: statusCounts.total, color: "hsl(28 100% 55%)" },
            { id: "pending", label: "Pending", value: statusCounts.pending, color: "#f59e0b" },
            { id: "inTransit", label: "In Transit", value: statusCounts.inTransit, color: "#60a5fa" },
            { id: "delivered", label: "Delivered", value: statusCounts.delivered, color: "#34d399" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => {
                const newFilter = s.id as typeof filter;
                setFilter(newFilter);

                // Auto-expand the first matched parcel
                const matched = parcels.filter(p => {
                  const status = p.status?.toLowerCase();
                  if (newFilter === 'all') return true;
                  if (newFilter === 'pending') return status === 'pending' || status === 'requested' || status === 'accepted';
                  if (newFilter === 'inTransit') return status === 'in-transit' || status === 'picked-up';
                  if (newFilter === 'delivered') return status === 'delivered' || status === 'received' || status === 'completed';
                  return true;
                });
                if (matched.length > 0) setSelected(matched[0]);
                else setSelected(null);
              }}
              className={`rounded-xl p-3 text-center transition-all cursor-pointer border ${filter === s.id ? 'bg-white/10 ring-2 ring-secondary/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              style={{ borderColor: filter === s.id ? s.color : 'rgba(255,255,255,0.08)' }}
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
                <div className="mt-1 flex gap-0 overflow-hidden rounded-md border border-border transition-all focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                  <div className="flex items-center justify-center bg-muted px-3 text-sm font-bold text-muted-foreground border-r border-border">
                    +91
                  </div>
                  <Input
                    id="receiverPhone"
                    name="receiverPhone"
                    required
                    placeholder="10-digit number"
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    }}
                    className="border-0 bg-background transition-all focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
              <div className="group">
                <Label htmlFor="fromLocation" className="text-sm font-medium text-foreground/80">From</Label>
                <Input
                  id="fromLocation"
                  name="fromLocation"
                  required
                  placeholder="Mumbai"
                  className="mt-1 border-border transition-all focus:border-secondary focus:ring-secondary/20"
                />
              </div>
              <div className="group">
                <Label htmlFor="toLocation" className="text-sm font-medium text-foreground/80">To</Label>
                <Input
                  id="toLocation"
                  name="toLocation"
                  required
                  placeholder="Delhi"
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
                  <Select value={size} onValueChange={(v) => setSize(v as 'small' | 'medium' | 'large' | 'very-large')}>
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

              {/* Parcel Photo Section (Camera Capture) */}
              <div className="group sm:col-span-2">
                <Label className="mb-3 block text-sm font-semibold text-foreground">Parcel Photo (Live Capture)</Label>
                <div className="flex flex-col items-center gap-4">
                  {isCameraOpen ? (
                    <div className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="h-64 w-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                        <Button
                          type="button"
                          onClick={capturePhoto}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-white shadow-lg shadow-secondary/30 hover:bg-secondary/90"
                        >
                          <Camera className="h-6 w-6" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={stopCamera}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70"
                        >
                          <X className="h-6 w-6" />
                        </Button>
                      </div>
                      <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                        LIVE CAMERA
                      </div>
                    </div>
                  ) : photoPreview ? (
                    <div className="relative w-full overflow-hidden rounded-2xl border border-secondary/30 bg-muted/30 shadow-inner">
                      <img src={photoPreview} alt="Parcel Captured" className="h-64 w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-secondary shadow-lg backdrop-blur-sm hover:bg-white"
                        >
                          <RefreshCw className="h-4 w-4" /> Retake Photo
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setParcelPhoto(null); setPhotoPreview(null); }}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary/5 py-12 transition-all hover:bg-secondary/10"
                    >
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary transition-transform group-hover:scale-110">
                        <Camera className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold text-foreground">Open Camera to capture parcel photo</p>
                      <p className="mt-1 text-xs text-muted-foreground">This helps the traveller identify your parcel</p>
                    </button>
                  )}
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
                whileHover={!loading ? { scale: 1.03 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
                type="submit"
                disabled={loading}
                className={`rounded-full px-8 py-2.5 text-sm font-bold text-white shadow-xl flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{ background: paymentMethod === 'pay-now' ? "linear-gradient(135deg, hsl(28 100% 55%), hsl(20 100% 45%))" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  paymentMethod === 'pay-now' ? 'Proceed to Payment' : 'Create Parcel'
                )}
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
                    disabled={loading}
                    className="h-12 w-full bg-secondary font-bold text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating Parcel...
                      </>
                    ) : (
                      'Confirm Payment'
                    )}
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


      {/* ── Active Requests Alerts ── */}
      <div className="mb-6 flex flex-col gap-3">
        {/* Pending Requests */}
        {parcels.filter(p => p.status === 'requested').map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-xl shadow-secondary/5 gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-white">
                <Truck className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 block h-3 w-3 animate-ping rounded-full bg-secondary opacity-75" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Delivery Request from {p.travellerName || "a Traveller"}!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  They want to carry your parcel from <span className="font-semibold text-foreground">{p.fromLocation}</span> to <span className="font-semibold text-foreground">{p.toLocation}</span>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-secondary text-secondary hover:bg-secondary hover:text-white font-semibold"
                onClick={() => setSelected(p)}
              >
                View Details
              </Button>
              <Button
                size="sm"
                className="bg-secondary text-white hover:bg-secondary/90 shadow-md shadow-secondary/20 font-semibold flex items-center gap-1"
                onClick={() => handleAccept(p.id)}
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
            </div>
          </motion.div>
        ))}

        {/* Ready for Pickup - OTP Sharing */}
        {parcels.filter(p => p.status === 'accepted').map((p) => (
          <motion.div
            key={`otp-${p.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-2xl border-2 border-secondary/30 bg-card p-4 shadow-xl shadow-secondary/5"
          >
            {/* Animated background glow */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-secondary/20 blur-2xl"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
                  <Truck className="h-6 w-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Ready for Pickup! 🚚</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">{p.travellerName || "A traveller"} is coming to collect your parcel</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <p className="text-[10px] font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest">Verified & Assigned</p>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 text-xs font-bold text-muted-foreground hover:text-secondary hover:bg-secondary/10 px-4 rounded-xl border border-transparent hover:border-secondary/20"
                  onClick={async () => {
                    const fresh = await getAllParcels();
                    const updated = fresh.find(fp => fp.id === p.id);
                    setDetailModal(updated || p);
                  }}
                >
                  Details
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
        <>
          {/* ── Global Logistics Command Center (Only Visible during Transit) ── */}
          <AnimatePresence mode="wait">
            {parcels.some(p => p.status === 'in-transit') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0d1117] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/20 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                      <Navigation className="h-5 w-5 text-secondary animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Global Command Center</h2>
                      <p className="text-[10px] font-bold text-white/40">Status: 🔴 LIVE SHIPMENT TRACKING</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase">Uptime</p>
                        <p className="text-[10px] font-bold text-secondary">99.9%</p>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div>
                        <p className="text-[9px] font-black text-white/30 uppercase">Network</p>
                        <p className="text-[10px] font-bold text-green-400">Stable</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full px-3 py-1 bg-secondary/10 border border-secondary/20">
                      <span className="h-2 w-2 rounded-full bg-secondary animate-ping" />
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter">System Active</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {(() => {
                    const active = parcels.find(p => p.status === 'in-transit');
                    return active ? (
                      <div className="h-[400px] w-full relative">
                        <RouteMap3D
                          from={active.fromLocation}
                          to={active.toLocation}
                          animate={true}
                        />

                        {/* 3D HUD Indicators */}
                        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                          <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                            <p className="text-[9px] font-black text-secondary uppercase mb-1">Signal Strength</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-3 w-1 rounded-sm ${i <= 4 ? 'bg-secondary' : 'bg-white/20'}`} />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          /* ── Parcel cards ── */
          <motion.div
            className="grid gap-4"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {filteredParcels.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center opacity-80">
                <Box className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">No {filter !== 'all' ? filter : ''} parcels found.</p>
              </div>
            ) : filteredParcels.map((p) => {
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
                              <Truck className="h-3 w-3 text-secondary/70" />
                              Traveller: {p.travellerName || "Pending"}
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
                          {p.travellerPhone && (
                            <p className="mt-2 text-[10px] font-medium text-secondary">
                              📞 {p.travellerPhone}
                            </p>
                          )}
                          {p.status === 'accepted' && (
                            <div className="mt-3 flex items-center justify-between rounded-xl border border-secondary/20 bg-secondary/5 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <KeyRound className="h-3.5 w-3.5 text-secondary" />
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">Assigned Traveller is arriving soon.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: badge + actions */}
                      <div className="flex flex-shrink-0 flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={p.status} />
                          <span className={`rounded - full px - 2 py - 0.5 text - [10px] font - bold uppercase ${p.paymentStatus === 'paid' ? 'bg-success/15 text-success' : 'bg-red-500/15 text-red-500'
                            } `}>
                            {p.paymentStatus === 'paid'
                              ? (p.paymentReleased ? 'Payout Released' : 'Held in Escrow')
                              : 'Unpaid'}
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

                          {(p.status === "accepted" || p.status === "picked-up" || p.status === "in-transit" || p.status === "delivered" || p.status === "received") && p.paymentStatus === "unpaid" && (
                            <motion.button
                              whileHover={{ scale: 1.07 }}
                              whileTap={{ scale: 0.93 }}
                              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-white shadow-lg shadow-secondary/20 transition-all"
                              onClick={(e) => { e.stopPropagation(); setShowScanner(p.id); }}
                            >
                              <QrCode className="h-3 w-3" /> Pay Website
                            </motion.button>
                          )}

                          {p.status === "delivered" && p.paymentStatus === "paid" && !p.paymentReleased && (
                            <motion.button
                              whileHover={{ scale: 1.07 }}
                              whileTap={{ scale: 0.93 }}
                              className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-green-600/20 transition-all"
                              onClick={(e) => { e.stopPropagation(); handleReleasePayment(p.id); }}
                            >
                              <CheckCircle2 className="h-3 w-3" /> Release Payout
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
                          <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
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
                            {p.travellerName && (
                              <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Traveller Info</p>
                                <div className="flex flex-col">
                                  <p className="text-sm font-semibold text-foreground">{p.travellerName}</p>
                                  {p.travellerPhone && <p className="text-xs font-semibold text-muted-foreground mt-0.5">📞 {p.travellerPhone}</p>}
                                </div>
                              </div>
                            )}
                          </div>

                          {p.status === 'accepted' && p.pickupOtp && (
                            <div className="mb-4 rounded-xl border-2 border-indigo-500/20 bg-indigo-500/5 p-4 text-center">
                              <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">Share this OTP with Traveller</p>
                              <p className="text-4xl font-black text-indigo-600 tracking-[0.3em] font-mono">{p.pickupOtp}</p>
                            </div>
                          )}
                          {p.description && (
                            <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>
                          )}
                          {p.parcelPhoto && (
                            <div className="mb-4 overflow-hidden rounded-xl border border-secondary/20">
                              <img
                                src={`http://localhost:5000/${p.parcelPhoto}`}
                                alt="Parcel"
                                className="h-48 w-full object-cover"
                              />
                            </div>
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
        </>
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

      {/* ── Traveller Detail Modal ── */}
      <AnimatePresence>
        {detailModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={() => setDetailModal(null)}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card border border-secondary/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-secondary/90 to-secondary p-6 text-white">
                <motion.div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} />
                <button onClick={() => setDetailModal(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 hover:bg-white/20">
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/20 shadow-inner">
                    {detailModal.travellerPhoto ? (
                      <img
                        src={`http://localhost:5000/${detailModal.travellerPhoto}`}
                        alt="Traveller"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Truck className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">Assigned Traveller</p>
                    <h2 className="text-xl font-bold">{detailModal.travellerName || "Traveller"}</h2>
                    {detailModal.travellerPhone && (
                      <a href={`tel:${detailModal.travellerPhone} `} className="mt-1 flex items-center gap-1.5 text-sm opacity-80 hover:opacity-100">
                        <span>📞</span> {detailModal.travellerPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-6 space-y-4">

                {/* Parcel Route */}
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parcel Route</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-bold text-foreground">{detailModal.fromLocation}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-secondary shrink-0" />
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="font-bold text-foreground">{detailModal.toLocation}</p>
                    </div>
                  </div>
                </div>

                {/* OTP Box */}
                {detailModal.pickupOtp && (
                  <div className="rounded-2xl border-2 border-indigo-400/30 bg-indigo-500/5 p-5 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">🔐 Share OTP with Traveller to Confirm Pickup</p>
                    <motion.p
                      className="text-5xl font-black text-indigo-600 tracking-[0.4em] font-mono"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {detailModal.pickupOtp}
                    </motion.p>
                    <p className="mt-2 text-[10px] text-indigo-400/70 font-medium">Only share this with your assigned traveller</p>
                  </div>
                )}

                {/* Traveller Info & Documents */}
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground underline decoration-secondary decoration-2 underline-offset-4">Full Identity Verification</p>
                  
                  <div className="space-y-4">
                    {/* Basic Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-background/50 p-2 border border-border/40">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Name</p>
                        <p className="text-sm font-bold text-foreground truncate">{detailModal.travellerName || "—"}</p>
                      </div>
                      <div className="rounded-xl bg-background/50 p-2 border border-border/40">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Aadhar Number</p>
                        <p className="text-sm font-bold text-indigo-500">{detailModal.travellerAdharNumber || "—"}</p>
                      </div>
                    </div>

                    {/* Photos Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original Photo */}
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase text-muted-foreground">Original Photo</p>
                        <div className="overflow-hidden rounded-xl border-2 border-secondary/20 aspect-square bg-white/5">
                          {detailModal.travellerPhoto ? (
                            <img 
                              src={`http://localhost:5000/${detailModal.travellerPhoto}`} 
                              alt="Traveller" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20"><Package className="h-8 w-8" /></div>
                          )}
                        </div>
                      </div>

                      {/* Aadhar Photo */}
                      <div>
                        <p className="mb-1 text-[9px] font-bold uppercase text-muted-foreground">Aadhar Card</p>
                        <div className="overflow-hidden rounded-xl border-2 border-secondary/20 aspect-square bg-white/5">
                          {detailModal.travellerAdharPhoto ? (
                            <img 
                              src={`http://localhost:5000/${detailModal.travellerAdharPhoto}`} 
                              alt="Aadhar" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/20"><QrCode className="h-8 w-8" /></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Live Tracking Modal (auto-opens on transit start) ── */}
      <AnimatePresence>
        {trackingModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={() => setTrackingModal(null)}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card border border-secondary/20 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
                <motion.div
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <button onClick={() => setTrackingModal(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 hover:bg-white/20">
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
                    <Navigation className="h-7 w-7 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-70">🔴 Live Tracking</p>
                    <h2 className="text-xl font-bold">Parcel In Transit!</h2>
                    <p className="text-sm opacity-80">{trackingModal.fromLocation} → {trackingModal.toLocation}</p>
                  </div>
                </div>
              </div>

              {/* Route Map */}
              <div className="px-6 pt-5">
                <RouteMap from={trackingModal.fromLocation} to={trackingModal.toLocation} animate={true} />
              </div>

              {/* Order Details Grid */}
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Traveller</p>
                    <p className="font-bold text-sm text-foreground">{trackingModal.travellerName || "—"}</p>
                    {trackingModal.travellerPhone && (
                      <a href={`tel:${trackingModal.travellerPhone} `} className="text-xs text-secondary hover:underline">📞 {trackingModal.travellerPhone}</a>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Receiver</p>
                    <p className="font-bold text-sm text-foreground">{trackingModal.receiverName}</p>
                    <p className="text-xs text-muted-foreground">{trackingModal.receiverPhone}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Weight</p>
                    <p className="font-bold text-sm text-foreground">{trackingModal.weight} kg</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-bold text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      In Transit
                    </span>
                  </div>
                </div>

                {trackingModal.description && (
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground">{trackingModal.description}</p>
                  </div>
                )}
                {trackingModal.parcelPhoto && (
                  <div className="overflow-hidden rounded-2xl border border-secondary/20 bg-muted/30">
                    <img
                      src={`http://localhost:5000/${trackingModal.parcelPhoto}`}
                      alt="Parcel"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Order Success Modal (auto-opens after creation) ── */}
      <AnimatePresence>
        {latestCreated && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl" onClick={() => setLatestCreated(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-card border border-border shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-indigo-500" />

              <div className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10">
                  <Package className="h-10 w-10 text-secondary" />
                </div>

                <h2 className="text-2xl font-bold font-heading text-foreground mb-2">Order Confirmed!</h2>
                <p className="text-muted-foreground mb-8">Your parcel has been listed and is ready for travellers to pick up.</p>

                <div className="space-y-4 text-left mb-8">
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Route</span>
                    <span className="font-bold text-sm text-foreground">{latestCreated.fromLocation} → {latestCreated.toLocation}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Parcel Price</span>
                    <span className="font-bold text-secondary">₹{latestCreated.weight * 50 + 20}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Traveller</span>
                    <span className="font-bold text-sm text-foreground">{latestCreated.travellerName || "Assigning..."}</span>
                  </div>
                  {latestCreated.parcelPhoto && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-secondary/20">
                      <img
                        src={`http://localhost:5000/${latestCreated.parcelPhoto}`}
                        alt="Parcel"
                        className="h-32 w-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setLatestCreated(null)}
                  className="w-full h-14 rounded-2xl bg-secondary text-white font-bold text-lg hover:scale-[1.02] transition-transform"
                >
                  Awesome, Got it!
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <UserProfileModal 
        user={profileUser} 
        isOpen={!!profileUser} 
        onClose={() => setProfileUser(null)} 
      />
    </div>
  );
}
