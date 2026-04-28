import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Box, Plus, Check, Trash2, MapPin, Weight, ArrowRight, ArrowLeft, Sparkles, Bike, Bus, Car, Navigation, Info, Layers, CreditCard, QrCode, ExternalLink, X, KeyRound, Bell, CheckCircle2, Camera, RefreshCw, Edit2, Search, PackageCheck, Handshake, User, Phone, MessageCircle, MessageSquare, Navigation2, Lock as LockIcon, ShieldCheck, Loader2, Zap, Clock
} from "lucide-react";
import { compressImage } from "@/lib/imageUtils";
import { locations } from '@/lib/locations';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";

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
import { socket } from "@/lib/socket";
import ParcelChat from "@/components/ParcelChat";
import LiveCameraModal from "@/components/LiveCameraModal";
import RatingModal from "@/components/RatingModal";

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
  const [trackingModal, setTrackingModal] = useState<Parcel | null>(null);
  const [latestCreated, setLatestCreated] = useState<Parcel | null>(null);
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
  const [ratingParcel, setRatingParcel] = useState<Parcel | null>(null);

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
  const submittingRef = useRef(false); // hard-lock to prevent duplicate submissions

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true });
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    socket.on("start_navigation", (parcelId) => {
      // Find the parcel in our list to make sure it's ours
      const parcel = parcels.find(p => p.id === parcelId);
      if (parcel) {
        toast.success(`Traveller started navigation for parcel #${parcelId.slice(-6).toUpperCase()}!`, {
          description: "You can now track the live location.",
          duration: 10000,
        });
        // We could also auto-open the tracking modal here
        setTrackingModal(parcel);
      }
    });

    return () => {
      socket.off("start_navigation");
    };
  }, [user, parcels]);

  const locationsDatalist = useMemo(() => (
    <datalist id="locations-list">
      {locations.map((loc, idx) => (
        <option key={idx} value={loc.name}>
          {loc.type} - {loc.mandal}
        </option>
      ))}
    </datalist>
  ), []);

  const handleLiveCapture = (image: string) => {
    setPhotoPreview(image);
    setParcelPhoto(null);
    (window as any)._precompressedPhoto = image;
  };


  useEffect(() => {
    return () => {
      // No-op cleanup
    };
  }, []);

  const [checkoutParcel, setCheckoutParcel] = useState<Parcel | null>(null);
  const [showScanner, setShowScanner] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAllParcels('sender');
      
      setParcels(prev => {
        // Check for newly delivered parcels to trigger rating
        const newlyDelivered = data.find(p => 
          p.status === 'delivered' && 
          !prev.find(oldP => oldP.id === p.id && oldP.status === 'delivered')
        );
        
        if (newlyDelivered) {
           // We use a small timeout to avoid state updates during render/callback phase if needed, 
           // though since this is an async callback it should be fine.
           setRatingParcel(newlyDelivered);
        }
        return data;
      });
    } catch (err) {
      console.error("Failed to load parcels:", err);
    }
  }, []); // Remove dependency on parcels and ratingParcel

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

  // Load parcels on mount and when user changes
  useEffect(() => {
    refresh();
  }, [user?.id, refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 10000); // Polling every 10s safely
    return () => clearInterval(interval);
  }, [refresh]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 🚫 Hard-lock: block if already submitting (ref is synchronous, unlike state)
    if (submittingRef.current || loading) return;
    submittingRef.current = true;
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    if (!user?.id) {
      toast.error("You must be logged in to create a parcel.");
      submittingRef.current = false;
      setLoading(false);
      return;
    }

    const editId = editingParcel?.id; // capture ID synchronously before any await

    const parcelData: any = {
      senderName: user.name || "Me",
      receiverName: fd.get("receiverName") as string,
      receiverPhone: `+91${fd.get("receiverPhone")}`,
      fromLocation: fd.get("fromLocation") as string,
      toLocation: fd.get("toLocation") as string,
      weight: parseFloat(weight) || 0,
      size: (fd.get("parcelType") as any) || size,
      itemCount: itemCount,
      vehicleType: selectedVehicle,
      paymentMethod: paymentMethod,
      description: fd.get("description") as string,
      senderId: user?.id || "",
    };

    const creationPromise = (async () => {
      let photoBase64 = (window as any)._precompressedPhoto;

      // If not pre-compressed or selected via file input
      if (!photoBase64 && parcelPhoto) {
        try {
          photoBase64 = await compressImage(parcelPhoto);
        } catch (err) {
          photoBase64 = await fileToBase64(parcelPhoto);
        }
      }

      // Use a race to avoid permanent hang if DB is slow
      const requestWithTimeout = Promise.race([
        editId
          ? updateParcel(editId, parcelData, photoBase64)
          : createParcel(parcelData, photoBase64),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Operation timed out. Please check your internet connection.")), 90000))
      ]);

      const resp = await (requestWithTimeout as any);

      if (!resp || (!resp.id && !resp._id)) {
        throw new Error("Operation failed: Invalid server response.");
      }

      // Update local UI
      if (editId) {
        setParcels(prev => prev.map(p => p.id === resp.id ? resp : p));
      } else {
        setParcels(prev => [resp, ...prev]);
        setLatestCreated(resp);
      }

      resetForm();
      (window as any)._precompressedPhoto = null;
      return resp;
    })();

    toast.promise(creationPromise, {
      loading: editId ? 'Updating parcel...' : 'Saving parcel details...',
      success: editId ? 'Parcel updated successfully!' : 'Parcel posted successfully!',
      error: (err) => `Failed: ${err.response?.data?.message || err.message || "Unknown error"}`
    });

    try {
      await creationPromise;
    } catch (err: any) {
      console.error("Parcel creation flow failed:", err);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleReleasePayment = async (id: string) => {
    try {
      await releaseParcelPayment(id);
      toast.success("Payout released to Traveller!");
      refresh();
    } catch (err) {
      toast.error("Failed to release payout");
    }
  };

  const handleManualPayment = async (id: string) => {
    await updateParcelPayment(id, 'paid');
    toast.success("Payment received!");
    setShowScanner(null);
    refresh();
  };

  const handleEdit = (p: Parcel) => {
    setEditingParcel(p);
    setWeight(p.weight.toString());
    setSize(p.size as any);
    setItemCount(p.itemCount);
    setSelectedVehicle(p.vehicleType || "");
    setPaymentMethod(p.paymentMethod);
    if (p.parcelPhoto) {
      setPhotoPreview(p.parcelPhoto);
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
    setIsCameraOpen(false);
    setEditingParcel(null);
    refresh();
  };

  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setIsAccepting(id);
    try {
      await updateParcelStatus(id, "accepted");
      toast.success("Traveller request accepted!");
      await refresh();
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
      handleSearchIncoming();
    }
  }, [activeTab, user?.phone]);

  const handleSearchIncoming = async () => {
    try {
      const data = await getAllParcels('receiver');
      setIncomingParcels(data);
      setSearchedIncoming(true);
    } catch (err) {
      toast.error("Failed to fetch incoming parcels");
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await markReceived(id);
      toast.success("Parcel marked as received!");
      const p = incomingParcels.find(item => item.id === id);
      if (p) setRatingParcel(p);
      handleSearchIncoming();
    } catch (err) {
      toast.error("Failed to mark parcel as received");
    }
  };

  const handlePostButtonClick = () => {
    setShowForm(!showForm);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-orange-500 font-bold uppercase tracking-[0.3em] animate-pulse">Initializing Dashboard...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 mx-auto max-w-4xl px-4 pb-20 pt-20">

      {/* Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400/60">
        <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Dashboard</span>
        <span className="opacity-40">/</span>
        <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => setActiveTab('outgoing')}>Parcels</span>
        <span className="opacity-40">/</span>
        <span className="text-slate-900">Manage Dispatch</span>
      </div>

      <div className="mb-6 sm:mb-8 rounded-[2rem] sm:rounded-3xl bg-white p-5 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="group relative flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/30 text-white transition-transform hover:scale-105">
              <Box className="h-6 w-6 sm:h-8 sm:w-8 animate-float-slow" />
              <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">Post a New Parcel</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs sm:text-sm font-medium text-slate-400">Track, send and manage deliveries seamlessly</p>
              </div>
            </div>
          </div>
          <Button
            onClick={handlePostButtonClick}
            className={`group w-full sm:w-auto h-12 sm:h-14 rounded-2xl px-6 sm:px-10 text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${showForm ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-orange-500/40 hover:-translate-y-1'}`}
          >
            {showForm ? (
              <><X className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Cancel</>
            ) : (
              <><Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6 font-bold" /> Post Parcel</>
            )}
          </Button>
        </div>

        <div className="mt-8 flex gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
          <button
            onClick={() => setActiveTab("outgoing")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "outgoing" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Box className="h-4 w-4" /> OUTGOING
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "incoming" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
          >
            <Handshake className="h-4 w-4" /> INCOMING
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "outgoing" ? (
          <motion.div key="outgoing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: "all", label: "TOTAL", value: statusCounts.all, color: "amber", icon: Box, glow: "shadow-amber-500/20" },
                { id: "pending", label: "PENDING", value: statusCounts.pending, color: "orange", icon: Clock, glow: "shadow-orange-500/20" },
                { id: "inTransit", label: "TRANSIT", value: statusCounts.inTransit, color: "blue", icon: Navigation2, glow: "shadow-blue-500/20" },
                { id: "delivered", label: "DELIVERED", value: statusCounts.delivered, color: "emerald", icon: CheckCircle2, glow: "shadow-emerald-500/20" }
              ].map(s => (
                <div
                  key={s.id}
                  onClick={() => setFilter(s.id as any)}
                  className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-[2rem] sm:rounded-[2.5rem] border p-4 sm:p-6 transition-all duration-500 overflow-hidden ${filter === s.id
                    ? `bg-${s.color}-500 text-white border-transparent shadow-2xl shadow-${s.color}-500/40 scale-105 z-10`
                    : `bg-white border-slate-100 hover:border-${s.color}-200 hover:shadow-2xl ${s.glow} hover:-translate-y-1`}`}
                >
                  {/* Yellow Light Reflection Effect instead of White */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/10 to-amber-400/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700 pointer-events-none" />

                  <div className={`relative z-10 mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-500 ${filter === s.id ? 'bg-white/20' : `bg-slate-50 text-slate-400 group-hover:bg-${s.color}-50 group-hover:text-${s.color}-500 group-hover:rotate-12`}`}>
                    <s.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${filter === s.id ? 'text-white' : ''}`} />
                  </div>
                  <span className={`relative z-10 text-xl sm:text-2xl font-black transition-colors ${filter === s.id ? 'text-white' : 'text-slate-900'}`}>{s.value}</span>
                  <span className={`relative z-10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1 transition-colors ${filter === s.id ? 'text-white/70' : 'text-slate-400'}`}>{s.label}</span>

                  {/* Bottom Glow Indicator */}
                  {filter !== s.id && (
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-${s.color}-500 opacity-0 group-hover:opacity-100 blur-[2px] transition-all duration-500`} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              {showForm && (
                <form onSubmit={handleSubmit} className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl">
                  <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" /> {editingParcel ? 'Edit Parcel' : 'Send New Parcel'}</h2>
                  <div className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Full Name of Receiver</Label>
                        <Input name="receiverName" defaultValue={editingParcel?.receiverName} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all" placeholder="Enter name" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Mobile Number</Label>
                        <div className="flex h-12 rounded-2xl bg-slate-50 border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden border border-transparent focus-within:border-orange-500/10">
                          <span className="flex items-center px-4 text-sm font-bold text-slate-400 bg-slate-100/50">+91</span>
                          <input name="receiverPhone" type="tel" defaultValue={editingParcel?.receiverPhone?.replace('+91', '')} className="flex-1 bg-transparent px-3 outline-none text-sm font-bold" placeholder="9876543210" required maxLength={10} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Pickup Location</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input name="fromLocation" list="locations-list" defaultValue={editingParcel?.fromLocation} className="h-12 pl-11 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all" placeholder="Where from?" required autoComplete="off" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Delivery Location</Label>
                        <div className="relative group">
                          <Navigation2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input name="toLocation" list="locations-list" defaultValue={editingParcel?.toLocation} className="h-12 pl-11 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all" placeholder="Where to?" required autoComplete="off" />
                        </div>
                      </div>
                      {locationsDatalist}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Parcel Category</Label>
                          <Select name="parcelType" defaultValue={size} onValueChange={(val) => setSize(val as any)}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-orange-500/20">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                              <SelectItem value="small">Documents / Letters</SelectItem>
                              <SelectItem value="medium">Food / Groceries</SelectItem>
                              <SelectItem value="large">Electronics / Gadgets</SelectItem>
                              <SelectItem value="very-large">Large Boxes / Clothing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Description (Optional)</Label>
                          <Input name="description" placeholder="e.g. Fragile items, urgent delivery" defaultValue={editingParcel?.description} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all" />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Weight (kg)</Label>
                            <Input type="number" step="0.1" name="weight" placeholder="1.5" defaultValue={editingParcel?.weight} onChange={e => setWeight(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all font-bold" required />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Item Count</Label>
                            <Input type="number" name="itemCount" placeholder="1" defaultValue={editingParcel?.itemCount} onChange={e => setItemCount(parseInt(e.target.value))} className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all font-bold" required />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Security Photo</Label>
                        <div className="mt-1 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden h-[220px] group transition-all hover:border-orange-200 hover:bg-orange-50/10">
                          {photoPreview ? (
                            <>
                              <img src={photoPreview} alt="Parcel" className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <Button type="button" size="sm" variant="destructive" className="rounded-full h-12 px-6 shadow-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => { setPhotoPreview(null); setParcelPhoto(null); }}><Trash2 className="h-4 w-4 mr-2" /> Remove</Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-center p-6">
                              <div className="h-16 w-16 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200/50 text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-500">
                                <Camera className="h-8 w-8" />
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase text-slate-900 tracking-wider">Upload Verification Photo</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-1 max-w-[150px]">Required for insurance and safety tracking</p>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" onClick={() => setIsCameraOpen(true)} className="h-10 px-6 rounded-full text-[10px] font-black uppercase text-orange-500 bg-orange-50 hover:bg-orange-100 transition-colors">Camera</Button>
                                <Button type="button" variant="ghost" onClick={() => document.getElementById('parcel-file-input')?.click()} className="h-10 px-6 rounded-full text-[10px] font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Upload</Button>
                                <input id="parcel-file-input" type="file" className="hidden" accept="image/*" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setParcelPhoto(file);
                                    setPhotoPreview(URL.createObjectURL(file));
                                  }
                                }} />
                              </div>
                              <LiveCameraModal
                                isOpen={isCameraOpen}
                                onClose={() => setIsCameraOpen(false)}
                                onCapture={handleLiveCapture}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Charge</p>
                          <p className="text-2xl font-black text-slate-900">₹{Math.round((parseFloat(weight) || 0) * 50 * 1.10) || 0} <span className="text-xs font-medium text-slate-400 ml-1">inc. platform fee</span></p>
                        </div>
                      </div>
                      <div className="flex gap-4 w-full sm:w-auto">
                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="flex-1 h-12 rounded-2xl font-bold text-slate-400 px-8">Discard</Button>
                        <Button type="submit" disabled={loading} className="flex-1 h-14 min-w-[180px] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black uppercase tracking-[0.1em] rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
                          {loading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                          ) : (
                            <><Zap className="mr-2 h-5 w-5" /> {editingParcel ? 'Update Listing' : 'Post Shipment'}</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {filteredParcels.length === 0 ? (
                  <div className="py-12 sm:py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                    <Box className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm sm:text-base font-bold">No parcels found</p>
                  </div>
                ) : (
                  filteredParcels.map(p => {
                    const isSelected = selected?.id === p.id;
                    return (
                      <div key={p.id} onClick={() => setSelected(isSelected ? null : p)} className={`cursor-pointer rounded-3xl border bg-white p-5 transition-all ${isSelected ? 'border-orange-200 shadow-lg' : 'border-slate-100'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><Box className="h-5 w-5" /></div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={p.status} />
                                <span className="text-[10px] font-bold text-slate-300">#{p.id.slice(-6).toUpperCase()}</span>
                              </div>
                              <h3 className="font-bold">{p.fromLocation} → {p.toLocation}</h3>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">₹{p.price}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{p.weight}kg · {p.itemCount} items</p>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isSelected && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-6 mt-6 border-t overflow-hidden">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-3xl flex justify-between items-center">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Receiver</p>
                                    <p className="font-bold text-slate-800">{p.receiverName}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.dispatchEvent(new CustomEvent('start-call', {
                                        detail: {
                                          userId: p.receiverId || p.senderId, // If receiver has no ID, we use sender (fallback) or add it
                                          userName: p.receiverName,
                                          deliveryId: p.id
                                        }
                                      }));
                                    }}
                                    className="h-9 w-9 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </button>
                                </div>
                                {p.travellerName && (p.status !== 'requested') ? (
                                  <div className="p-4 bg-emerald-50 rounded-3xl flex justify-between items-center transition-all animate-in fade-in slide-in-from-left-4">
                                    <div>
                                      <p className="text-[10px] font-bold text-emerald-600/60 uppercase">Traveller</p>
                                      <p className="font-bold text-slate-800">{p.travellerName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.dispatchEvent(new CustomEvent('start-call', {
                                            detail: {
                                              userId: p.travellerId,
                                              userName: p.travellerName,
                                              deliveryId: p.id
                                            }
                                          }));
                                        }}
                                        className="h-9 w-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
                                      >
                                        <Phone className="h-4 w-4" />
                                      </button>

                                      <button onClick={(e) => { e.stopPropagation(); setActiveChat(p.id); }} className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center"><MessageCircle className="h-4 w-4" /></button>
                                    </div>
                                  </div>
                                ) : p.status === 'requested' ? (
                                  <div className="flex flex-col gap-3 w-full animate-in zoom-in-95">
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex justify-between items-center">
                                      <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">{(p.travellerName || "T").charAt(0)}</div>
                                        <div>
                                          <p className="text-[9px] font-bold text-orange-600 uppercase leading-none">New Request from</p>
                                          <p className="font-extrabold text-slate-900 text-sm mt-1">{p.travellerName || "A Traveller"}</p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setProfileUser(p.travellerData || null); }} className="h-8 rounded-full text-[9px] font-black uppercase px-4 border-orange-200 text-orange-600">Profile</Button>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                      <Button onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }} disabled={isAccepting === p.id} className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20">
                                        {isAccepting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPROVE'}
                                      </Button>
                                      <Button onClick={(e) => { e.stopPropagation(); updateParcelStatus(p.id, "open_for_travellers"); refresh(); }} variant="ghost" className="h-12 px-6 rounded-2xl font-bold text-slate-400 hover:text-red-500 hover:bg-red-50">DECLINE</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2 italic">
                                    <div className="h-1.5 w-1.5 bg-slate-200 rounded-full animate-pulse" />
                                    WAITING FOR TRAVELLER...
                                  </div>
                                )}
                              </div>

                              {p.pickupOtp && (p.status === 'accepted' || p.status === 'picked-up') && (
                                <div className="mt-4 bg-orange-500 text-white p-4 rounded-2xl text-center shadow-lg shadow-orange-500/20">
                                  <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Pickup Verification OTP</p>
                                  <p className="text-3xl font-bold tracking-[0.3em] font-mono">{p.pickupOtp}</p>
                                  <p className="text-[9px] mt-2 opacity-80">Share this with traveller ONLY when you hand over the parcel</p>
                                </div>
                              )}

                              {(p.status === 'picked-up' || p.status === 'in-transit') && (
                                <div className="mt-4 h-48 bg-slate-900 rounded-[2rem] relative overflow-hidden group shadow-inner">
                                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                    <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-3 shadow-xl shadow-orange-500/20 animate-bounce">
                                      <Navigation2 className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.25em] mb-1">Live Tracking Active</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Traveller is moving towards destination</p>
                                    <Button size="sm" variant="ghost" className="mt-4 text-orange-500 hover:bg-orange-500/10 text-[9px] font-black uppercase tracking-widest h-8" onClick={(e) => { e.stopPropagation(); setTrackingModal(p); }}>View Live Map</Button>
                                  </div>
                                  <div className="absolute top-4 right-4 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                </div>
                              )}

                              <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="flex-1 rounded-full text-[10px] font-bold uppercase">Edit</Button>
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="flex-1 rounded-full text-[10px] font-bold uppercase text-red-500 border-red-100 hover:bg-red-50">Cancel</Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="incoming" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="bg-white rounded-3xl p-6 border border-slate-100 mb-6 flex justify-between items-center">
              <div>
                <h2 className="font-bold">Welcome, {user.name}</h2>
                <p className="text-xs font-bold text-slate-400">Browsing incoming parcels for {user.phone}</p>
              </div>
              <div className="h-10 w-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center"><Handshake /></div>
            </div>

            <div className="space-y-4">
              {incomingParcels.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="font-bold text-sm">No incoming parcels found</p>
                </div>
              ) : (
                incomingParcels.map(p => (
                  <div key={p.id} className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                     {/* Card Glow Effect */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full group-hover:bg-orange-500/10 transition-colors" />
                     
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={p.status} />
                          <span className="text-[10px] font-bold text-slate-300">#{p.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <h3 className="font-black text-slate-800 uppercase tracking-tight">{p.fromLocation}</h3>
                           <div className="flex-1 flex items-center min-w-[40px] px-2 relative group-hover:scale-110 transition-transform">
                              <div className="h-0.5 w-full bg-slate-100 rounded-full relative overflow-hidden">
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                              </div>
                              <Navigation2 className="h-3 w-3 text-orange-500 rotate-90 absolute right-0" />
                           </div>
                           <h3 className="font-black text-slate-800 uppercase tracking-tight">{p.toLocation}</h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-600">Sender: {p.senderName}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('start-call', {
                              detail: {
                                userId: p.senderId,
                                userName: p.senderName,
                                deliveryId: p.id
                              }
                            }));
                          }}
                          className="text-xs text-blue-500 font-bold hover:underline"
                        >
                          {p.senderPhone}
                        </button>

                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                      <div className="grid grid-cols-4 gap-2">
                        {['pending', 'picked-up', 'in-transit', 'delivered'].map((step, idx) => {
                          const statusStr = p.status?.toLowerCase() || 'pending';
                          const stepsArr = ['pending', 'picked-up', 'in-transit', 'delivered', 'received', 'completed'];
                          const currentIdx = stepsArr.indexOf(statusStr);
                          const normalizedIdx = currentIdx > 3 ? 3 : currentIdx;
                          const isActive = idx <= normalizedIdx;
                          return (
                            <div key={step} className={`h-2 rounded-full relative overflow-hidden ${isActive ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 'bg-slate-200 opacity-50'}`}>
                               {isActive && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full -translate-x-full animate-[shimmer_3s_infinite]" style={{ animationDelay: `${idx * 0.5}s` }} />
                               )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Pending</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Delivered</span>
                      </div>
                    </div>

                    {p.deliveryOtp && (p.status === 'in-transit' || p.status === 'accepted' || p.status === 'picked-up') && (
                      <div className="bg-orange-500 text-white p-4 rounded-2xl text-center mb-4">
                        <p className="text-[10px] font-bold uppercase opacity-70 mb-1">Receiver Delivery OTP</p>
                        <p className="text-3xl font-bold tracking-[0.3em] font-mono">{p.deliveryOtp}</p>
                        <p className="text-[9px] mt-2 opacity-80">Share this with traveller ONLY when you get the item</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent('start-call', {
                            detail: {
                              userId: p.senderId,
                              userName: p.senderName,
                              deliveryId: p.id
                            }
                          }));
                        }}
                        className="flex-1 rounded-xl text-[10px] font-bold h-9"
                      >
                        CALL SENDER
                      </Button>
                      {p.status === 'delivered' && (
                        <Button onClick={() => handleMarkReceived(p.id)} className="flex-1 bg-green-600 text-white rounded-xl text-[10px] font-bold h-9">I GOT IT</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Tracking Modal */}
      <AnimatePresence>
        {trackingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-orange-400" />
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={trackingModal.status} />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Live Tracking Active</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none italic">
                    {trackingModal.fromLocation} → {trackingModal.toLocation}
                  </h3>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setTrackingModal(null)} className="rounded-full h-12 w-12 hover:bg-white shadow-sm border border-slate-100">
                  <X className="h-5 w-5 text-slate-400" />
                </Button>
              </div>

              <div className="p-0 h-[500px] bg-slate-100 relative group overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-50 grayscale" />

                {/* Visual Route Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" preserveAspectRatio="none">
                  <path d="M 100 400 Q 300 100 500 400" stroke="orange" strokeWidth="4" fill="transparent" strokeDasharray="10 10" className="animate-[dash_20s_linear_infinite]" />
                </svg>

                {/* Tracking UI Overlays */}
                <div className="absolute top-8 left-8 space-y-3">
                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/20 flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700">
                    <div className="h-12 w-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                      <Bike className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Traveller</p>
                      <p className="text-sm font-black text-slate-900 leading-none mt-0.5">{trackingModal.travellerName || "On the move"}</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/5 flex items-center gap-4 animate-in fade-in slide-in-from-left duration-700 delay-100">
                    <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                      <Clock className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Estimated Arrival</p>
                      <p className="text-sm font-black text-white leading-none">~ 45 Minutes</p>
                    </div>
                  </div>
                </div>

                {/* Glowing Marker */}
                <div className="absolute top-[20%] left-[45%] group -translate-x-1/2 -translate-y-1/2">
                  <div className="absolute inset-0 h-12 w-12 bg-orange-500 rounded-full blur-xl animate-pulse opacity-50" />
                  <div className="relative h-10 w-10 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-orange-500 border-2 border-orange-500 animate-bounce">
                    <Navigation className="h-5 w-5 fill-orange-500" />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                <div className="flex gap-4 items-center">
                  <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center font-black text-2xl text-slate-900">
                    {(trackingModal.travellerName || "T").charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">In Transit</p>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none">{trackingModal.travellerName || "Local Traveller"}</h4>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('start-call', {
                        detail: {
                          userId: trackingModal.travellerId,
                          userName: trackingModal.travellerName,
                          deliveryId: trackingModal.id
                        }
                      }));
                    }}
                    className="h-14 w-14 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm"
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                  <Button
                    onClick={() => { setTrackingModal(null); setActiveChat(trackingModal.id); }}
                    className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3"
                  >
                    <MessageSquare className="h-4 w-4" /> Message Hub
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal Layer */}
      <AnimatePresence>
        {activeChat && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[200] max-w-md mx-auto px-4 pointer-events-none"
          >
            <div className="pointer-events-auto">
              <ParcelChat
                deliveryId={activeChat}
                currentUserId={user?.id || ""}
                onClose={() => setActiveChat(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Rating Feedback Modal */}
      {ratingParcel && (
        <RatingModal 
          parcelId={ratingParcel.id}
          revieweeId={ratingParcel.travellerId || ""}
          revieweeName={ratingParcel.travellerName || "Traveller"}
          onClose={() => setRatingParcel(null)}
          onSuccess={() => {
            setRatingParcel(null);
            refresh();
          }}
        />
      )}

    </div>
  );
}
