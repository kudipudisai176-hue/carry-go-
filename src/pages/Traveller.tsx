import { useState, useEffect, useCallback, useRef } from "react";
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
import BottomNav from "@/components/BottomNav";
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
   const [otpValue, setOtpValue] = useState(["", "", "", ""]); // 4-digit for this flow
   const [pickupPhoto, setPickupPhoto] = useState<string | null>(null);
   const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
   const [pickupPhotoFile, setPickupPhotoFile] = useState<File | null>(null);
   const [deliveryPhotoFile, setDeliveryPhotoFile] = useState<File | null>(null);
   const [otpError, setOtpError] = useState<string | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [activeChat, setActiveChat] = useState<string | null>(null);
   const [showMap, setShowMap] = useState(true);

   const sendBrowserNotification = useCallback((title: string, body: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
         new Notification(title, { body, icon: '/favicon.ico' });
      }
   }, []);

   const loadMyDeliveries = useCallback(async () => {
      try {
         const data = await getMyDeliveries();
         setMyDeliveries(data);

         // Auto-open logic: If a parcel is accepted/in-transit and we are not in the flow, open it
         const activeOne = data.find(p => ['accepted', 'picked-up', 'in-transit', 'arrived'].includes(p.status));
         if (activeOne && !activeParcel) {
            setActiveParcel(activeOne);
            setFlowStep(1);
            setActiveTab("deliveries");
         }

         // If we are already in the flow, keep the data fresh
         if (activeParcel) {
            const updated = data.find(p => p.id === activeParcel.id);
            if (updated) setActiveParcel(updated);
         }
      } catch {
         // silently fail
      }
   }, [activeParcel]);

   // Real-time status sync
   useEffect(() => {
      if (!user?.id) return;

      // Fallback Polling (Every 5 seconds)
      const interval = setInterval(loadMyDeliveries, 5000);

      const channel = supabase
         .channel('traveller-parcel-updates-v4')
         .on(
            'postgres_changes',
            {
               event: '*', // Listen for all events
               schema: 'public',
               table: 'parcels',
            },
            async (payload) => {
               // Verify if this parcel belongs to the current traveller
               const pData = (payload.new || payload.old) as any;
               const isMyParcel = pData?.traveller_id === user.id;
               if (!isMyParcel) return;

               console.log('[Realtime] Parcel status update for traveller:', pData?.status);

               await loadMyDeliveries();

               if (pData?.status === 'accepted' && payload.eventType === 'UPDATE') {
                  toast.success("ACCEPTED! A sender has approved your request! 🎉", {
                     duration: 6000,
                  });
                  sendBrowserNotification("Delivery Approved! ✅", "You've been assigned. Check the pickup details now.");

                  // Ensure active state is set
                  const fullParcel = await getParcelById(pData.id);
                  setActiveParcel(fullParcel || mapParcel(pData));
                  setFlowStep(1);
                  setActiveTab("deliveries");
               }
            }
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
         clearInterval(interval);
      };
   }, [user?.id, loadMyDeliveries, sendBrowserNotification]);

   useEffect(() => {
      loadMyDeliveries();
   }, [loadMyDeliveries]);

   const handleSearch = useCallback(async () => {
      setLoading(true);
      try {
         const origin = from || user?.city || "";
         const data = await searchParcels(origin, to || "");
         const filtered = data.filter(p => p.sender_id !== user?.id);
         setResults(filtered);
      } catch {
         toast.error("Failed to load local parcels");
      } finally {
         setLoading(false);
      }
   }, [from, to, user?.id, user?.city]);

   // 📡 REALTIME STATUS SYNC: Listen for sender acceptance
   useEffect(() => {
     if (!activeParcel?.id || activeParcel.status !== 'requested') return;

     const sub = subscribeToParcel(activeParcel.id, (updatedParcel) => {
       if (updatedParcel.status === 'accepted') {
         toast.success("Sender accepted! Opening your delivery dashboard. 🎉");
         setActiveParcel(updatedParcel);
         setFlowStep(1);
         setActiveTab("deliveries");
         loadMyDeliveries();
       }
     });

     return () => {
       supabase.removeChannel(sub);
     };
   }, [activeParcel?.id, activeParcel?.status]);

   const handleRequest = async (id: string) => {
      if (!user) return;
      try {
         setIsWaitingForAccept(true);
         
         const requested = await requestParcel(id, user.name);
         if (requested) setActiveParcel(requested);

         handleSearch();

         toast.info("Request sent! Waiting for sender to approve...", { duration: 5000 });

         // No longer simulating auto-accept here, since we have the real-time listener above!
         // This makes the app feel "real" if they test with two windows.

      } catch (err: any) {
         setIsWaitingForAccept(false);
         toast.error(err.response?.data?.message || "Failed to send request");
      }
   };

   const handleArrivedAtPickup = async (parcelId?: string) => {
      const id = parcelId || activeParcel?.id;
      if (!id) return;

      try {
         await updateParcelStatus(id, 'arrived');
         toast.info("Sender notified of your arrival!");
      } catch (e) {
         console.warn("Status update failed:", e);
      }
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
         toast.error(err.response?.data?.message || "Pickup failed. Incorrect OTP.");
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
         toast.error(err.response?.data?.message || "Delivery failed. Incorrect OTP.");
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
            transition={{ duration: 0.55 }}
            className="relative mb-8 overflow-hidden rounded-[2.5rem] p-10 shadow-[0_20px_50px_-12px_rgba(249,115,22,0.15)] border border-white bg-white"
         >
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />
            <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-secondary/5 blur-[60px]" />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <div className="mb-2 flex items-center gap-3">
                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/20 text-white">
                        <Bike className="h-6 w-6" />
                     </div>
                     <div>
                        <h1 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">Traveller Dashboard</h1>
                        <p className="text-sm font-bold text-slate-400">Manage your deliveries and find new routes</p>
                     </div>
                  </div>
               </div>

               <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2 border border-slate-100 shadow-inner">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Earnings</span>
                     <span className="text-lg font-bold text-orange-600 tracking-widest">₹{myDeliveries.reduce((acc, curr) => acc + (curr.status === 'delivered' ? curr.price : 0), 0)}</span>
                  </div>
               </div>
            </div>

            {/* --- Unified Tabs --- */}
            <div className="mt-10 flex gap-2 rounded-[1.5rem] bg-slate-100 p-1.5 relative z-10 border border-slate-200">
               <button
                  onClick={() => setActiveTab("deliveries")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "deliveries"
                     ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                     : "bg-transparent text-black hover:bg-slate-200/50"
                     }`}
               >
                  <History className="h-4 w-4" />
                  MY DELIVERIES
               </button>
               <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "search"
                     ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                     : "bg-transparent text-black hover:bg-slate-200/50"
                     }`}
               >
                  <Search className="h-4 w-4" />
                  FIND PARCELS
               </button>
            </div>
         </motion.div>

         <main className="relative">
            {/* SEARCH TAB */}
            {activeTab === "search" && flowStep === 0 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 mb-6">
                     <h3 className="font-heading text-xl font-bold text-[#0f1f3d] mb-4">Find New Parcels</h3>
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold uppercase text-[#8896a8] tracking-widest ml-1">Current City</label>
                           <Input
                              value={from}
                              list="locations-list"
                              onChange={(e) => setFrom(e.target.value)}
                              placeholder="e.g. Kakinada"
                              className="h-14 rounded-2xl bg-[#f4f6f9] border-none font-bold text-[#0f1f3d]"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold uppercase text-[#8896a8] tracking-widest ml-1">Destination</label>
                           <Input
                              value={to}
                              list="locations-list"
                              onChange={(e) => setTo(e.target.value)}
                              placeholder="e.g. Rajahmundry"
                              className="h-14 rounded-2xl bg-[#f4f6f9] border-none font-bold text-[#0f1f3d]"
                           />
                        </div>
                        <datalist id="locations-list">
                           {locations.map(loc => (
                              <option key={loc.name} value={loc.name}>{loc.mandal}</option>
                           ))}
                        </datalist>
                        <Button
                           className="w-full h-14 bg-[#f26522] rounded-2xl font-bold uppercase tracking-[0.2em] text-sm shadow-xl shadow-[#f26522]/20 mt-2"
                           onClick={handleSearch}
                           disabled={loading}
                        >
                           {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Search Local Feed"}
                        </Button>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {results.length === 0 ? (
                        <div className="text-center py-10 opacity-40">
                           <Search className="h-10 w-10 mx-auto mb-2" />
                           <p className="text-sm font-bold">Try searching for a different city</p>
                        </div>
                     ) : (
                        results.map(p => (
                           <div key={p.id} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                       <h4 className="font-bold text-base text-[#0f1f3d]">{p.description}</h4>
                                    </div>
                                    <p className="text-xs text-[#8896a8] font-medium">{p.from_location} → {p.to_location}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xl font-bold text-[#f26522]">₹{p.price}</p>
                                    <p className="text-[9px] font-bold text-[#8896a8] uppercase tracking-tighter">Est. Earning</p>
                                 </div>
                              </div>
                              <Button
                                 className="w-full h-11 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold uppercase tracking-widest text-[10px] mt-1 text-white shadow-lg shadow-orange-500/20"
                                 onClick={() => handleRequest(p.id)}
                              >
                                 Request To Carry
                              </Button>
                           </div>
                        ))
                     )}
                  </div>
               </motion.div>
            )}

            {/* FLOW STEP 1: ACTIVE DELIVERY */}
            {flowStep === 1 && activeParcel && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <Button variant="ghost" onClick={resetFlow} className="mb-2"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                  
                  <div className="bg-white rounded-[3rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-50 space-y-8 relative overflow-hidden">
                     {/* Progress Tracker */}
                     <div className="flex justify-between items-center px-4 relative mb-10">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0" />
                        <div 
                           className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-400 to-orange-500 -translate-y-1/2 z-0 transition-all duration-1000 ease-out" 
                           style={{ 
                             width: activeParcel.status === 'accepted' ? '25%' : 
                                    activeParcel.status === 'picked-up' ? '50%' : 
                                    activeParcel.status === 'in-transit' ? '75%' : 
                                    (activeParcel.status === 'arrived' || activeParcel.status === 'delivered') ? '100%' : '10%' 
                           }} 
                        />
                        {[
                          { id: 'accepted', icon: Handshake, label: 'Accepted' },
                          { id: 'picked-up', icon: Box, label: 'Picked' },
                          { id: 'in-transit', icon: Navigation, label: 'Way' },
                          { id: 'arrived', icon: CheckCircle2, label: 'Arrived' }
                        ].map((step, idx) => {
                          const isCompleted = ['accepted', 'picked-up', 'in-transit', 'arrived', 'delivered'].indexOf(activeParcel.status) >= idx;
                          const isActive = activeParcel.status === step.id;
                          
                          return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                               <div className={cn(
                                 "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-md",
                                 isCompleted ? "bg-orange-500 text-white shadow-orange-500/30" : "bg-white text-slate-300 border-2 border-slate-100"
                               )}>
                                  <step.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                               </div>
                               <span className={cn(
                                 "text-[9px] font-black uppercase tracking-widest",
                                 isCompleted ? "text-orange-500" : "text-slate-300"
                               )}>{step.label}</span>
                            </div>
                          );
                        })}
                     </div>

                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] mb-1">Active Parcel ID</p>
                           <h3 className="text-2xl font-black text-[#0f1f3d] font-heading tracking-tight">#{activeParcel.id.slice(-8).toUpperCase()}</h3>
                        </div>
                        <StatusBadge status={activeParcel.status} />
                     </div>
                     
                     <div className="space-y-6 py-6 border-y border-slate-50">
                        <div className="flex gap-5">
                           <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-orange-500">
                              <MapPin className="h-6 w-6" />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1 block">Pickup From</label>
                              <p className="font-bold text-[#0f1f3d] text-base leading-tight">{activeParcel.from_location}</p>
                           </div>
                        </div>
                        <div className="flex gap-5">
                           <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-blue-500">
                              <Navigation2 className="h-6 w-6" />
                           </div>
                           <div>
                              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-1 block">Deliver To</label>
                              <p className="font-bold text-[#0f1f3d] text-base leading-tight">{activeParcel.to_location}</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50/50 rounded-3xl p-6 flex items-center justify-between mt-8 border border-white">
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-[#f26522] rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center text-white font-black text-xl font-heading">
                                 {activeParcel.sender_name.charAt(0)}
                              </div>
                              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-4 border-white" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sender</p>
                              <p className="text-base font-black text-[#0f1f3d] leading-none mb-1">{activeParcel.sender_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                                {activeParcel.status === 'requested' ? "Phone Hidden" : (activeParcel.sender_phone || "Contact Ready")}
                              </p>
                           </div>
                        </div>
                        
                        <div className="flex gap-2">
                           {activeParcel.status !== 'requested' && (
                              <a href={`tel:${activeParcel.sender_phone}`} className="h-12 w-12 bg-white text-[#0f1f3d] border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95">
                                 <Phone className="h-5 w-5" />
                              </a>
                           )}
                           <button 
                             onClick={() => setActiveChat(activeParcel.id)}
                             className="h-12 w-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition-transform active:scale-95"
                           >
                              <MessageSquare className="h-5 w-5" />
                           </button>
                        </div>
                     </div>

                     {activeParcel.status !== 'requested' ? (
                        <Button 
                          className="w-full h-18 bg-emerald-600 hover:bg-emerald-700 rounded-[2.25rem] text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_12px_24px_rgba(5,150,105,0.25)] mt-10 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-4 group"
                          onClick={() => handleArrivedAtPickup()}
                        >
                           <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Navigation className="h-4 w-4 fill-white" />
                           </div>
                           <span>Mark as Arrived at Pickup</span>
                        </Button>
                     ) : (
                        <div className="w-full h-18 bg-slate-50 rounded-[2.25rem] flex items-center justify-center text-slate-300 font-bold uppercase tracking-widest text-[9px] mt-10 border-2 border-dashed border-slate-100 italic">
                           <Clock className="h-4 w-4 mr-2 animate-pulse" /> Finalizing Approval with Sender...
                        </div>
                     )}
                  </div>
               </motion.div>
            )}

            {/* DELIVERIES LIST / EMPTY STATE */}
            {activeTab === "deliveries" && flowStep === 0 && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[400px] flex flex-col items-center justify-center">
                  {myDeliveries.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center text-center max-w-sm w-full mx-auto">
                      <div className="h-24 w-24 bg-orange-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner text-orange-500">
                         <Navigation className="h-12 w-12" />
                      </div>
                      <h3 className="text-2xl font-black text-[#0f1f3d] mb-3 font-heading tracking-tight">No active deliveries.</h3>
                      <p className="text-sm text-slate-400 font-bold leading-relaxed mb-10">Once you request a parcel and the <span className="text-orange-500">Sender accepts</span>, it will appear here instantly.</p>
                      <Button onClick={() => setActiveTab("search")} className="h-16 w-full bg-orange-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all">Go Find Parcels</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {myDeliveries.map(p => (
                        <div 
                           key={p.id} 
                           onClick={() => { setActiveParcel(p); setFlowStep(1); }} 
                           className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-orange-200 transition-all group"
                        >
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 font-bold group-hover:bg-orange-100 transition-colors">
                                 {p.sender_name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-black text-[#0f1f3d] leading-none mb-1">#{p.id.slice(-6).toUpperCase()}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.from_location} → {p.to_location}</p>
                              </div>
                           </div>
                           <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
               </motion.div>
            )}
         </main>

         {/* PAGE 2: PICKUP OTP + CAPTURE */}
         {flowStep === 2 && activeParcel && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
               <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 font-heading">Verify Pickup</h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Identify with Sender</p>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-8">
                  <div className="space-y-2 text-center">
                     <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
                        Handover complete? <br/>
                        <span className="text-orange-500">Just capture a photo to confirm!</span>
                     </p>
                  </div>

                  <div className="space-y-4">
                     <div
                        className="h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group transition-all"
                     >
                        {pickupPhoto ? (
                           <div className="relative w-full h-full">
                              <img src={pickupPhoto} className="w-full h-full object-cover" alt="Pickup proof" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Button variant="secondary" size="sm" className="rounded-full font-bold uppercase text-[10px]" onClick={() => fileInputRef.current?.click()}><RefreshCw className="h-3 w-3 mr-2" /> Retake Photo</Button>
                              </div>
                           </div>
                        ) : (
                           <div className="text-center cursor-pointer p-10 w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                              <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform">
                                 <Camera className="h-8 w-8" />
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">📷 Capture Parcel Photo</p>
                           </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, 'pickup')} />
                     </div>
                  </div>

                  {otpError && <div className="bg-red-50 text-red-500 p-3 rounded-xl border border-red-100 text-center font-bold text-[10px] uppercase tracking-widest">{otpError}</div>}

                  <Button
                     className="w-full h-16 bg-orange-500 hover:bg-orange-600 rounded-[1.5rem] text-white font-bold uppercase tracking-widest text-sm shadow-xl shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50"
                     onClick={handleConfirmPickup}
                     disabled={isProcessing}
                  >
                     {isProcessing ? (
                        <span className="flex items-center gap-2"><RefreshCw className="h-5 w-5 animate-spin" /> Verifying...</span>
                     ) : (
                        <span className="flex items-center gap-2">✅ Confirm Pickup & Start Delivery</span>
                     )}
                  </Button>
               </div>
            </motion.div>
         )}

         {/* PAGE 3: LIVE MAP / NAVIGATION */}
         {flowStep === 3 && activeParcel && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-200px)] flex flex-col">
               {showMap ? (
                  <div className="flex-1 relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl border-4 border-white">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1e293b,transparent),radial-gradient(circle_at_80%_70%,#0f172a,transparent)] bg-slate-800" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full px-12">
                           <div className="h-1 w-full bg-orange-500/20 rounded-full" />
                           <motion.div
                              animate={{ width: ["0%", "100%", "0%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute top-0 left-12 h-1 bg-orange-50 rounded-full shadow-[0_0_15px_#f97316]"
                           />
                           <motion.div
                              animate={{ left: ["10%", "90%", "10%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute -top-1.5 h-4 w-4 bg-orange-500 border-2 border-white rounded-full shadow-lg z-10"
                           />
                        </div>
                     </div>

                     <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
                        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl pointer-events-auto border border-white">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Destination</p>
                           <p className="text-sm font-bold text-slate-900">{activeParcel.to_location}</p>
                        </div>
                        <Button variant="outline" className="bg-white rounded-full h-10 w-10 p-0 pointer-events-auto shadow-lg" onClick={() => setShowMap(false)}>
                           <X className="h-4 w-4" />
                        </Button>
                     </div>

                     <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center w-full">
                        <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Navigating to Receiver...</p>
                     </div>
                  </div>
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                     <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-500">
                        <MapPin className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900">Map closed.</h3>
                     <p className="text-slate-500 font-bold mt-2">Tap 'Arrived at Receiver' to continue delivery.</p>
                     <Button variant="ghost" className="mt-4 text-orange-500 font-bold h-12 uppercase tracking-widest text-[10px]" onClick={() => setShowMap(true)}>Re-open Map</Button>
                  </div>
               )}

               <Button
                  className="w-full h-16 bg-orange-500 hover:bg-orange-600 rounded-[1.5rem] text-white font-bold uppercase tracking-widest text-sm shadow-xl shadow-orange-500/25 mt-6"
                  onClick={handleArrivedAtReceiver}
               >
                  🏁 Arrived at Receiver
               </Button>
            </motion.div>
         )}

         {/* PAGE 4: RECEIVER OTP + DELIVERY CONFIRM */}
         {flowStep === 4 && activeParcel && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
               <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">Confirm Delivery</h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Handover to Receiver</p>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-6">
                  <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient</p>
                     <p className="font-bold text-lg text-slate-900">{activeParcel.receiver_name}</p>
                     <p className="text-xs font-bold text-orange-500">{activeParcel.to_location}</p>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-center gap-3">
                        {otpValue.map((digit, i) => (
                           <input
                              key={i} id={`otp-${i}`}
                              className="w-14 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-2xl font-bold text-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-inner"
                              value={digit}
                              onChange={(e) => handleOtpInput(e.target.value, i)}
                              onKeyDown={(e) => handleOtpKeyDown(e, i)}
                              maxLength={1}
                              inputMode="numeric"
                           />
                        ))}
                     </div>
                     <p className="text-[10px] text-center font-bold text-orange-500 uppercase tracking-widest">Enter 4-digit code from Receiver</p>
                  </div>

                  <div
                     className="h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group transition-all"
                  >
                     {deliveryPhoto ? (
                        <div className="relative w-full h-full">
                           <img src={deliveryPhoto} className="w-full h-full object-cover" alt="Delivery proof" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" className="rounded-full font-bold uppercase text-[10px]" onClick={() => fileInputRef.current?.click()}><RefreshCw className="h-3 w-3 mr-2" /> Retake Photo</Button>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center cursor-pointer p-10 w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                           <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 text-orange-500 group-hover:scale-110 transition-transform">
                              <Camera className="h-8 w-8" />
                           </div>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">📷 Capture Delivery Photo</p>
                        </div>
                     )}
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => handleImageCapture(e, 'delivery')} />
                  </div>

                  <Button
                     className="w-full h-16 bg-orange-500 hover:bg-orange-600 rounded-[1.5rem] text-white font-bold uppercase tracking-widest text-sm shadow-xl shadow-orange-500/25 transition-all active:scale-95 disabled:opacity-50"
                     onClick={handleConfirmDelivery}
                     disabled={isProcessing}
                  >
                     {isProcessing ? (
                        <span className="flex items-center gap-2"><RefreshCw className="h-5 w-5 animate-spin" /> Finalizing...</span>
                     ) : (
                        <span className="flex items-center gap-2">✅ Confirm Delivery</span>
                     )}
                  </Button>
               </div>
            </motion.div>
         )}

         {/* PAGE 5: DELIVERY COMPLETE */}
         {flowStep === 5 && activeParcel && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-10">
               <div className="relative mb-12">
                  <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", stiffness: 200, damping: 10 }}
                     className="h-32 w-32 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl z-10 relative border-4 border-white"
                  >
                     <Check className="h-16 w-16" />
                  </motion.div>
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse -m-4" />
               </div>

               <h3 className="font-heading text-4xl font-bold text-slate-900 mb-4 tracking-tight">🎉 Delivery Completed!</h3>
               <p className="text-slate-500 font-bold max-w-xs mx-auto mb-8">Amazing job! The receiver has confirmed the parcel handover.</p>

               <div className="bg-slate-900 rounded-[2.5rem] p-8 w-full mb-10 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Earnings Breakdown</p>
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-xs font-bold text-slate-400 capitalize">#Delivery Fee</p>
                           <p className="text-4xl font-bold text-white mt-1">₹{activeParcel.price}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</p>
                           <p className="text-xs font-bold text-orange-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <Button
                  className="w-full h-16 bg-orange-500 hover:bg-orange-600 rounded-[1.5rem] text-white font-bold uppercase tracking-widest text-sm shadow-xl shadow-orange-500/25"
                  onClick={resetFlow}
               >
                  Back to Dashboard
               </Button>
            </motion.div>
         )}

         {/* STEP 2 SIMULATION OVERLAY */}
         <AnimatePresence>
            {isWaitingForAccept && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
                  <div className="relative mb-8 text-orange-500">
                     <div className="h-24 w-24 border-4 border-orange-100 rounded-full" />
                     <div className="h-24 w-24 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                     <div className="absolute inset-0 flex items-center justify-center"><Handshake className="h-8 w-8 animate-pulse" /></div>
                  </div>
                  <h2 className="text-3xl font-black text-[#0f1f3d] mb-4 font-heading tracking-tight underline decoration-orange-500/30 decoration-8 underline-offset-4">Waiting for Approval</h2>
                  <p className="text-base text-slate-500 font-bold leading-relaxed max-w-xs">Your delivery request has been sent! We are waiting for the <span className="text-orange-500">Sender</span> to accept your trip.</p>
               </motion.div>
            )}
         </AnimatePresence>

         <BottomNav activeTab="traveller" />

         {profileUser && (
            <UserProfileModal 
               user={profileUser} 
               isOpen={!!profileUser}
               onClose={() => setProfileUser(null)} 
            />
         )}

         <AnimatePresence>
            {activeChat && (
               <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }} 
                     exit={{ opacity: 0 }} 
                     onClick={() => setActiveChat(null)}
                     className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
                  />
                  <motion.div 
                     initial={{ opacity: 0, y: 100, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 100, scale: 0.95 }}
                     className="relative w-full max-w-lg z-10"
                  >
                     <ParcelChat 
                        deliveryId={activeChat} 
                        currentUserId={user?.id || ""} 
                        onClose={() => setActiveChat(null)} 
                     />
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
}


