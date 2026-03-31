import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Box, Plus, Check, Trash2, MapPin, Weight, ArrowRight, ArrowLeft, Sparkles, Bike, Bus, Car, Navigation, Info, Layers, CreditCard, QrCode, ExternalLink, X, KeyRound, Bell, CheckCircle2, Camera, RefreshCw, Edit2, Search, PackageCheck, Handshake, User, Phone, MessageCircle, Navigation2, Lock as LockIcon, ShieldCheck, Loader2, Zap, Clock
} from "lucide-react";
import { locations } from '@/lib/locations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import BottomNav from "@/components/BottomNav";
import {
  createParcel, getAllParcels, updateParcelStatus, deleteParcel,
  updateParcelPayment, acceptRequest, releaseParcelPayment, updateParcel,
  getParcelsByPhone, markReceived, type Parcel
} from "@/lib/parcelStore";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
import UserProfileModal from "@/components/UserProfileModal";
import { UserData } from "@/lib/parcelStore";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";

export default function Sender({ startWithForm = false }: { startWithForm?: boolean }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming">(() => {
    return (localStorage.getItem("dashboard_active_tab") as "outgoing" | "incoming") || "outgoing";
  });

  useEffect(() => {
    localStorage.setItem("dashboard_active_tab", activeTab);
  }, [activeTab]);

  // -- Outgoing State --
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [showForm, setShowForm] = useState(startWithForm);
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [detailModal, setDetailModal] = useState<Parcel | null>(null);
  const [trackingModal, setTrackingModal] = useState<Parcel | null>(null); // auto-opens on transit
  const [latestCreated, setLatestCreated] = useState<Parcel | null>(null); // auto-opens after creation
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "inTransit" | "delivered">("all");
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);

  // -- Incoming State --
  const [incomingPhone, setIncomingPhone] = useState(user?.phone || "");
  const [incomingParcels, setIncomingParcels] = useState<Parcel[]>([]);
  const [searchedIncoming, setSearchedIncoming] = useState(false);
  const [expandedIncoming, setExpandedIncoming] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // -- Form State --
  const [weight, setWeight] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [size, setSize] = useState<"small" | "medium" | "large" | "very-large">("medium");
  const [selectedVehicle, setSelectedVehicle] = useState("Bike");
  const [paymentMethod, setPaymentMethod] = useState("pay-now");
  const [parcelPhoto, setParcelPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true });
  }, [user, isLoading, navigate]);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser doesn't support camera access");
      }

      // Stop any existing tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      // Try with environment facing mode first (better for parcels)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (innerErr) {
        // Fallback to basic video
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      toast.error(err.name === 'NotAllowedError' ? "Camera permission denied" : "Could not access camera");
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
    const vRef = videoRef.current;
    return () => {
      if (vRef && vRef.srcObject) {
        const stream = vRef.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Checkout/Payment states
  const [checkoutParcel, setCheckoutParcel] = useState<Parcel | null>(null);
  const [showScanner, setShowScanner] = useState<string | null>(null); // parcel id for scanning

  const refresh = useCallback(async () => {
    try {
      const data = await getAllParcels('sender');
      setParcels(data);
    } catch (err) {
      console.error("Failed to load parcels:", err);
    }
  }, []);

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

  // Real-time status sync (Point 11 in instructions)
  useEffect(() => {
    if (!user?.id) return;

    // Listen for any changes to parcels I SNT (outgoing)
    const channel = supabase
      .channel('sender-parcel-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (Insert, Update, Delete)
          schema: 'public',
          table: 'parcels',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Realtime] Parcel changed:', payload);
          refresh(); // Pull fresh data from API to ensure data mapping is consistent

          if (payload.new && (payload.new as Parcel).status === 'requested') {
            toast.info("A traveller has requested to carry your parcel! 📦");
            sendBrowserNotification("New Delivery Request!", "Check your dashboard to approve the traveller.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh, sendBrowserNotification]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!user?.id) {
      toast.error("You must be logged in to create a parcel.");
      return;
    }

    const parcelData: any = {
      sender_name: user.name || "Me",
      receiver_name: fd.get("receiverName") as string,
      receiver_phone: `+91${fd.get("receiverPhone")}`,
      from_location: fd.get("fromLocation") as string,
      to_location: fd.get("toLocation") as string,
      weight: parseFloat(weight) || 0,
      size: size,
      item_count: itemCount,
      vehicle_type: selectedVehicle,
      payment_method: paymentMethod,
      description: fd.get("description") as string,
      sender_id: user?.id || "",
    };

    if (editingParcel) {
      setLoading(true);
      try {
        await updateParcel(editingParcel.id, parcelData, parcelPhoto || undefined);
        toast.success("Parcel updated successfully!");
        setEditingParcel(null);
        resetForm();
      } catch (err: any) {
        toast.error("Failed to update parcel: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const resp = await createParcel(parcelData, parcelPhoto || undefined);

      // Directly show success state since backend handles the 'paid' status automatically now
      setLatestCreated(resp);
      resetForm();
      toast.success("Parcel posted successfully! It is now visible to all travellers.");
    } catch (err: any) {
      toast.error(`Parcel creation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
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

  const handleEdit = (p: Parcel) => {
    setEditingParcel(p);
    setWeight(p.weight.toString());
    setSize(p.size as any);
    setItemCount(p.item_count);
    setSelectedVehicle(p.vehicle_type || "");
    setPaymentMethod(p.payment_method);
    if (p.parcel_photo) {
      setPhotoPreview(`http://localhost:5000/${p.parcel_photo}`);
    }
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setCheckoutParcel(null);
    setWeight("");
    setSize("medium");
    setItemCount(1);
    setSelectedVehicle("");
    setPaymentMethod('pay-now');
    setParcelPhoto(null);
    setPhotoPreview(null);
    stopCamera();
    setEditingParcel(null);
    refresh();
  };

  const getRecommendedVehicle = () => {
    const w = parseFloat(weight) || 0;
    const n = itemCount;

    if (w <= 10 && size === 'small' && n <= 2) return { id: 'bike', label: 'Bike', icon: Bike, color: 'text-blue-400' };
    if (w <= 50 && (size === 'small' || size === 'medium') && n <= 10) return { id: 'car', label: 'Car', icon: Car, color: 'text-green-400' };
    if (w <= 200 && size !== 'very-large' && n <= 50) return { id: 'van', label: 'Van', icon: Navigation, color: 'text-purple-400' };
    return { id: 'bus', label: 'Bus', icon: Bus, color: 'text-orange-400' };
  };

  const recommended = getRecommendedVehicle();

  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setIsAccepting(id);
    try {
      const result = await updateParcelStatus(id, "accepted");
      toast.success("Traveller request accepted! Share the OTP with them.");
      await refresh();
      // Re-fetch the fresh parcel with OTP from backend list
      const fresh = await getAllParcels('sender');
      const updated = fresh.find(p => p.id === id);
      if (updated) setDetailModal(updated);
    } catch (err) {
       toast.error("Failed to accept request");
    } finally {
       setIsAccepting(null);
    }
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
    all: parcels.length,
    pending: parcels.filter(p => {
      const s = p.status?.toLowerCase();
      return s === "pending" || s === "requested" || s === "accepted" || s === "pending_payment" || s === "open_for_travellers";
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
    if (filter === 'pending') return status === 'pending' || status === 'requested' || status === 'accepted' || status === 'pending_payment' || status === 'open_for_travellers';
    if (filter === 'inTransit') return status === 'in-transit' || status === 'picked-up';
    if (filter === 'delivered') return status === 'delivered' || status === 'received' || status === 'completed';
    return true;
  });

  useEffect(() => {
    if (activeTab === "incoming" && user?.phone) {
      handleSearchIncoming(user.phone);
    }
  }, [activeTab, user?.phone]);

  const handleSearchIncoming = async (phoneOrEvent?: string | React.FormEvent, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (typeof phoneOrEvent !== 'string' && phoneOrEvent && 'preventDefault' in phoneOrEvent) {
      phoneOrEvent.preventDefault();
    }

    try {
      // Use the new mode='receiver' which handles ID-based linking + phone fallback (Correct Architecture)
      const data = await getAllParcels('receiver');
      setIncomingParcels(data);
      setSearchedIncoming(true);
    } catch (err) {
      toast.error("Failed to fetch incoming parcels");
    }
  };

  const handleMarkReceived = async (id: string) => {
    await markReceived(id);
    toast.success("Parcel marked as received! Payout confirmed.");
    handleSearchIncoming(user?.phone);
  };



  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#0d1117] text-orange-500 font-bold uppercase tracking-[0.3em] animate-pulse">Initializing Dashboard...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 mx-auto max-w-4xl px-4 pb-20 pt-20">

      {/* ── Animated page header ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard')}
        className="group mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </Button>
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative mb-8 overflow-hidden rounded-[2.5rem] p-10 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.15)] border border-white bg-white"
      >
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />
        <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-secondary/5 blur-[60px]" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20">
                <Box className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">Active Dashboard</h1>
                <p className="text-sm font-bold text-slate-400">Manage your entire logistics pipeline</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 border border-slate-100 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Personal OTP</span>
              <span className="text-lg font-bold text-orange-600 tracking-widest">{user?.personalOtp || "----"}</span>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-2xl shadow-xl shadow-secondary/20 px-8"
            >
              <Plus className="mr-2 h-5 w-5" /> NEW PARCEL
            </Button>
          </div>
        </div>

        {/* --- Unified Tabs --- */}
        <div className="mt-10 flex gap-2 rounded-[1.5rem] bg-slate-100 p-1.5 relative z-10 border border-slate-200">
          <button
            onClick={() => setActiveTab("outgoing")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "outgoing"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-transparent text-black hover:bg-slate-200/50"
              }`}
          >
            <Box className="h-4 w-4" />
            SENT (OUTBOX)
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "incoming"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-transparent text-black hover:bg-slate-200/50"
              }`}
          >
            <Handshake className="h-4 w-4" />
            RECEIVED (INBOX)
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "outgoing" ? (
          <motion.div
            key="outgoing-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats strip */}
            <div className="relative mt-5 grid grid-cols-4 gap-3">
              {[
                { id: "all", label: "Total", value: statusCounts.all, color: "hsl(28 100% 55%)" },
                { id: "pending", label: "Pending", value: statusCounts.pending, color: "#f59e0b" },
                { id: "inTransit", label: "In Transit", value: statusCounts.inTransit, color: "#60a5fa" },
                { id: "delivered", label: "Delivered", value: statusCounts.delivered, color: "#34d399" },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  onClick={() => setFilter(s.id as any)}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-3 transition-all ${filter === s.id ? 'bg-secondary/10 border-secondary ring-2 ring-secondary/20' : 'bg-card/30 border-border hover:bg-card/50'}`}
                >
                  <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Form & List */}
            <div className="space-y-6 mt-6">
              <AnimatePresence>
                {showForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <form onSubmit={handleSubmit} className="mb-6 rounded-3xl border border-secondary/20 bg-card p-6 shadow-xl">
                      <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-secondary" /> {editingParcel ? 'Edit Parcel' : 'Send New Parcel'}</h2>
                      <div className="space-y-4">
                        {/* Row 1: Receiver Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Receiver Name</Label>
                            <Input name="receiverName" placeholder="" defaultValue={editingParcel?.receiver_name} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Receiver Number</Label>
                            <div className="flex mt-1 rounded-md overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500">
                              <span className="bg-slate-100 px-3 flex items-center text-sm font-bold text-slate-500 border-r border-slate-200">+91</span>
                              <input name="receiverPhone" placeholder="" defaultValue={editingParcel?.receiver_phone?.replace('+91', '')} className="flex-1 px-3 py-2 outline-none text-sm bg-slate-50 focus:bg-white font-medium" required maxLength={10} minLength={10} pattern="\d{10}" />
                            </div>
                          </div>
                        </div>

<<<<<<< HEAD
                          {/* Row 2: Route Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-border pt-4">
                            <div>
                               <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From City</Label>
                               <Input name="fromLocation" list="locations-list" placeholder="kakinada rtc bus stand" defaultValue={editingParcel?.from_location} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                            </div>
                            <div>
                               <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">To City</Label>
                               <Input name="toLocation" list="locations-list" placeholder="yerravaram bus stop" defaultValue={editingParcel?.to_location} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                            </div>
                            <datalist id="locations-list">
                               {locations.map(loc => (
                                  <option key={loc.name} value={loc.name}>{loc.mandal}</option>
                               ))}
                            </datalist>
=======
                        {/* Row 2: Route Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-border pt-4">
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">From City</Label>
                            <Input name="fromLocation" list="locations-list" placeholder="e.g. Kakinada" defaultValue={editingParcel?.from_location} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
>>>>>>> origin/main
                          </div>
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">To City</Label>
                            <Input name="toLocation" list="locations-list" placeholder="e.g. Rajahmundry" defaultValue={editingParcel?.to_location} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                          </div>
                          <datalist id="locations-list">
                            {locations.map(loc => (
                              <option key={loc.name} value={loc.name}>{loc.mandal}</option>
                            ))}
                          </datalist>
                        </div>

                        {/* Row 3: Parcel Details & Photo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dashed border-border pt-4">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Parcel Item Name</Label>
                              <Input name="description" placeholder="" defaultValue={editingParcel?.description} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Weight (kg)</Label>
                                <Input type="number" step="0.1" name="weight" placeholder="kg" onChange={(e) => setWeight(e.target.value)} defaultValue={editingParcel?.weight} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                              </div>
                              <div className="flex-1">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Items</Label>
                                <Input type="number" name="itemCount" placeholder="Qty" onChange={(e) => setItemCount(parseInt(e.target.value))} defaultValue={editingParcel?.item_count} className="mt-1 bg-slate-50 focus:bg-white border-slate-200" required />
                              </div>
                            </div>
                          </div>

                          {/* Live Image Capture */}
                          <div>
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Parcel Live Image</Label>
                            <div className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden h-[132px]">
                              {photoPreview ? (
                                <>
                                  <img src={photoPreview} alt="Parcel" className="absolute inset-0 w-full h-full object-cover" />
                                  <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full" onClick={() => { setPhotoPreview(null); setParcelPhoto(null); }}><X className="h-3 w-3" /></Button>
                                </>
                              ) : isCameraOpen ? (
                                <>
                                  <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
                                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                                    <Button type="button" size="sm" onClick={capturePhoto} className="bg-emerald-500 hover:bg-emerald-600 rounded-full h-8 px-4 text-xs font-bold shadow-lg text-white border-0">Capture</Button>
                                    <Button type="button" size="sm" variant="destructive" onClick={stopCamera} className="rounded-full h-8 w-8 p-0 shadow-lg"><X className="h-4 w-4" /></Button>
                                  </div>
                                </>
                              ) : (
                                <Button type="button" variant="outline" onClick={startCamera} className="bg-white hover:bg-slate-100 font-bold border-slate-300 text-slate-600 rounded-full">
                                  <Camera className="h-4 w-4 mr-2" /> Open Camera
                                </Button>
                              )}
                            </div>
                            {!photoPreview && <p className="text-[9px] text-muted-foreground mt-1 text-center font-bold uppercase">Image Proof Required</p>}
                          </div>
                        </div>



                        {/* Submit Actions */}
                        <div className="flex items-center gap-3 pt-6 border-t border-border mt-4 justify-end">
                          <Button type="button" variant="ghost" onClick={() => { setEditingParcel(null); setShowForm(false); }} className="text-xs font-bold rounded-xl px-4 hover:bg-slate-100">Cancel</Button>
                          <Button type="submit" disabled={loading || (!photoPreview && !editingParcel)} className="bg-secondary hover:bg-secondary/90 text-white font-bold uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-secondary/20 h-11 flex items-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingParcel ? <RefreshCw className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />)}
                            {loading ? 'Processing...' : (editingParcel ? 'Save Changes' : 'Post Parcel')}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Parcel cards ── */}
              <motion.div
                className="grid gap-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                {filteredParcels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-2 border-dashed border-border/50 opacity-60">
<<<<<<< HEAD
                     <Box className="h-12 w-12 text-muted-foreground/30 mb-2" />
                     <p className="font-bold text-muted-foreground">No {filter !== 'all' ? filter : ""} parcels found</p>
=======
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-2" />
                    <p className="font-bold text-muted-foreground">No {filter !== 'all' ? filter : ""} parcels found</p>
>>>>>>> origin/main
                  </div>
                ) : (
                  filteredParcels.map((p) => {
                    const isSelected = selected?.id === p.id;
                    const isHovered = hoveredId === p.id;
                    return (
                      <motion.div
                        key={p.id}
                        onHoverStart={() => setHoveredId(p.id)}
                        onHoverEnd={() => setHoveredId(null)}
                        onClick={() => setSelected(isSelected ? null : p)}
                        className={`relative cursor-pointer rounded-3xl border bg-card p-5 transition-all ${isSelected ? 'border-secondary/50 shadow-xl' : 'border-border hover:border-secondary/30 shadow-card'}`}
                      >
<<<<<<< HEAD
                         <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                               <div className="h-10 w-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary"><Box className="h-5 w-5" /></div>
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <StatusBadge status={p.status} />
                                     <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground opacity-50">#{p.id.slice(-6).toUpperCase()}</span>
                                   </div>
                                   <h3 className="font-heading font-bold text-lg">{p.from_location} → {p.to_location}</h3>
                               </div>
=======
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary"><Package className="h-5 w-5" /></div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={p.status} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground opacity-50">#{p.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <h3 className="font-heading font-bold text-lg">{p.from_location} → {p.to_location}</h3>
>>>>>>> origin/main
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-bold text-foreground">₹{p.price}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.weight}kg · {p.item_count} items</span>
                          </div>
                        </div>

<<<<<<< HEAD
                         <AnimatePresence>
                            {isSelected && (
                               <motion.div 
                                  initial={{ opacity: 0, height: 0 }} 
                                  animate={{ opacity: 1, height: 'auto' }} 
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-6 border-t border-border pt-6 overflow-hidden"
                               >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {/* Traveller Box (If Assigned) */}
                                      {p.traveller_name || (p.status === 'requested') ? (
                                         <div className="flex flex-col gap-3 w-full">
                                            <div className="flex items-center justify-between p-4 bg-white border border-border shadow-sm rounded-3xl group/card">
                                              <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                                                  <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Traveller</p>
                                                  <p className="font-bold text-sm text-slate-800">{p.traveller_name || "Applicant"}</p>
                                                </div>
                                              </div>
                                              {p.traveller_phone ? (
                                                <a 
                                                  href={`tel:${p.traveller_phone}`}
                                                  onClick={(e) => e.stopPropagation()}
                                                  className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
                                                >
                                                  <Phone className="h-4 w-4" />
                                                </a>
                                              ) : (
                                                <div className="text-[9px] font-bold text-orange-500 uppercase px-2 py-1 bg-orange-100 rounded-lg">Pending approval</div>
                                              )}
                                            </div>
                                            
                                              {p.status === 'requested' && (
                                                <Button 
                                                  disabled={isAccepting === p.id}
                                                  onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }}
                                                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold h-12 rounded-[1.25rem] shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-[10px] transform transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden group"
                                                >
                                                  {isAccepting === p.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                  ) : (
                                                    <>
                                                      <Handshake className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
                                                      <span>ACCEPT REQUEST</span>
                                                    </>
                                                  )}
                                                </Button>
                                              )}
                                         </div>
                                       ) : (
                                         <div className="flex items-center gap-3 p-4 bg-muted/20 border border-dashed border-border rounded-3xl w-full">
                                           <div className="h-10 w-10 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/30">
                                             <Loader2 className="h-5 w-5 animate-spin" />
                                           </div>
                                           <div>
                                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Traveller</p>
                                             <p className="font-bold text-xs text-muted-foreground/50 italic leading-none">Searching for traveller...</p>
                                           </div>
                                         </div>
                                       )}

                                      {/* Receiver Box */}
                                      <div className="flex items-center justify-between p-4 bg-white border border-border shadow-sm rounded-3xl group/card">
                                        <div className="flex items-center gap-3">
                                          <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                            <User className="h-5 w-5" />
                                          </div>
                                          <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Receiver</p>
                                            <p className="font-bold text-sm text-slate-800">{p.receiver_name}</p>
                                          </div>
                                        </div>
                                        <a 
                                          href={`tel:${p.receiver_phone}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-10 w-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                                          title={`Call ${p.receiver_name}`}
                                        >
                                          <Phone className="h-4 w-4" />
                                        </a>
                                      </div>
                                   </div>

                                  {/* Extra details when expanded */}
                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                     <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                                       <div className="p-2 rounded-lg bg-white shadow-sm text-secondary">
                                         <Box className="h-4 w-4" />
                                       </div>
                                       <div>
                                         <p className="text-[10px] font-bold text-muted-foreground uppercase">Items</p>
                                         <p className="font-bold text-sm tracking-tighter">{p.item_count} Units</p>
                                       </div>
                                     </div>
                                     <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                                       <div className="p-2 rounded-lg bg-white shadow-sm text-secondary">
                                         <CreditCard className="h-4 w-4" />
                                       </div>
                                       <div>
                                         <p className="text-[10px] font-bold text-muted-foreground uppercase">Payment</p>
                                         <p className="font-bold text-sm tracking-tighter uppercase">{p.payment_method?.replace('-', ' ')}</p>
                                       </div>
                                     </div>
                                  </div>

                                  {p.description && (
                                    <div className="mt-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Description</p>
                                      <p className="text-xs font-medium text-slate-600 italic">"{p.description}"</p>
=======
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-6 border-t border-border pt-6 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Receiver Box */}
                                <div className="flex items-center justify-between p-4 bg-white border border-border shadow-sm rounded-3xl group/card">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                      <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Receiver</p>
                                      <p className="font-bold text-sm text-slate-800">{p.receiver_name}</p>
                                    </div>
                                  </div>
                                  <a
                                    href={`tel:${p.receiver_phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-10 w-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                                    title={`Call ${p.receiver_name}`}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </a>
                                </div>

                                {/* Traveller Box (If Assigned) */}
                                {p.traveller_name || (p.status === 'requested') ? (
                                  <div className="flex flex-col gap-3 w-full">
                                    <div className="flex items-center justify-between p-4 bg-white border border-border shadow-sm rounded-3xl group/card">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                                          <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Traveller</p>
                                          <p className="font-bold text-sm text-slate-800">{p.traveller_name || "Applicant"}</p>
                                        </div>
                                      </div>
                                      {p.traveller_phone ? (
                                        <a
                                          href={`tel:${p.traveller_phone}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all"
                                        >
                                          <Phone className="h-4 w-4" />
                                        </a>
                                      ) : (
                                        <div className="text-[9px] font-bold text-orange-500 uppercase px-2 py-1 bg-orange-100 rounded-lg">Pending approval</div>
                                      )}
>>>>>>> origin/main
                                    </div>

<<<<<<< HEAD


                                  <div className="mt-6 flex gap-2">

                                     <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="flex-1 font-bold text-xs uppercase bg-muted rounded-full">Edit Details</Button>
                                     <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="flex-1 font-bold text-xs uppercase text-red-500 hover:bg-red-50 rounded-full">Cancel Order</Button>
=======
                                    {p.status === 'requested' && (
                                      <Button
                                        onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-2xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-[10px] animate-pulse"
                                      >
                                        <Handshake className="h-4 w-4 mr-2" /> Approve Traveller to Deliver
                                      </Button>
                                    )}
>>>>>>> origin/main
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3 p-4 bg-muted/20 border border-dashed border-border rounded-3xl w-full">
                                    <div className="h-10 w-10 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground/30">
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Traveller</p>
                                      <p className="font-bold text-xs text-muted-foreground/50 italic leading-none">Searching for traveller...</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Extra details when expanded */}
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                                  <div className="p-2 rounded-lg bg-white shadow-sm text-secondary">
                                    <Package className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Items</p>
                                    <p className="font-bold text-sm tracking-tighter">{p.item_count} Units</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                                  <div className="p-2 rounded-lg bg-white shadow-sm text-secondary">
                                    <CreditCard className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Payment</p>
                                    <p className="font-bold text-sm tracking-tighter uppercase">{p.payment_method?.replace('-', ' ')}</p>
                                  </div>
                                </div>
                              </div>

                              {p.description && (
                                <div className="mt-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Description</p>
                                  <p className="text-xs font-medium text-slate-600 italic">"{p.description}"</p>
                                </div>
                              )}

                              {p.status === 'accepted' && p.pickup_otp && (
                                <div className="mb-6 mt-4 rounded-3xl bg-secondary p-6 text-center shadow-lg shadow-secondary/20 border-2 border-white/20">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 mb-1">Pickup Authorization (Share with Traveller)</p>
                                  <p className="text-4xl font-bold text-white tracking-[0.4em] font-mono">{p.pickup_otp}</p>
                                </div>
                              )}

                              <div className="mt-6 flex gap-2">

                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="flex-1 font-bold text-xs uppercase bg-muted rounded-full">Edit Details</Button>
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="flex-1 font-bold text-xs uppercase text-red-500 hover:bg-red-50 rounded-full">Cancel Order</Button>
                              </div>

                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="incoming-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 space-y-6"
          >
            <div className="rounded-3xl border border-secondary/20 bg-card/50 backdrop-blur-md p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">👋 Welcome, {user?.name?.split(' ')[0] || 'User'}</h2>
                <p className="text-sm font-bold text-muted-foreground mt-1">
                  📦 Your Incoming Parcels ({incomingParcels.length})
                </p>
              </div>
              <div className="flex items-center gap-3">
<<<<<<< HEAD
                 <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10">
                   <Box className="h-6 w-6 text-secondary" />
                 </div>
=======
                <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
>>>>>>> origin/main
              </div>
            </div>

            {incomingParcels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-border/50">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4"
                >
                  <MapPin className="h-8 w-8 text-muted-foreground/30" />
                </motion.div>
                <p className="text-muted-foreground font-bold">No parcels found yet</p>
                <p className="text-xs text-black mt-1 max-w-xs px-10">We check your mobile number <strong>{user?.phone}</strong> for incoming deliveries automatically.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {incomingParcels.map(p => (
                  <motion.div
                    key={`in-${p.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card hover:border-blue-600/30 transition-all"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StatusBadge status={p.status} />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ORDER #{p.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-blue-600 transition-colors">{p.from_location} → {p.to_location}</h3>
                          <div className="mt-2 flex items-center gap-4 text-xs font-bold text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Weight className="h-3.5 w-3.5 text-blue-600" /> {p.weight} kg</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => p.sender_data && setProfileUser(p.sender_data)}
                                className="flex items-center gap-1.5 hover:bg-blue-600/10 hover:text-blue-600 rounded-full px-2 py-0.5 transition-all text-blue-600/80 bg-blue-600/5"
                              >
                                <User className="h-3.5 w-3.5" /> Sender: {p.sender_name}
                              </button>
                              <a
                                href={`tel:${p.sender_phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 w-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-110 active:scale-95 transition-all"
                                title={`Call ${p.sender_name}`}
                              >
                                <Phone className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Status Timeline */}
                      <div className="my-2 bg-muted/30 rounded-2xl p-4 border border-border/50">
                        <div className="flex items-center gap-2">
                          {['pending', 'picked-up', 'in-transit', 'delivered'].map((step, idx, arr) => {
                            const statusStr = p.status ? p.status.toLowerCase().replace('completed', 'delivered').replace('received', 'delivered') : 'pending';
                            // requested/accepted -> pending step
                            const normalizedStatus = ['requested', 'accepted'].includes(statusStr) ? 'pending' : statusStr;
                            const currentIdx = arr.indexOf(normalizedStatus);
                            const isPast = idx <= (currentIdx === -1 ? 0 : currentIdx);
                            const isCurrent = idx === currentIdx;
                            const stepNames = ['Pending', 'Picked Up', 'In Transit', 'Delivered'];
                            return (
                              <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${isPast ? 'bg-blue-600/80 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'bg-border'}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-tighter ${isCurrent ? 'text-blue-600' : isPast ? 'text-foreground/80' : 'text-muted-foreground/40'}`}>
                                  {stepNames[idx]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* 🔐 Delivery Verification OTP (Only for Receiver, Point 15) */}
                      {p.delivery_otp && (p.status === 'in-transit' || p.status === 'accepted') && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-4 p-5 rounded-[2rem] bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group border border-white/20"
                        >
                          <div className="flex flex-col items-center justify-center text-center relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <LockIcon className="h-4 w-4 text-blue-200" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/80">Receiver Delivery OTP</span>
                            </div>
                            <div className="flex gap-2">
                              {p.delivery_otp.split('').map((digit, i) => (
                                <div key={i} className="h-14 w-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl text-2xl font-bold shadow-inner border border-white/30 transform transition-transform group-hover:scale-105 duration-300">
                                  {digit}
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-black/10 rounded-full">
                              <ShieldCheck className="h-3 w-3 text-blue-200" />
                              <p className="text-[9px] font-bold text-blue-100">Share this code with the Traveller ONLY when you have the parcel.</p>
                            </div>
                          </div>
                          {/* Decorative Background Icon */}
                          <Zap className="absolute -bottom-4 -right-4 h-24 w-24 text-white/10 rotate-12 transition-transform group-hover:scale-125 duration-700" />
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-wrap gap-2">
                        <a href={`tel:${p.sender_phone || "1234567890"}`} className="flex-1 min-w-[100px]">
                          <Button variant="outline" size="sm" className="w-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 border-none rounded-xl font-bold uppercase tracking-widest text-[10px]">
                            <Phone className="h-3.5 w-3.5 mr-1.5" /> Call Sender
                          </Button>
                        </a>
                        <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-chat-support'))} className="flex-1 min-w-[100px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 border-none rounded-xl font-bold uppercase tracking-widest text-[10px]">
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Chat
                        </Button>

                        {p.status === 'delivered' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkReceived(p.id)}
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 px-6 uppercase tracking-widest text-[10px]"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" /> I Received This
                          </Button>
                        )}
                      </div>
                    </div>

                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab="sender" />
    </div>
  );
}



