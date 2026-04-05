import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, PackageCheck, Handshake, CheckCircle2, Star, Navigation, Zap, Box,
    Weight, Bell, LayoutDashboard, Search, History, ShieldCheck, Key,
    MessageCircle, MessageSquare, Clock, Navigation2, Check, RefreshCw, Sparkles, Home, User,
    ArrowRight, ArrowLeft, Layers, Phone, Bike, Car, Bus,
    ExternalLink, ChevronDown, ChevronUp, CreditCard, Plus,
    Info, ChevronRight, Map, Trash2, X, Camera, CheckCircle, Loader2
} from "lucide-react";
import { locations } from "@/lib/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import {
    searchParcels, updateParcelStatus, getParcelById,
    requestParcel, getMyDeliveries, type Parcel, type UserData, mapParcel, uploadParcelPhoto,
    subscribeToParcel
} from "@/lib/parcelStore";

import UserProfileModal from "@/components/UserProfileModal";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Label } from "@/components/ui/label";
import ParcelChat from "@/components/ParcelChat";

export default function Traveller() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // -- Data State --
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [results, setResults] = useState<Parcel[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<Parcel[]>([]);
    const [activeTab, setActiveTab] = useState<"deliveries" | "search">("deliveries");
    const [profileUser, setProfileUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isWaitingForAccept, setIsWaitingForAccept] = useState(false);

    // -- Delivery Flow State --
    const [flowStep, setFlowStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0); // 0=List, 1=Details, 2=Pickup, 3=Map, 4=Delivery, 5=Complete
    const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);
    const [otpValue, setOtpValue] = useState(["", "", "", ""]);
    const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
    const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
    const [pickupPhotoFile, setPickupPhotoFile] = useState<File | null>(null);
    const [deliveryPhotoFile, setDeliveryPhotoFile] = useState<File | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(true);

    const locationsDatalist = useMemo(() => (
      <datalist id="locs">
        {locations.map((loc) => (
          <option key={loc.name} value={loc.name}>
             {loc.type} - {loc.mandal}
          </option>
        ))}
      </datalist>
    ), []);

    const loadMyDeliveries = useCallback(async () => {
        try {
            const data = await getMyDeliveries();
            setMyDeliveries(data);

            const activeOne = data.find(p => ['accepted', 'picked-up', 'in-transit', 'arrived'].includes(p.status));
            if (activeOne && !activeParcel) {
                setActiveParcel(activeOne);
                setFlowStep(1);
                setActiveTab("deliveries");
            }
            if (activeParcel) {
                const updated = data.find(p => p.id === activeParcel.id);
                if (updated) setActiveParcel(updated);
            }
        } catch { /* ignore */ }
    }, [activeParcel]);

    useEffect(() => {
        if (!user?.id) return;
        loadMyDeliveries();
        
        // 🧂 Session-Unique Salt for Traveller
        const sessionId = Math.random().toString(36).substring(7);
        const channelId = `traveller-updates-${user.id}-${sessionId}`;
        const channel = supabase
          .channel(channelId)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'parcels', filter: `traveller_id=eq.${user.id}` },
            () => loadMyDeliveries()
          )
          .subscribe();
          
        return () => { 
          supabase.removeChannel(channel); 
        };
    }, [user?.id, loadMyDeliveries]);

    const handleSearch = useCallback(async () => {
        setLoading(true);
        try {
            const origin = from || user?.city || "";
            const data = await searchParcels(origin, to || "");
            const filtered = data.filter(p => p.senderId !== user?.id);
            setResults(filtered);
        } catch {
            toast.error("Failed to load list");
        } finally {
            setLoading(false);
        }
    }, [from, to, user?.id, user?.city]);

    useEffect(() => {
        if (activeTab === "search" && results.length === 0) {
            handleSearch();
        }
    }, [activeTab, results.length, handleSearch]);

    const handleRequest = async (id: string) => {
        if (!user) return;
        try {
            setIsWaitingForAccept(true);
            await requestParcel(id, user.name);
            toast.info("Request sent! Waiting for approval.");
            handleSearch();
        } catch (err: any) {
            setIsWaitingForAccept(false);
            toast.error("Failed to send request");
        }
    };

    const handleArrivedAtPickup = async (parcelId?: string) => {
        const id = parcelId || activeParcel?.id;
        if (!id) return;
        try {
            await updateParcelStatus(id, 'arrived');
            toast.info("Sender notified of your arrival!");
        } catch (e) { /* ignore */ }
        setFlowStep(2);
        setOtpError(null);
        setOtpValue(["", "", "", ""]);
    };

    const handleConfirmPickup = async () => {
        if (!activeParcel || !pickupPhotoFile) {
            toast.error("Please capture a photo first!");
            return;
        }
        setIsProcessing(true);
        try {
            const photoUrl = await uploadParcelPhoto(activeParcel.id, pickupPhotoFile, "pickup");
            await updateParcelStatus(activeParcel.id, "picked-up", undefined, undefined, photoUrl);
            toast.success("Pickup Confirmed!");
            setFlowStep(3);
            setShowMap(true);
            loadMyDeliveries();
        } catch (err: any) {
            toast.error("Pickup confirmation failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleArrivedAtReceiver = () => {
        setFlowStep(4);
        setOtpError(null);
        setOtpValue(["", "", "", ""]);
    };

    const handleConfirmDelivery = async () => {
        if (!activeParcel || !deliveryPhotoFile) {
            toast.error("Please capture a delivery photo!");
            return;
        }
        const otpCode = otpValue.join("");
        if (otpCode.length < 4) {
            setOtpError("Enter 4-digit OTP");
            return;
        }
        setIsProcessing(true);
        try {
            const photoUrl = await uploadParcelPhoto(activeParcel.id, deliveryPhotoFile, "delivery");
            await updateParcelStatus(activeParcel.id, "delivered", undefined, otpCode, photoUrl);
            setFlowStep(5);
            loadMyDeliveries();
        } catch (err: any) {
            toast.error("Delivery confirmation failed. Check OTP.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>, type: 'pickup' | 'delivery') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (type === 'pickup') {
            setPickupPhotoFile(file);
            setPickupPhoto(URL.createObjectURL(file));
        } else {
            setDeliveryPhotoFile(file);
            setDeliveryPhoto(URL.createObjectURL(file));
        }
    };

    const resetFlow = () => {
        setFlowStep(0);
        setActiveParcel(null);
        setOtpValue(["", "", "", ""]);
        setPickupPhoto(null);
        setDeliveryPhoto(null);
        setPickupPhotoFile(null);
        setDeliveryPhotoFile(null);
        setIsWaitingForAccept(false);
    };

    const handleOtpInput = (val: string, index: number) => {
        const newOtp = [...otpValue];
        newOtp[index] = val.slice(-1);
        setOtpValue(newOtp);
        if (val && index < 3) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 mx-auto max-w-4xl px-4 pb-20 pt-20">
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400/60">
        <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Dashboard</span>
        <span className="opacity-40">/</span>
        <span className="hover:text-orange-500 cursor-pointer transition-colors" onClick={() => setActiveTab('deliveries')}>Logistics</span>
        <span className="opacity-40">/</span>
        <span className="text-slate-900">Traveller Portal</span>
      </div>

            <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-8 overflow-hidden rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 bg-white"
            >
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-5">
                        <div className="group relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-xl shadow-orange-500/30 text-white transition-transform hover:scale-105">
                            <Navigation className="h-8 w-8 animate-float-slow" />
                            <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Traveller Hub</h1>
                            <p className="text-sm font-medium text-slate-400 mt-1">Accept local deliveries and earn on your way</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-orange-50/50 p-4 rounded-3xl border border-orange-100">
                       <div className="text-right">
                          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-widest leading-none mb-1">TOTAL EARNINGS</span>
                          <span className="text-3xl font-black text-orange-600 leading-none">₹{myDeliveries.reduce((acc, curr) => acc + (curr.status === 'delivered' ? curr.price || 0 : 0), 0)}</span>
                       </div>
                       <div className="h-10 w-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                          <CreditCard className="h-5 w-5" />
                       </div>
                    </div>
                </div>

                <div className="mt-10 flex gap-2 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
                    <button
                        onClick={() => setActiveTab("deliveries")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "deliveries" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <History className="h-4 w-4" /> MY DELIVERIES
                    </button>
                    <button
                        onClick={() => setActiveTab("search")}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === "search" ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <Search className="h-4 w-4" /> FIND PARCELS
                    </button>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === "search" && flowStep === 0 && (
                    <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
                            <div className="space-y-4">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                     <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">From City</Label>
                                     <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="e.g. Kakinada" list="locs" className="mt-1" autoComplete="off" />
                                  </div>
                                  <div>
                                     <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">To City</Label>
                                     <Input value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. Rajahmundry" list="locs" className="mt-1" autoComplete="off" />
                                  </div>
                               </div>
                               {locationsDatalist}
                               <Button className="w-full h-12 bg-orange-500 rounded-xl" onClick={handleSearch} disabled={loading}>{loading ? "..." : "SEARCH FEED"}</Button>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {results.length === 0 ? (
                                <div className="text-center py-20 opacity-30"><Search className="h-12 w-12 mx-auto" /><p className="font-bold mt-2">No parcels found</p></div>
                            ) : (
                                results.map(p => (
                                    <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group">
                                       <div>
                                          <h4 className="font-black text-slate-800">{p.description}</h4>
                                          <p className="text-xs text-slate-400 font-bold">{p.fromLocation} → {p.toLocation}</p>
                                       </div>
                                       <div className="text-right flex flex-col items-end gap-2">
                                          <span className="text-xl font-bold text-orange-600">₹{p.price}</span>
                                          <Button size="sm" onClick={() => handleRequest(p.id)} className="rounded-full px-4 text-[9px] font-black h-8 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all">REQUEST</Button>
                                       </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === "deliveries" && flowStep === 0 && (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {myDeliveries.length === 0 ? (
                           <div className="bg-white rounded-[3rem] p-12 border-2 border-dashed border-slate-100 text-center">
                              <Navigation className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                              <h3 className="font-bold text-slate-800">No active deliveries</h3>
                              <p className="text-xs text-slate-400 mt-1">Request a parcel to start earning</p>
                              <Button variant="outline" className="mt-6 rounded-full" onClick={() => setActiveTab("search")}>Find Parcels</Button>
                           </div>
                        ) : (
                           myDeliveries.map(p => (
                              <div key={p.id} onClick={() => { setActiveParcel(p); setFlowStep(1); }} className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-orange-200 cursor-pointer transition-all flex justify-between items-center group">
                                 <div className="flex gap-4 items-center">
                                    <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-bold">{p.senderName.charAt(0)}</div>
                                    <div>
                                       <p className="font-bold text-slate-800 uppercase text-xs">#{p.id.slice(-6).toUpperCase()}</p>
                                       <p className="text-[10px] font-bold text-slate-400">{p.fromLocation} → {p.toLocation}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <StatusBadge status={p.status} />
                                    <p className="text-lg font-bold text-orange-600 mt-1">₹{p.price}</p>
                                 </div>
                              </div>
                           ))
                        )}
                    </motion.div>
                )}

                {flowStep === 1 && activeParcel && (
                    <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <Button variant="ghost" size="sm" onClick={resetFlow}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-slate-50 space-y-8">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Order ID</p>
                                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">#{activeParcel.id.slice(-8).toUpperCase()}</h3>
                               </div>
                               <StatusBadge status={activeParcel.status} />
                            </div>
                            <div className="space-y-4 py-6 border-y">
                               <div className="flex gap-4">
                                  <MapPin className="h-5 w-5 text-orange-500" />
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Pickup</p><p className="font-bold">{activeParcel.fromLocation}</p></div>
                               </div>
                               <div className="flex gap-4">
                                  <Navigation2 className="h-5 w-5 text-blue-500" />
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Delivery</p><p className="font-bold">{activeParcel.toLocation}</p></div>
                               </div>
                            </div>
                            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl">
                               <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center font-bold text-orange-500 shadow-sm">{activeParcel.senderName.charAt(0)}</div>
                                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Sender</p><p className="font-black">{activeParcel.senderName}</p></div>
                               </div>
                               <div className="flex gap-2">
                                  {activeParcel.status !== 'requested' && <a href={`tel:${activeParcel.senderPhone}`} className="h-10 w-10 bg-white border rounded-xl flex items-center justify-center shadow-sm"><Phone className="h-4 w-4" /></a>}
                                  <button onClick={() => setActiveChat(activeParcel.id)} className="h-10 w-10 bg-orange-500 text-white rounded-xl flex items-center justify-center"><MessageSquare className="h-4 w-4" /></button>
                               </div>
                            </div>
                            {activeParcel.status !== 'requested' ? (
                               <Button className="w-full h-16 bg-emerald-600 rounded-3xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20" onClick={() => handleArrivedAtPickup()}>MARK AS ARRIVED AT PICKUP</Button>
                            ) : (
                               <div className="w-full h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase tracking-widest border-2 border-dashed italic">Waiting for sender's approval...</div>
                            )}
                        </div>
                    </motion.div>
                )}

                {flowStep === 2 && activeParcel && (
                   <motion.div key="step-2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                      <div className="text-center font-heading"><h2 className="text-3xl font-black">Verify Pickup</h2><p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Handover from Sender</p></div>
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                         <div className="h-64 bg-slate-50 border-2 border-dashed rounded-3xl overflow-hidden relative flex flex-col items-center justify-center">
                            {pickupPhoto ? (
                               <img src={pickupPhoto} className="w-full h-full object-cover" alt="Proof" />
                            ) : (
                               <div onClick={() => fileInputRef.current?.click()} className="text-center cursor-pointer p-10"><Camera className="h-10 w-10 mx-auto text-orange-500 mb-2" /><p className="text-xs font-bold text-slate-400">TAP TO CAPTURE PARCEL</p></div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, 'pickup')} />
                         </div>
                         <Button className="w-full h-16 bg-orange-500 rounded-3xl font-black" onClick={handleConfirmPickup} disabled={isProcessing || !pickupPhotoFile}>CONFIRM PICKUP</Button>
                      </div>
                   </motion.div>
                )}

                {flowStep === 3 && activeParcel && (
                   <motion.div key="step-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[400px] flex flex-col gap-4">
                      <div className="bg-slate-900 flex-1 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent" />
                         <Navigation className="h-12 w-12 text-orange-500 mb-4 animate-bounce" />
                         <h3 className="text-white text-xl font-black">On the way to Receiver</h3>
                         <p className="text-slate-400 text-sm mt-2">{activeParcel.toLocation}</p>
                      </div>
                      <Button className="h-16 bg-orange-500 rounded-3xl font-black uppercase text-sm" onClick={handleArrivedAtReceiver}>ARRIVED AT RECEIVER</Button>
                   </motion.div>
                )}

                {flowStep === 4 && activeParcel && (
                   <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <div className="text-center"><h2 className="text-3xl font-black">Deliver Parcel</h2><p className="text-slate-400 font-bold uppercase text-xs">Verify with Receiver</p></div>
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-6">
                         <div className="p-5 bg-slate-50 rounded-3xl"><p className="text-[10px] font-bold text-slate-400 uppercase">Recipient</p><p className="font-black text-lg">{activeParcel.receiverName}</p></div>
                         <div className="flex justify-center gap-3">
                            {otpValue.map((d, i) => <input key={i} id={`otp-${i}`} className="w-14 h-16 bg-slate-50 border-2 rounded-2xl text-center text-2xl font-bold outline-none focus:border-orange-500" value={d} onChange={e => handleOtpInput(e.target.value, i)} onKeyDown={e => handleOtpKeyDown(e, i)} maxLength={1} />)}
                         </div>
                         <div className="h-48 bg-slate-50 border-2 border-dashed rounded-3xl overflow-hidden relative flex flex-col items-center justify-center">
                            {deliveryPhoto ? (
                               <img src={deliveryPhoto} className="w-full h-full object-cover" />
                            ) : (
                               <div onClick={() => fileInputRef.current?.click()} className="text-center cursor-pointer"><Camera className="h-8 w-8 mx-auto text-orange-500 mb-2" /><p className="text-[10px] font-bold text-slate-400 uppercase">CAPTURE DELIVERY PROOF</p></div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, 'delivery')} />
                         </div>
                         {otpError && <p className="text-red-500 text-center font-bold text-[10px] uppercase">{otpError}</p>}
                         <Button className="w-full h-16 bg-emerald-600 rounded-3xl font-black" onClick={handleConfirmDelivery} disabled={isProcessing || !deliveryPhotoFile}>CONFIRM DELIVERY</Button>
                      </div>
                   </motion.div>
                )}

                {flowStep === 5 && activeParcel && (
                   <div className="text-center py-20">
                      <div className="h-24 w-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl mb-8"><Check className="h-12 w-12" /></div>
                      <h2 className="text-3xl font-black mb-2">Well Done!</h2>
                      <p className="text-slate-400 font-bold mb-8">Delivery confirmed and earnings added.</p>
                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-left mb-8 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 h-40 w-40 bg-orange-500/10 blur-[60px]" />
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payout</p>
                         <p className="text-5xl font-black text-white mt-1">₹{activeParcel.price}</p>
                      </div>
                      <Button className="w-full h-16 bg-orange-500 rounded-3xl font-black" onClick={resetFlow}>GO TO DASHBOARD</Button>
                   </div>
                )}
            </AnimatePresence>



            {profileUser && <UserProfileModal user={profileUser} isOpen={!!profileUser} onClose={() => setProfileUser(null)} />}
            
            <AnimatePresence>
               {activeChat && (
                  <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveChat(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                     <motion.div initial={{ opacity: 0, y: 100, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 100, scale: 0.95 }} className="relative w-full max-w-lg z-10">
                        <ParcelChat deliveryId={activeChat} currentUserId={user?.id || ""} onClose={() => setActiveChat(null)} />
                     </motion.div>
                  </div>
               )}
            </AnimatePresence>

            {isWaitingForAccept && (
               <div className="fixed inset-0 z-[100] bg-white/95 flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-300">
                  <div className="relative mb-8 text-orange-500">
                     <div className="h-20 w-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Request Pending</h2>
                  <p className="text-sm text-slate-400 font-bold max-w-xs">{activeParcel?.senderName} will review your profile shortly.</p>
                  <Button variant="ghost" className="mt-8 text-[10px] font-bold uppercase tracking-widest text-slate-300" onClick={resetFlow}>Cancel Request</Button>
               </div>
            )}
        </div>
    );
}
