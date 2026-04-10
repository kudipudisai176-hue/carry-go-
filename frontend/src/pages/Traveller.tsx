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
import { locations, type Location } from "@/lib/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import {
   searchParcels, updateParcelStatus, getParcelById,
   requestParcel, getMyDeliveries, type Parcel, type UserData, mapParcel, uploadParcelPhoto,
   type ParcelStatus
} from "@/lib/parcelStore";

import UserProfileModal from "@/components/UserProfileModal";
import { toast } from "sonner";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import ParcelChat from "@/components/ParcelChat";
import { socket } from "@/lib/socket";

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
         {locations.map((loc: Location) => (
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

         const activeOne = data.find((p: Parcel) => ['accepted', 'assigned', 'picked-up', 'in-transit', 'arrived'].includes(p.status));
         if (activeOne && !activeParcel) {
            setActiveParcel(activeOne);
            setActiveTab("deliveries");

            // Smart mapping based on status
            if (activeOne.status === 'accepted' || activeOne.status === 'assigned') setFlowStep(1);
            else if (activeOne.status === 'arrived') setFlowStep(2);
            else if (activeOne.status === 'picked-up') setFlowStep(3);
            else if (activeOne.status === 'in-transit') setFlowStep(4);
         }
         if (activeParcel) {
            const updated = data.find(p => p.id === activeParcel.id);
            if (updated) {
               setActiveParcel(updated);
               // Update flow step if status changed externally
               if (updated.status === 'accepted' || updated.status === 'assigned') setFlowStep(1);
               else if (updated.status === 'arrived') setFlowStep(2);
               else if (updated.status === 'picked-up' && flowStep < 3) setFlowStep(3);
            }
         }
      } catch { /* ignore */ }
   }, [activeParcel, flowStep]);

   useEffect(() => {
      if (!user?.id) return;
      loadMyDeliveries();
   }, [user?.id, loadMyDeliveries]);

   const handleSearch = useCallback(async () => {
      setLoading(true);
      try {
         const origin = from || user?.city || "";
         const data = await searchParcels(origin, to || "");
         const filtered = data.filter((p: Parcel) => p.senderId !== user?.id);
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

   const handleRequest = (id: string) => {
      if (!user) return;
      actuallySendRequest(id);
   };

   const actuallySendRequest = async (id: string) => {
      try {
         setIsWaitingForAccept(true);
         await requestParcel(id, user!.name);
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
         // Optimistic UI update to prevent race conditions
         if (activeParcel) {
            setActiveParcel({ ...activeParcel, status: 'arrived' });
         }
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

   const handleArrivedAtReceiver = async () => {
      const id = activeParcel?.id;
      if (id) {
         try {
            await updateParcelStatus(id, 'in-transit');
            toast.info("Arrived at Drop Point!");
         } catch (e) { /* ignore */ }
      }
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
         const msg = err?.response?.data?.message || "Delivery confirmation failed. Check OTP.";
         toast.error(msg);
         if (msg.toLowerCase().includes("otp")) setOtpError("Incorrect OTP. Please try again.");
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
                     <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm font-medium text-slate-400">Accept local deliveries and earn on your way</p>
                     </div>
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
                                 <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{p.fromLocation}</p>
                                    <div className="flex items-center min-w-[24px] relative px-1">
                                       <div className="h-[1px] w-full bg-slate-100 rounded-full relative overflow-hidden">
                                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                                       </div>
                                       <Navigation2 className="h-2 w-2 text-orange-400 rotate-90 absolute right-0" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{p.toLocation}</p>
                                 </div>
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

            {activeTab === "deliveries" && flowStep === 1 && activeParcel && (
               <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="text-slate-400 hover:text-orange-500"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard</Button>
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-50 space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-32 w-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Assigned Shipment</p>
                           <h3 className="text-3xl font-black text-slate-900 tracking-tight">#{activeParcel.id.slice(-8).toUpperCase()}</h3>
                        </div>
                        <StatusBadge status={activeParcel.status} />
                     </div>

                     <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center font-black text-orange-500 shadow-sm text-xl border border-slate-100">{(activeParcel.senderName || "S").charAt(0)}</div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sender</p>
                              <p className="text-lg font-black text-slate-900">{activeParcel.senderName}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button
                              onClick={() => {
                                 window.dispatchEvent(new CustomEvent('start-call', {
                                    detail: {
                                       userId: activeParcel.senderId,
                                       userName: activeParcel.senderName,
                                       deliveryId: activeParcel.id
                                    }
                                 }));
                              }}
                              className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm hover:border-orange-500 hover:text-orange-500 transition-all active:scale-95"
                           >
                              <Phone className="h-5 w-5" />
                           </button>
                           <button onClick={() => setActiveChat(activeParcel.id)} className="group relative h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                              <MessageSquare className="h-5 w-5" />
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 border-2 border-white rounded-full animate-pulse" />
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8 border-y border-slate-100">
                        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 group/route transition-all hover:bg-white hover:shadow-lg hover:shadow-orange-500/5">
                           <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold group-hover/route:scale-110 transition-transform"><MapPin className="h-5 w-5" /></div>
                           <div className="flex-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Route Path</p>
                              <div className="flex items-center gap-3 mt-1">
                                 <span className="font-black text-slate-800 text-sm uppercase">{activeParcel.fromLocation}</span>
                                 <div className="flex-1 flex items-center relative px-2">
                                    <div className="h-0.5 w-full bg-slate-200 rounded-full relative overflow-hidden">
                                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                                    </div>
                                    <Navigation2 className="h-3 w-3 text-orange-500 rotate-90 absolute right-0" />
                                 </div>
                                 <span className="font-black text-slate-800 text-sm uppercase">{activeParcel.toLocation}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {activeParcel.status !== 'requested' ? (
                        <Button className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all" onClick={() => handleArrivedAtPickup()}>MARK AS ARRIVED AT PICKUP</Button>
                     ) : (
                        <div className="group w-full h-20 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 transition-colors hover:bg-white hover:border-orange-200">
                           <div className="flex items-center gap-2 mb-1">
                              <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Waiting for Approval</span>
                           </div>
                           <p className="text-[10px] font-medium text-slate-300">The sender is reviewing your profile...</p>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

            {activeTab === "deliveries" && flowStep === 2 && activeParcel && (
               <motion.div key="step-2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPickupPhoto(null); setPickupPhotoFile(null); setOtpError(null); setOtpValue(["", "", "", ""]); setActiveTab("deliveries"); setFlowStep(1); }} className="text-slate-400 hover:text-orange-500 relative z-10"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Shipment Details</Button>
                  <div className="text-center"><h2 className="text-3xl font-black text-slate-900">Verify Pickup</h2><p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Handover from Sender</p></div>
                  <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-slate-50 space-y-8">
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Enter 4-Digit Pickup OTP</Label>
                        <div className="flex justify-center gap-4">
                           {otpValue.map((d, i) => <input key={i} id={`otp-${i}`} className="w-16 h-20 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-center text-3xl font-black outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner" value={d} onChange={e => handleOtpInput(e.target.value, i)} onKeyDown={e => handleOtpKeyDown(e, i)} maxLength={1} autoComplete="one-time-code" />)}
                        </div>
                     </div>

                     <div className="h-72 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-center group hover:border-orange-500/30 transition-all" onClick={(e) => e.stopPropagation()}>
                        {pickupPhoto ? (
                           <>
                              <img src={pickupPhoto} className="w-full h-full object-cover" alt="Proof" />
                              <Button type="button" size="sm" variant="destructive" className="absolute bottom-4 right-4 rounded-full h-10 px-4" onClick={(e) => { e.stopPropagation(); setPickupPhoto(null); setPickupPhotoFile(null); }}><Trash2 className="h-4 w-4 mr-2" /> Retake</Button>
                           </>
                        ) : (
                           <div onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-center cursor-pointer p-10 flex flex-col items-center gap-4 group">
                              <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-500 border border-slate-50">
                                 <Camera className="h-10 w-10" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Capture Parcel</p>
                                 <p className="text-[10px] font-medium text-slate-400">Take a photo of the item for safety</p>
                              </div>
                           </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => { e.stopPropagation(); handleImageCapture(e, 'pickup'); }} />
                     </div>

                     {otpError && <p className="text-red-500 text-center font-black text-[10px] uppercase animate-shake">{otpError}</p>}

                     <Button className="w-full h-18 bg-orange-500 hover:bg-orange-600 rounded-[2rem] font-black tracking-widest text-[11px] shadow-xl shadow-orange-500/20 shadow-orange-500/20 active:scale-95 transition-all" onClick={handleConfirmPickup} disabled={isProcessing || !pickupPhotoFile}>
                        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM & START TRIP"}
                     </Button>
                  </div>
               </motion.div>
            )}

            {activeTab === "deliveries" && flowStep === 3 && activeParcel && (
               <motion.div key="step-3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-[600px] flex flex-col gap-6">
                  <div className="bg-slate-900 flex-1 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl">
                     <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent transition-opacity group-hover:opacity-30" />
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 blur-[100px] rounded-full animate-pulse" />

                     <div className="relative z-10 space-y-8 w-full max-w-sm">
                        <div className="h-24 w-24 bg-orange-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-orange-500/40 animate-bounce">
                           <Navigation className="h-12 w-12" />
                        </div>
                        <div>
                           <h3 className="text-white text-3xl font-black tracking-tight mb-2">On the Way</h3>
                           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Cruising to Drop Location</p>
                        </div>

                        <div className="p-6 bg-white/5 border border-white/5 rounded-[2.5rem] backdrop-blur-md">
                           <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Destination</p>
                           <p className="text-xl font-bold text-white leading-tight">{activeParcel.toLocation}</p>
                        </div>

                        <div className="flex gap-4">
                           <button
                              onClick={() => {
                                 if (activeParcel) {
                                    socket.emit("start_navigation", activeParcel.id);
                                    toast.success("Notifying sender and opening maps...");
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeParcel.toLocation)}`, '_blank');
                                 }
                              }}
                              className="flex-1 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-white/20 transition-all"
                           >
                              <Map className="h-5 w-5" /> Navigation
                           </button>
                           <button
                              onClick={() => {
                                 if (activeParcel) {
                                    window.dispatchEvent(new CustomEvent('start-call', {
                                       detail: {
                                          userId: activeParcel.receiverId || activeParcel.senderId,
                                          userName: activeParcel.receiverName,
                                          deliveryId: activeParcel.id
                                       }
                                    }));
                                 }
                              }}
                              className="h-14 w-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
                           >
                              <Phone className="h-6 w-6" />
                           </button>
                           <button onClick={() => setActiveChat(activeParcel.id)} className="h-14 w-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"><MessageSquare className="h-6 w-6" /></button>
                        </div>
                     </div>
                  </div>
                  <Button className="h-20 bg-orange-500 hover:bg-orange-600 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-orange-500/30 active:scale-[0.98] transition-all" onClick={handleArrivedAtReceiver}>ARRIVED AT DROP POINT</Button>
               </motion.div>
            )}

            {activeTab === "deliveries" && flowStep === 4 && activeParcel && (
               <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <Button variant="ghost" size="sm" onClick={() => { setActiveTab("deliveries"); setFlowStep(3); setOtpError(null); setOtpValue(["", "", "", ""]); }} className="text-slate-400 hover:text-orange-500"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Navigation</Button>
                  <div className="text-center"><h2 className="text-3xl font-black text-slate-900">Deliver Parcel</h2><p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Verify with Receiver</p></div>
                  <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-50 space-y-10">
                     <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient</p><p className="font-black text-2xl text-slate-900 leading-none">{activeParcel.receiverName}</p></div>
                        <div className="flex gap-2">
                           <a href={`tel:${activeParcel.receiverPhone}`} className="h-14 w-14 bg-white border border-slate-200 rounded-3xl flex items-center justify-center shadow-sm hover:text-blue-600 transition-all active:scale-90"><Phone className="h-6 w-6" /></a>
                           <button onClick={() => setActiveChat(activeParcel.id)} className="h-14 w-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-xl active:scale-95 transition-all"><MessageSquare className="h-6 w-6" /></button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Handover Verification OTP</Label>
                        <div className="flex justify-center gap-4">
                           {otpValue.map((d, i) => <input key={i} id={`otp-${i}`} className="w-16 h-20 bg-white border-2 border-slate-100 rounded-[1.5rem] text-center text-3xl font-black outline-none focus:border-emerald-500 focus:bg-emerald-50/10 transition-all shadow-sm" value={d} onChange={e => handleOtpInput(e.target.value, i)} onKeyDown={e => handleOtpKeyDown(e, i)} maxLength={1} autoComplete="one-time-code" />)}
                        </div>
                     </div>

                     <div className="h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-center group hover:bg-emerald-50/10 hover:border-emerald-500/20 transition-all">
                        {deliveryPhoto ? (
                           <>
                              <img src={deliveryPhoto} className="w-full h-full object-cover" />
                              <Button type="button" size="sm" variant="destructive" className="absolute bottom-4 right-4 rounded-full h-10 shadow-lg" onClick={() => { setDeliveryPhoto(null); setDeliveryPhotoFile(null); }}><Trash2 className="h-4 w-4 mr-2" /> Retake</Button>
                           </>
                        ) : (
                           <div onClick={() => fileInputRef.current?.click()} className="text-center cursor-pointer flex flex-col items-center gap-4">
                              <div className="h-16 w-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-emerald-500 animate-pulse border border-slate-100"><Camera className="h-8 w-8" /></div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SNAPSHOT SUCCESSFUL HANDOVER</p>
                           </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, 'delivery')} />
                     </div>

                     {otpError && <p className="text-red-500 text-center font-bold text-[10px] uppercase animate-shake">{otpError}</p>}
                     <Button className="w-full h-20 bg-emerald-600 hover:bg-emerald-700 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all" onClick={handleConfirmDelivery} disabled={isProcessing || !deliveryPhotoFile}>
                        {isProcessing ? "PROCESSING HANDOVER..." : "FINALIZE DELIVERY"}
                     </Button>
                  </div>
               </motion.div>
            )}

            {flowStep === 5 && activeParcel && (
               <div className="text-center py-20 px-6">
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="h-32 w-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-2xl mb-10"><Check className="h-16 w-16 stroke-[3]" /></motion.div>
                  <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Mission Success!</h2>
                  <p className="text-slate-400 font-bold mb-12 uppercase text-[10px] tracking-[0.3em]">Delivery Verified & Closed</p>
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-slate-900 p-10 rounded-[3.5rem] text-left mb-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-64 w-64 bg-orange-500/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Payout</p>
                     <p className="text-6xl font-black text-white tracking-tighter">₹{activeParcel.price}</p>
                     <div className="mt-8 flex items-center gap-3 py-4 border-t border-white/5">
                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Instant Wallet Settlement</p>
                     </div>
                  </motion.div>
                  <Button className="w-full h-18 bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all" onClick={resetFlow}>RETURN TO HUB</Button>
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
