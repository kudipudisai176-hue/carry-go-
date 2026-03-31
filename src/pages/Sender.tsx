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
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (innerErr) {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = fallbackStream;
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

  const [checkoutParcel, setCheckoutParcel] = useState<Parcel | null>(null);
  const [showScanner, setShowScanner] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAllParcels('sender');
      setParcels(data);
    } catch (err) {
      console.error("Failed to load parcels:", err);
    }
  }, []);

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

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('sender-parcel-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'parcels', filter: `sender_id=eq.${user.id}` },
        (payload) => {
          refresh();
          if (payload.new && (payload.new as any).status === 'requested') {
            toast.info("A traveller has requested to carry your parcel! 📦");
            sendBrowserNotification("New Delivery Request!", "Check your dashboard to approve the traveller.");
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh, sendBrowserNotification]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
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
    const fd = new FormData(e.currentTarget);
    if (!user?.id) {
      toast.error("You must be logged in to create a parcel.");
      return;
    }

    const parcelData: any = {
      senderName: user.name || "Me",
      receiverName: fd.get("receiverName") as string,
      receiverPhone: `+91${fd.get("receiverPhone")}`,
      fromLocation: fd.get("fromLocation") as string,
      toLocation: fd.get("toLocation") as string,
      weight: parseFloat(weight) || 0,
      size: size,
      itemCount: itemCount,
      vehicleType: selectedVehicle,
      paymentMethod: paymentMethod,
      description: fd.get("description") as string,
      senderId: user?.id || "",
    };

    let photoBase64 = undefined;
    if (parcelPhoto) {
      photoBase64 = await fileToBase64(parcelPhoto);
    }

    if (editingParcel) {
      setLoading(true);
      try {
        await updateParcel(editingParcel.id, parcelData, photoBase64);
        toast.success("Parcel updated successfully!");
        setEditingParcel(null);
        resetForm();
      } catch (err: any) {
        toast.error("Failed to update parcel: " + (err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const resp = await createParcel(parcelData, photoBase64);
      setLatestCreated(resp);
      resetForm();
      toast.success("Parcel posted successfully!");
    } catch (err: any) {
      toast.error(`Parcel creation failed: ${err.message}`);
    } finally {
      setLoading(false);
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
    stopCamera();
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
    await markReceived(id);
    toast.success("Parcel marked as received!");
    handleSearchIncoming();
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-orange-500 font-bold uppercase tracking-[0.3em] animate-pulse">Initializing Dashboard...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 mx-auto max-w-4xl px-4 pb-20 pt-20">
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
        className="relative mb-8 overflow-hidden rounded-[2.5rem] p-10 shadow-xl border border-white bg-white"
      >
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg">
              <Box className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Dashboard</h1>
              <p className="text-sm font-bold text-slate-400">Manage your logistics pipeline</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-2xl px-8"
            >
              <Plus className="mr-2 h-5 w-5" /> NEW PARCEL
            </Button>
          </div>
        </div>

        <div className="mt-10 flex gap-2 rounded-[1.5rem] bg-slate-100 p-1.5 border border-slate-200">
          <button
            onClick={() => setActiveTab("outgoing")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "outgoing" ? "bg-orange-500 text-white shadow-lg" : "text-black hover:bg-slate-200/50"}`}
          >
            <Box className="h-4 w-4" /> SENT (OUTBOX)
          </button>
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "incoming" ? "bg-orange-500 text-white shadow-lg" : "text-black hover:bg-slate-200/50"}`}
          >
            <Handshake className="h-4 w-4" /> RECEIVED (INBOX)
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "outgoing" ? (
          <motion.div key="outgoing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="grid grid-cols-4 gap-3">
              {[{ id: "all", label: "Total", value: statusCounts.all, color: "orange" }, { id: "pending", label: "Pending", value: statusCounts.pending, color: "amber" }, { id: "inTransit", label: "Transit", value: statusCounts.inTransit, color: "blue" }, { id: "delivered", label: "Done", value: statusCounts.delivered, color: "emerald" }].map(s => (
                <div key={s.id} onClick={() => setFilter(s.id as any)} className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border p-3 transition-all ${filter === s.id ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                  <span className="text-xl font-bold">{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-6">
              {showForm && (
                <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-secondary" /> {editingParcel ? 'Edit Parcel' : 'Send New Parcel'}</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-slate-400">Receiver Name</Label>
                        <Input name="receiverName" defaultValue={editingParcel?.receiverName} className="mt-1" required />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-slate-400">Receiver Phone</Label>
                        <div className="flex mt-1 rounded-md border border-slate-200 overflow-hidden">
                          <span className="bg-slate-50 px-3 flex items-center text-sm font-bold text-slate-400 border-r border-slate-200">+91</span>
                          <input name="receiverPhone" defaultValue={editingParcel?.receiverPhone?.replace('+91', '')} className="flex-1 px-3 py-2 outline-none text-sm" required maxLength={10} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-slate-400">From</Label>
                        <Input name="fromLocation" defaultValue={editingParcel?.fromLocation} required />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-slate-400">To</Label>
                        <Input name="toLocation" defaultValue={editingParcel?.toLocation} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-4">
                          <div>
                            <Label className="text-[10px] font-bold uppercase text-slate-400">Description</Label>
                            <Input name="description" defaultValue={editingParcel?.description} required />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-[10px] font-bold uppercase text-slate-400">Weight (kg)</Label>
                              <Input type="number" step="0.1" name="weight" defaultValue={editingParcel?.weight} onChange={e => setWeight(e.target.value)} required />
                            </div>
                            <div className="flex-1">
                              <Label className="text-[10px] font-bold uppercase text-slate-400">Items</Label>
                              <Input type="number" name="itemCount" defaultValue={editingParcel?.itemCount} onChange={e => setItemCount(parseInt(e.target.value))} required />
                            </div>
                          </div>
                       </div>
                       <div>
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Live Photo</Label>
                          <div className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden h-[120px]">
                            {photoPreview ? (
                              <>
                                <img src={photoPreview} alt="Parcel" className="absolute inset-0 w-full h-full object-cover" />
                                <Button type="button" size="sm" variant="destructive" className="absolute top-2 right-2 rounded-full h-6 w-6 p-0" onClick={() => { setPhotoPreview(null); setParcelPhoto(null); }}><X className="h-3 w-3" /></Button>
                              </>
                            ) : isCameraOpen ? (
                              <>
                                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
                                <div className="absolute bottom-2 flex gap-2">
                                  <Button type="button" size="sm" onClick={capturePhoto} className="bg-emerald-500 h-8 px-4 rounded-full text-xs">Capture</Button>
                                  <Button type="button" size="sm" variant="destructive" onClick={stopCamera} className="h-8 w-8 rounded-full p-0"><X className="h-4 w-4" /></Button>
                                </div>
                              </>
                            ) : (
                              <Button type="button" variant="outline" onClick={startCamera} className="rounded-full"><Camera className="h-4 w-4 mr-2" /> Camera</Button>
                            )}
                          </div>
                       </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit" disabled={loading} className="bg-secondary text-white rounded-xl px-8">
                        {loading ? 'Wait...' : (editingParcel ? 'Update' : 'Post')}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {filteredParcels.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                    <Box className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="font-bold">No parcels found</p>
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
                                     <a href={`tel:${p.receiverPhone}`} className="h-9 w-9 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"><Phone className="h-4 w-4" /></a>
                                  </div>
                                  {p.travellerName ? (
                                    <div className="p-4 bg-emerald-50 rounded-3xl flex justify-between items-center">
                                      <div>
                                         <p className="text-[10px] font-bold text-emerald-600/60 uppercase">Traveller</p>
                                         <p className="font-bold text-slate-800">{p.travellerName}</p>
                                      </div>
                                      <a href={`tel:${p.travellerPhone}`} className="h-9 w-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Phone className="h-4 w-4" /></a>
                                    </div>
                                  ) : p.status === 'requested' ? (
                                    <Button onClick={(e) => { e.stopPropagation(); handleAccept(p.id); }} className="h-full bg-emerald-500 text-white rounded-3xl">APPROVE TRAVELLER</Button>
                                  ) : (
                                    <div className="p-4 bg-slate-50 border border-dashed rounded-3xl text-xs text-slate-400 italic">Searching for traveller...</div>
                                  )}
                               </div>

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
                  <div key={p.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <StatusBadge status={p.status} />
                             <span className="text-[10px] font-bold text-slate-300">#{p.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <h3 className="font-bold">{p.fromLocation} → {p.toLocation}</h3>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-slate-600">Sender: {p.senderName}</p>
                          <a href={`tel:${p.senderPhone}`} className="text-xs text-blue-500 font-bold">{p.senderPhone}</a>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                       <div className="grid grid-cols-4 gap-2">
                          {['pending', 'picked-up', 'in-transit', 'delivered'].map((step, idx) => {
                             const statusStr = p.status?.toLowerCase() || 'pending';
                             const stepsArr = ['pending', 'picked-up', 'in-transit', 'delivered', 'received', 'completed'];
                             const currentIdx = stepsArr.indexOf(statusStr);
                             const normalizedIdx = currentIdx > 3 ? 3 : currentIdx;
                             const color = idx <= normalizedIdx ? 'bg-orange-500' : 'bg-slate-200';
                             return <div key={step} className={`h-1.5 rounded-full ${color}`} />;
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
                       <a href={`tel:${p.senderPhone}`} className="flex-1"><Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-bold">CALL SENDER</Button></a>
                       {p.status === 'delivered' && (
                         <Button onClick={() => handleMarkReceived(p.id)} className="flex-1 bg-green-600 text-white rounded-xl text-[10px] font-bold">I GOT IT</Button>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab="sender" />
    </div>
  );
}
