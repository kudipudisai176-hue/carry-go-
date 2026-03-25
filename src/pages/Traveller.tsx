import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Plus, Check, Trash2, MapPin, Weight, ArrowRight, ArrowLeft, Sparkles, Box, Bike, Bus, Car, Truck, Info, Layers, CreditCard, RefreshCw, Navigation, History, Search, Handshake, ChevronRight, CheckCircle2, Navigation2, Zap, Clock, Star, Phone, ShieldCheck, Map, LayoutDashboard, User, PackageCheck, ChevronUp, ChevronDown, Bell
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
import { useNavigate } from "react-router-dom";
// Supabase import removed
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

export default function Traveller() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      // Priority: use the 'from' state if set, else fallback to user's registered city
      const origin = from || user?.city || "";
      const destination = to || "";

      const data = await searchParcels(origin, destination);
      // Security: Filter out own parcels - you cannot be the traveller for your own parcel
      const filtered = data.filter(p => p.senderId !== user?.id);
      setResults(filtered);
    } catch {
      toast.error("Failed to load local parcels");
    }
  }, [from, to, user?.id, user?.city]);

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

  useEffect(() => {
    loadMyDeliveries();
  }, [loadMyDeliveries]);

  // Auto-load local parcels based on user's city (Point 3)
  useEffect(() => {
    if (activeTab === "search" && results.length === 0) {
      handleSearch();
    }
  }, [activeTab, results.length, handleSearch]);

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
    <div className="min-h-screen bg-slate-50 mx-auto max-w-4xl px-4 pb-20 pt-24">

      {/* ── Header ── */}
      {!detailParcel && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="group -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Traveller Dashboard</h1>
              <p className="text-muted-foreground">Manage your deliveries and find new parcels</p>
            </div>
          </div>

          {/* 💰 Wallet Balance Card (Point 14) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-orange-500/10 rounded-2xl p-5 flex items-center gap-4 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.1)]"
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Earnings Balance</p>
              <p className="text-2xl font-black text-slate-900 leading-none mt-1">₹{user?.walletBalance || 0}</p>
              <div className="flex h-1 w-8 bg-orange-500/20 rounded-full mt-2" />
            </div>
          </motion.div>
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
              <div className="bg-orange-500/5 p-6 border-b border-orange-500/10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                    <Package className="h-7 w-7" />
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
                      <div className="flex items-center justify-between w-full max-w-[150px] px-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Enter OTP</p>
                      </div>
                      <Input
                        value={pickupOtp}
                        onChange={(e) => setPickupOtp(e.target.value)}
                        placeholder="0 0 0 0"
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
                      <h3 className="font-bold flex items-center gap-2 text-foreground">
                        <Navigation className="h-5 w-5 text-secondary" /> Navigation Active
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://www.google.com/maps/dir/${encodeURIComponent(detailParcel.fromLocation)}/${encodeURIComponent(detailParcel.toLocation)}`, '_blank')}
                          className="text-[10px] font-bold uppercase rounded-xl border-secondary/30 text-secondary hover:bg-secondary/5"
                        >
                          <Navigation2 className="h-3 w-3 mr-1.5" /> G-Maps App
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setNavParcel(detailParcel)} className="text-[10px] uppercase font-bold rounded-xl">Full Screen 3D</Button>
                      </div>
                    </div>
                    <RouteMap3D from={detailParcel.fromLocation} to={detailParcel.toLocation} animate={true} />

                    <div className="rounded-3xl border-2 border-green-500/30 bg-green-500/5 p-8 text-center space-y-6">
                      <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Final Step</p>
                      <h3 className="text-xl font-bold">Arrived at Destination?</h3>
                      <p className="text-xs text-muted-foreground">Click below to confirm successful delivery to <strong>{detailParcel.receiverName}</strong>.</p>
                      <div className="flex flex-col items-center gap-4">
                        <Button
                          className="w-full max-w-xs bg-green-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-600/20"
                          onClick={() => navigate(`/confirm-delivery/${detailParcel.id}`)}
                          disabled={isConfirming}
                        >
                          {isConfirming ? "Navigating..." : "Confirm Delivery Complete"}
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
              className="mb-8 rounded-[2.5rem] bg-white p-8 text-slate-900 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.15)] border border-white"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Earnings Balance</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-orange-500">₹</span>
                    <h2 className="text-5xl font-black tracking-tight">{user?.walletBalance || 0}</h2>
                  </div>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-500/10 shadow-inner">
                  <PackageCheck className="h-10 w-10 text-orange-500" />
                </div>
              </div>
              <div className="mt-8 flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Auto-withdrawals processed every Monday</p>
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <div className="mb-8 flex gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200 shadow-inner">
              <button
                onClick={() => setActiveTab("deliveries")}
                className={`flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "deliveries"
                  ? "bg-white text-orange-600 shadow-md"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
              >
                <History className="mr-2 inline h-4 w-4" />
                My Deliveries
                {myDeliveries.length > 0 && (
                  <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] text-white">
                    {myDeliveries.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "search"
                  ? "bg-white text-orange-600 shadow-md"
                  : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  }`}
              >
                <Search className="mr-2 inline h-4 w-4" />
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
                                  onClick={() => navigate(`/confirm-delivery/${p.id}`)}
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
                  {/* Smart Filtering & Location Control (Point 1 & 2) */}
                  <div className="mb-8 rounded-3xl border-2 border-orange-500/20 bg-white p-8 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.1)]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner">
                             <MapPin className="h-8 w-8" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Set Your Journey Origin</p>
                             <h3 className="text-xl font-black text-slate-900 leading-none">Starting from <span className="text-orange-600">{from || user?.city || "your city"}</span></h3>
                          </div>
                       </div>
                       
                       <div className="flex-1 max-w-sm">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Change Starting City</Label>
                          <div className="flex gap-2">
                             <div className="relative group flex-1">
                                <Input 
                                   value={from} 
                                   onChange={(e) => setFrom(e.target.value)} 
                                   placeholder="Enter current city..." 
                                   className="h-12 pl-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all group-hover:border-orange-200"
                                />
                                <Navigation2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                             </div>
                             <Button 
                               onClick={handleSearch}
                               className="h-12 px-6 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 font-black uppercase text-[10px] tracking-widest"
                             >
                                <Search className="h-4 w-4 mr-2" /> Search
                             </Button>
                          </div>
                       </div>
                    </div>
                  </div>

                  {results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                      <Truck className="mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No parcels currently available from <strong>{user?.city || "your area"}</strong>.</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">New deliveries appear as senders book them</p>
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
                               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-100 w-fit text-[10px] font-bold text-orange-600 uppercase tracking-tight mb-2">
                                  <Zap className="h-3 w-3" /> Matches Your Origin
                               </div>
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
                              {p.status === "open_for_travellers" && (
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
