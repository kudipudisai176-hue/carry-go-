import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Truck, Package, ArrowRight, Bike, Bus, Car, Box, Layers, Weight,
  Phone, User, MapPin, CheckCircle2, Navigation, ChevronDown, ChevronUp,
  PackageCheck, Info, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import RouteMap3D from "@/components/RouteMap3D";
import {
  searchParcels, updateParcelStatus,
  requestParcel, getMyDeliveries, type Parcel, type UserData
} from "@/lib/parcelStore";
import UserProfileModal from "@/components/UserProfileModal";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
// Supabase import removed
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

export default function Traveller() {
  const { user } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<Parcel[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Parcel[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deliveries" | "search">("deliveries");
  const [profileUser, setProfileUser] = useState<UserData | null>(null);

  const [isConfirming, setIsConfirming] = useState(false);
  const [pickupOtp, setPickupOtp] = useState("");
  const [trackingParcel, setTrackingParcel] = useState<Parcel | null>(null); // auto-opens after OTP

  // Navigation map state: shows full-screen map after OTP confirmed
  const [navParcel, setNavParcel] = useState<Parcel | null>(null);

  // Dedicated detail view for accepted/processing parcels
  const [detailParcel, setDetailParcel] = useState<Parcel | null>(null);

  // Request browser notification permission
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

  const loadMyDeliveries = useCallback(async () => {
    try {
      const data = await getMyDeliveries();
      setMyDeliveries(data);
    } catch {
      // silently fail - traveller may not have deliveries yet
    }
  }, []);

  const handleSearch = useCallback(async () => {
    try {
      const data = await searchParcels(from, to);
      setResults(data);
    } catch {
      toast.error("Search failed");
    }
  }, [from, to]);

  const handleStartTransit = useCallback(async (id: string, parcel: Parcel, autoOtp?: string) => {
    const finalOtp = autoOtp || pickupOtp;
    if (!finalOtp || finalOtp.length !== 4) {
      toast.error("Please enter the 4-digit OTP provided by the Sender");
      return;
    }
    setIsConfirming(true);
    try {
      const res = await updateParcelStatus(id, "in-transit", undefined, finalOtp);
      if (res) {
        toast.success("🚀 Transit started! Tracking is now live for all parties.", { duration: 5000 });
        sendBrowserNotification('CarryGo – Transit Started! 🚚', `Parcel ${res.description?.slice(0, 20) || 'package'} is now in transit.`);
        setNavParcel(res);
        setDetailParcel(res);
        setTrackingParcel(res);
        setPickupOtp("");
        await loadMyDeliveries();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || err.message || "Failed to start journey");
      } else {
        toast.error("Failed to start journey");
      }
    } finally {
      setIsConfirming(false);
    }
  }, [pickupOtp, sendBrowserNotification, loadMyDeliveries]);

  // Polling for updates (Simulating real-time)
  useEffect(() => {
    if (!user?.id) return;

    let previousMyDeliveries: Parcel[] = [];

    const checkUpdates = async () => {
      try {
        const deliveries = await getMyDeliveries();
        
        // Notify of changes (Simplified diffing)
        deliveries.forEach(async (newParcel) => {
          const oldParcel = previousMyDeliveries.find(p => p.id === newParcel.id);
          
          if (oldParcel) {
            // Sender accepted the request
            if (oldParcel.status === 'requested' && newParcel.status === 'accepted') {
              toast.success(`✅ Sender accepted your request! Starting journey...`, { duration: 6000 });
              sendBrowserNotification('CarryGo – Request Accepted! 🎉', `Your request for parcel has been accepted. Starting transit.`);
              
              setDetailParcel(newParcel);
              // Auto-start transit if OTP is available or simple flow
              if (newParcel.pickupOtp) {
                await handleStartTransit(newParcel.id, newParcel, newParcel.pickupOtp);
              }
            }

            // Parcel delivered
            if (oldParcel.status !== 'delivered' && newParcel.status === 'delivered') {
              toast.success('📦 Delivery confirmed! Great job!');
              sendBrowserNotification('CarryGo – Delivery Complete! 🎉', 'You have successfully delivered the parcel.');
            }
          }
        });

        setMyDeliveries(deliveries);
        previousMyDeliveries = deliveries;
      } catch (err) {
        console.error("Polling failed:", err);
      }
    };

    const interval = setInterval(checkUpdates, 5000);
    checkUpdates(); // Initial check

    return () => clearInterval(interval);
  }, [user?.id, sendBrowserNotification, handleStartTransit]);

  const handleRequest = async (id: string) => {
    if (!user) return;
    try {
      await requestParcel(id, user.name);
      toast.success("Request sent! Waiting for Sender to approve.");
      handleSearch();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || err.message || "Failed to send request");
      } else {
        toast.error("Failed to send request");
      }
    }
  };

  const handleDeliver = async (id: string, parcel: Parcel) => {
    setIsConfirming(true);
    try {
      const res = await updateParcelStatus(id, "delivered");
      if (res) {
        toast.success("Delivery confirmed! Great job 🎉");
        setNavParcel(null);
        setDetailParcel(res);
        await loadMyDeliveries();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || err.message || "Failed to confirm delivery");
      } else {
        toast.error("Failed to confirm delivery");
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">

      {/* ── Header ── */}
      {!detailParcel && (
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground">Traveller Dashboard</h1>
          <p className="text-muted-foreground">Manage your deliveries and find new parcels</p>
        </div>
      )}

      {/* ── Navigation Map (after OTP verified) ── */}
      <AnimatePresence>
        {navParcel && !detailParcel && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 overflow-hidden rounded-2xl border-2 border-secondary/30 bg-card shadow-xl shadow-secondary/10"
          >
            <div className="flex items-center justify-between bg-secondary/10 px-5 py-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-secondary" />
                <span className="font-bold text-foreground">Navigation Active</span>
                <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary font-medium">
                  {navParcel.fromLocation} → {navParcel.toLocation}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setNavParcel(null)} className="text-xs">
                Close Map
              </Button>
            </div>
            <div className="p-4">
              <RouteMap3D from={navParcel.fromLocation} to={navParcel.toLocation} animate={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail View Page ── */}
      <AnimatePresence mode="wait">
        {detailParcel ? (
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setDetailParcel(null)}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-4 w-4 rotate-180" /> Back to List
              </Button>
              <StatusBadge status={detailParcel.status} />
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <div className="bg-secondary/10 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-white">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground font-heading">Parcel: {detailParcel.description.slice(0, 30) || "Package Info"}</h2>
                    <p className="text-xs text-muted-foreground">ID: {detailParcel.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Locations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Pickup Location</p>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                      <p className="text-lg font-semibold leading-tight">{detailParcel.fromLocation}</p>
                    </div>
                  </div>

                  <div className="space-y-2 md:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Delivery Location</p>
                    <div className="flex items-start gap-3 md:flex-row-reverse">
                      <MapPin className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-lg font-semibold leading-tight">{detailParcel.toLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Weight</p>
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-secondary/70" />
                      <span className="font-bold">{detailParcel.weight} kg</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Size</p>
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-secondary/70" />
                      <span className="font-bold capitalize">{detailParcel.size}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Items</p>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-secondary/70" />
                      <span className="font-bold">{detailParcel.itemCount} Units</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Payout</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${detailParcel.paymentStatus === 'paid'
                        ? (detailParcel.paymentReleased ? 'bg-success/15 text-success' : 'bg-blue-500/15 text-blue-500')
                        : 'bg-red-500/15 text-red-500'
                        }`}>
                        {detailParcel.paymentStatus === 'paid'
                          ? (detailParcel.paymentReleased ? 'Funds Released' : 'Held in Escrow')
                          : 'Waiting for Payment'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* People */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="rounded-2xl bg-muted/30 p-5 border border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Sender Information</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{detailParcel.senderName}</p>
                        <a href={`tel:${detailParcel.senderPhone}`} className="flex items-center gap-1.5 text-sm text-secondary hover:underline">
                          <Phone className="h-3 w-3" /> {detailParcel.senderPhone || "Phone not provided"}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/30 p-5 border border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Receiver Information</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{detailParcel.receiverName}</p>
                        <a href={`tel:${detailParcel.receiverPhone}`} className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline">
                          <Phone className="h-3 w-3" /> {detailParcel.receiverPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Section (Only for Pickup) */}
                {detailParcel.status === 'accepted' && (
                  <div className="rounded-3xl border-2 border-secondary/30 bg-secondary/5 p-8 text-center space-y-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20 mb-2">
                      <Truck className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Confirm Pickup</h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                        Enter the secure 4-digit OTP from <strong>{detailParcel.senderName}</strong> (Hint: 1234) to confirm pickup.
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <Input
                        value={pickupOtp}
                        onChange={(e) => setPickupOtp(e.target.value)}
                        placeholder="Enter 4-Digit OTP"
                        maxLength={4}
                        className="max-w-[150px] text-center text-lg font-bold tracking-[0.3em] font-mono h-12 rounded-xl"
                      />
                      <Button
                        size="lg"
                        className="w-full max-w-xs bg-secondary text-white font-bold h-14 rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-transform"
                        onClick={() => handleStartTransit(detailParcel.id, detailParcel)}
                        disabled={isConfirming || pickupOtp.length !== 4}
                      >
                        {isConfirming ? "Confirming..." : "Verify & Start Journey"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* In-Transit Map Inline */}
                {detailParcel.status === 'in-transit' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-secondary" /> Navigation Active
                      </h3>
                      <Button size="sm" variant="outline" onClick={() => setNavParcel(detailParcel)}>Full Screen Map</Button>
                    </div>
                    <RouteMap3D from={detailParcel.fromLocation} to={detailParcel.toLocation} animate={true} />

                    <div className="rounded-3xl border-2 border-green-500/30 bg-green-500/5 p-8 text-center space-y-6">
                      <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Final Step</p>
                      <h3 className="text-xl font-bold">Arrived at Destination?</h3>
                      <p className="text-xs text-muted-foreground">Click below to confirm successful delivery to <strong>{detailParcel.receiverName}</strong>.</p>
                      <div className="flex flex-col items-center gap-4">
                        <Button
                          className="w-full max-w-xs bg-green-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-600/20"
                          onClick={() => handleDeliver(detailParcel.id, detailParcel)}
                          disabled={isConfirming}
                        >
                          {isConfirming ? "Confirming..." : "Confirm Delivery Complete"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* ── Wallet Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-3xl bg-indigo-600 p-6 text-white shadow-xl shadow-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Total Earnings</p>
                  <h2 className="mt-1 text-4xl font-black">₹{user?.walletBalance || 0}</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <PackageCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <p className="text-[10px] font-bold uppercase tracking-tighter text-indigo-100">Withdrawals process automatically weekly</p>
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1">
              <button
                onClick={() => setActiveTab("deliveries")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${activeTab === "deliveries"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <PackageCheck className="mr-1.5 inline h-4 w-4" />
                My Deliveries
                {myDeliveries.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-white">
                    {myDeliveries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${activeTab === "search"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Search className="mr-1.5 inline h-4 w-4" />
                Find Parcels
              </button>
            </div>


            {/* ══════════════════════════════════════════
          TAB 1: MY DELIVERIES
      ══════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              {activeTab === "deliveries" && (
                <motion.div key="deliveries" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {myDeliveries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                      <Truck className="mb-4 h-12 w-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground font-semibold">No active deliveries.</p>
                      <p className="mt-1 text-sm text-muted-foreground/70 max-w-xs mx-auto">
                        Once you request a parcel and the <strong>Sender accepts</strong>, it will appear here instantly.
                      </p>
                      <Button variant="outline" className="mt-6 border-secondary text-secondary hover:bg-secondary/10" onClick={() => setActiveTab("search")}>
                        Go Find Parcels
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {myDeliveries.map((p) => (
                        <motion.div
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-border bg-card shadow-md overflow-hidden cursor-pointer hover:border-secondary/30 transition-colors"
                          onClick={() => setDetailParcel(p)}
                        >
                          {/* Status bar */}
                          <div className="flex items-center justify-between bg-muted/40 px-4 py-2 border-b border-border">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={p.status} />
                              <span className="text-xs text-muted-foreground">
                                {p.fromLocation} → {p.toLocation}
                              </span>
                            </div>
                            <button
                              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {expanded === p.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>

                          {/* Parcel Details */}
                          <div className="p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              {/* Parcel Info */}
                              <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Parcel Info</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <Box className="h-4 w-4 text-secondary" />
                                  <span className="font-semibold text-foreground">{p.description || "Package"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Weight className="h-3 w-3" /> {p.weight}kg</span>
                                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {p.itemCount} items</span>
                                  <span className="capitalize">{p.size}</span>
                                </div>
                              </div>

                              {/* Receiver Info */}
                              <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Receiver</p>
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-blue-500" />
                                  <span className="font-semibold text-foreground">{p.receiverName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <a href={`tel:${p.receiverPhone}`} className="text-blue-500 underline-offset-2 hover:underline">
                                    {p.receiverPhone}
                                  </a>
                                </div>
                              </div>

                              {/* Sender Info */}
                              <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Sender</p>
                                <button 
                                  className="flex items-center gap-2 text-sm hover:underline cursor-pointer text-left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (p.senderData) setProfileUser(p.senderData);
                                  }}
                                >
                                  <User className="h-4 w-4 text-orange-500" />
                                  <span className="font-semibold text-foreground">{p.senderName}</span>
                                </button>
                                {p.senderPhone && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <a href={`tel:${p.senderPhone}`} className="text-orange-500 underline-offset-2 hover:underline">
                                      {p.senderPhone}
                                    </a>
                                  </div>
                                )}
                              </div>

                              {/* Estimated Earning Info */}
                              <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Estimated Earning</p>
                                <div className="flex flex-col gap-1">
                                   <span className="text-sm font-bold text-green-600">₹{((p.weight * 50 + 20) / 2).toFixed(2)}</span>
                                   <p className="text-[9px] text-muted-foreground italic">Company pays 50% after delivery confirmation.</p>
                                </div>
                              </div>
                            </div>

                            {/* Inline Actions for Accepted (Pickup) */}
                            {p.status === "accepted" && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 rounded-xl border border-secondary/30 bg-secondary/5 p-4"
                              >
                                <div className="flex items-center gap-2 mb-3 text-secondary">
                                  <Truck className="h-4 w-4" />
                                  <span className="font-bold text-sm">Ready to Pick Up</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                  Confirm you have collected the parcel from <strong>{p.senderName}</strong> to start the delivery path.
                                </p>
                                <Button
                                  className="w-full bg-secondary text-white hover:bg-secondary/90 shadow-md"
                                  onClick={() => handleStartTransit(p.id, p)}
                                  disabled={isConfirming}
                                >
                                  <Navigation className="h-4 w-4 mr-2" /> Start Journey
                                </Button>
                              </motion.div>
                            )}

                            {/* Inline Actions for In-Transit (Delivery) */}
                            {p.status === "in-transit" && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 rounded-xl border border-green-500/30 bg-green-500/5 p-4"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2 text-green-600">
                                    <PackageCheck className="h-4 w-4" />
                                    <span className="font-bold text-sm">Complete Hand-off</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 border-green-600/50 text-green-700 hover:bg-green-50"
                                    onClick={() => setNavParcel(p)}
                                  >
                                    <Navigation className="h-4 w-4" /> View Map
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                  Once you hand the parcel to <strong>{p.receiverName}</strong>, click confirm to close the delivery.
                                </p>
                                <Button
                                  className="w-full bg-green-600 text-white hover:bg-green-700 shadow-md font-bold"
                                  onClick={() => handleDeliver(p.id, p)}
                                  disabled={isConfirming}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Delivery
                                </Button>
                              </motion.div>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {p.status === "delivered" && (
                                <span className="flex items-center gap-2 text-sm font-semibold text-green-600">
                                  <CheckCircle2 className="h-4 w-4" /> Delivered Successfully!
                                </span>
                              )}
                            </div>

                            {/* Expanded Route Map */}
                            <AnimatePresence>
                              {expanded === p.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 overflow-hidden"
                                >
                                  <RouteMap3D from={p.fromLocation} to={p.toLocation} animate={p.status === "in-transit"} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════════════════════════════════════
            TAB 2: FIND PARCELS
        ══════════════════════════════════════════ */}
              {activeTab === "search" && (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Search Bar */}
                  <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-md sm:flex-row sm:items-end">
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
                                  <button 
                                    className="text-orange-500 hover:underline cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (p.senderData) setProfileUser(p.senderData);
                                    }}
                                  >
                                    Sender: {p.senderName}
                                  </button>
                                  <span>To: {p.receiverName}</span>
                                </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {p.vehicleType && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                                    {p.vehicleType === "bike" && <Bike className="h-3 w-3" />}
                                    {p.vehicleType === "car" && <Car className="h-3 w-3" />}
                                    {p.vehicleType === "van" && <Truck className="h-3 w-3" />}
                                    {p.vehicleType === "bus" && <Bus className="h-3 w-3" />}
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
                                <Button
                                  size="sm"
                                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                  onClick={() => handleRequest(p.id)}
                                >
                                  Request
                                </Button>
                              )}
                              {p.status === "requested" && (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-1">
                                  Awaiting approval
                                </span>
                              )}
                            </div>
                          </div>
                          {expanded === p.id && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                              {p.description && <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>}
                              <RouteMap3D from={p.fromLocation} to={p.toLocation} animate={false} />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
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
