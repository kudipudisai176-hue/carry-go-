import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, PackageCheck, Handshake, CheckCircle2, Star, Truck, Zap, Box, Weight, Bell, LayoutDashboard, Search, History, ShieldCheck, Key, MessageSquare, Clock, Navigation2, Check, RefreshCw, Sparkles, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import { getParcelsByPhone, markReceived, submitReview, type Parcel, type UserData } from "@/lib/parcelStore";
import { toast } from "sonner";
import UserProfileModal from "@/components/UserProfileModal";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import ParcelChat from "@/components/ParcelChat";

// SwiftParcel Premium CSS (Common with Traveller Dashboard)
const styles = `
  :root {
    --navy: #0f1f3d;
    --orange: #f26522;
    --orange-light: #fff3ec;
    --orange-border: #f9c4a0;
    --gray-bg: #f4f6f9;
    --gray-border: #dde2ea;
    --gray-text: #8896a8;
    --white: #ffffff;
    --success: #22c55e;
    --shadow: 0 4px 24px rgba(15,31,61,0.08);
    --shadow-md: 0 8px 32px rgba(15,31,61,0.13);
  }

  .route-dot {
    width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid;
  }
  .route-dot.from { border-color: var(--navy); background: white; }
  .route-dot.to { border-color: var(--orange); background: var(--orange); }
  .route-connector { width: 1.5px; height: 18px; background: #dde2ea; }
`;

export default function Receiver() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  // Review states
  const [reviewParcel, setReviewParcel] = useState<Parcel | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedParcels, setReviewedParcels] = useState<string[]>([]);

  const fetchParcels = useCallback(async () => {
    if (!user?.phone) return;
    try {
      const formattedPhone = user.phone.startsWith("+91") ? user.phone : `+91${user.phone.replace(/\D/g, '')}`;
      const data = await getParcelsByPhone(formattedPhone);
      setParcels(data);
    } catch (err) {
      toast.error("Failed to fetch parcels");
    } finally {
      setLoading(false);
    }
  }, [user?.phone]);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Real-time status sync (Supabase)
  useEffect(() => {
    if (!user?.phone) return;
    const formattedPhone = user.phone.startsWith("+91") ? user.phone : `+91${user.phone.replace(/\D/g, '')}`;

    const channel = supabase
      .channel('receiver-parcel-updates-v2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parcels',
          filter: `receiver_phone=eq.${formattedPhone}`
        },
        (payload) => {
          fetchParcels();
          if (payload.eventType === 'UPDATE') {
            const statusMsgs: Record<string, string> = {
              'accepted': '📦 Your parcel has been accepted and is ready for pickup!',
              'in-transit': '🚚 Your parcel is now in transit!',
              'arrived': '🏁 Your traveller has arrived at your destination!',
              'delivered': '✅ The parcel handover is complete!',
            };
            const msg = statusMsgs[(payload.new as any).status];
            if (msg) {
              toast.info(msg);
              sendBrowserNotification('SwiftParcel Update', msg);
            }
          }
        }
      )
      .subscribe();

    fetchParcels(); // Initial fetch
    return () => { supabase.removeChannel(channel); };
  }, [user?.phone, fetchParcels, sendBrowserNotification]);

  const handleReceive = async (id: string) => {
    await markReceived(id);
    toast.success("Parcel marked as received! Sender will be notified.");
    fetchParcels();
  };

  const handleSubmitReview = async () => {
    if (!reviewParcel || !reviewParcel.traveller_id) return;
    setSubmittingReview(true);
    try {
      await submitReview(reviewParcel.id, reviewParcel.traveller_id, rating, comment);
      toast.success("Feedback submitted! Thank you.");
      setReviewedParcels(prev => [...prev, reviewParcel.id]);
      setReviewParcel(null);
      setRating(5);
      setComment("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── RENDER: Header ──
  const Header = () => (
    <div className="w-full bg-[#0f1f3d] py-4 px-6 flex items-center gap-3 sticky top-0 z-50">
      <div className="h-9 w-9 bg-[#f26522] rounded-xl flex items-center justify-center text-white shadow-lg">
        <PackageCheck className="h-5 w-5" />
      </div>
      <span className="font-heading text-lg font-bold text-white tracking-tight">SwiftParcel</span>
      <div className="ml-auto flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70">
           <Bell className="h-4 w-4" />
        </div>
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 cursor-pointer" onClick={() => navigate('/dashboard')}>
           <LayoutDashboard className="h-4 w-4" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef1f6] flex flex-col items-center">
      <style>{styles}</style>
      <Header />

      <div className="w-full max-w-[500px] p-6 pb-24">
        
        <div className="space-y-6">
           <div className="flex flex-col items-center text-center">
              <h1 className="font-heading text-2xl font-bold text-[#0f1f3d] tracking-tight">Incoming Shipments</h1>
              <p className="text-[#8896a8] text-xs font-bold uppercase tracking-widest mt-2">Personal Tracking Feed</p>
           </div>

           {!loading && parcels.length === 0 ? (
             <div className="bg-white border-2 border-dashed border-[#dde2ea] rounded-[2rem] py-20 px-8 text-center shadow-sm">
                <div className="mb-5 opacity-30 flex justify-center">
                  <MapPin className="h-14 w-14 text-[#8896a8]" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#0f1f3d]">No incoming parcels.</h3>
                <p className="text-sm text-[#8896a8] mt-2 leading-relaxed">Parcels sent to <span className="text-[#f26522] font-semibold">{user?.phone}</span> will automatically appear here for real-time tracking.</p>
             </div>
           ) : (
             <div className="space-y-4">
                {parcels.map(p => (
                   <motion.div 
                     key={p.id} 
                     initial={{ opacity: 0, y: 15 }} 
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-white rounded-[1.5rem] shadow-sm overflow-hidden border border-slate-100"
                   >
                       {/* Card Header & Status */}
                       <div className="bg-gradient-to-br from-[#0f1f3d] to-[#1a3360] p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 bg-[#f26522] rounded-xl flex items-center justify-center font-bold text-white text-lg">
                                {p.sender_name?.charAt(0) || "S"}
                             </div>
                             <div className="text-left">
                                <h4 className="text-white font-bold text-sm leading-tight">{p.sender_name}</h4>
                                <p className="text-white/50 text-[10px] uppercase font-bold tracking-wide mt-1">Sender</p>
                             </div>
                          </div>
                          <StatusBadge status={p.status} />
                       </div>

                       <div className="p-5 space-y-5">
                          {/* Route track */}
                          <div className="bg-[#f4f6f9] p-4 rounded-2xl">
                             <p className="text-[9px] font-bold uppercase text-[#8896a8] tracking-widest mb-3 flex items-center gap-1.5 uppercase">
                                <MapPin className="h-3 w-3" /> Journey Snapshot
                             </p>
                             <div className="flex flex-col">
                                <div className="flex gap-3">
                                   <div className="flex flex-col items-center shrink-0">
                                      <div className="route-dot from" />
                                      <div className="route-connector" />
                                   </div>
                                   <div className="pb-4">
                                      <p className="text-xs font-bold text-[#0f1f3d]">{p.from_location}</p>
                                   </div>
                                </div>
                                <div className="flex gap-3">
                                   <div className="flex shrink-0">
                                      <div className="route-dot to" />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-[#f26522]">{p.to_location}</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Parcel Details Chips */}
                          <div className="flex flex-wrap gap-2">
                             <div className="bg-[#f4f6f9] px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] font-bold text-[#8896a8]">
                                <Weight className="h-3 w-3" /> {p.weight}kg
                             </div>
                             <div className="bg-[#f4f6f9] px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] font-bold text-[#8896a8]">
                                <Box className="h-3 w-3" /> {p.size}
                             </div>
                          </div>

                          {/* Traveller Info */}
                          {p.traveller_name && (
                             <div className="rounded-2xl bg-[#fff3ec] p-4 border border-[#f9c4a0]/50 flex items-center justify-between">
                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => p.traveller_data && setProfileUser(p.traveller_data)}>
                                   <div className="h-10 w-10 bg-[#f26522]/10 rounded-full flex items-center justify-center text-[#f26522]">
                                      <Truck className="h-5 w-5" />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-bold text-[#f26522] uppercase tracking-[0.1em]">Traveller Assigned</p>
                                      <h5 className="font-bold text-[#0f1f3d] text-sm">{p.traveller_name}</h5>
                                   </div>
                                </div>
                                <Button size="sm" variant="ghost" className="h-10 w-10 rounded-xl p-0" onClick={() => setActiveChat(p.id)}>
                                   <MessageSquare className="h-5 w-5 text-[#f26522]" />
                                </Button>
                             </div>
                          )}

                          {/* HANDOVER KEY (OTP) */}
                          {['accepted', 'in-transit', 'arrived'].includes(p.status) && (
                            <div className="bg-[#0f1f3d] rounded-2xl p-6 text-center shadow-xl shadow-[#0f1f3d]/10 border-b-4 border-orange-500">
                               <div className="h-12 w-12 bg-orange-500/20 border border-orange-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Key className="h-6 w-6 text-orange-500" />
                               </div>
                               <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Secure Delivery Key</p>
                               <div className="flex justify-center gap-1.5">
                                  {(p.delivery_otp || "----").split('').map((digit, i) => (
                                     <div key={i} className="flex-1 bg-white/5 border border-white/10 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                                        {digit}
                                     </div>
                                  ))}
                               </div>
                               <p className="text-white/40 text-[9px] mt-4 font-bold uppercase leading-relaxed max-w-[200px] mx-auto">Provide this code to the traveller only upon arrival.</p>
                            </div>
                          )}

                          {/* ARRIVED STATE */}
                          {p.status === "arrived" && (
                            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-2xl p-6 text-center space-y-4 animate-pulse">
                               <div className="flex items-center justify-center gap-2 text-green-600">
                                  <Clock className="h-5 w-5" />
                                  <span className="font-bold uppercase text-xs tracking-widest">Traveller is here!</span>
                               </div>
                               <p className="text-[#0f1f3d] text-sm font-bold">Your parcel has reached its destination.</p>
                            </div>
                          )}

                          {/* DELIVERED BUT NOT RECEIVED */}
                          {p.status === "delivered" && (
                            <div className="space-y-3">
                               <div className="bg-green-500 rounded-2xl p-5 text-white flex items-center gap-4">
                                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                                     <Check className="h-6 w-6" />
                                  </div>
                                  <div>
                                     <h5 className="font-bold text-sm uppercase">Handover Complete!</h5>
                                     <p className="text-white/70 text-xs">Waiting for your final receipt</p>
                                  </div>
                               </div>
                               <Button 
                                 className="w-full h-14 bg-[#0f1f3d] rounded-xl text-white font-bold uppercase tracking-widest text-xs"
                                 onClick={() => handleReceive(p.id)}
                               >
                                  Confirm Parcel Receipt
                               </Button>
                            </div>
                          )}

                          {/* RECEIVED STATE (RATINGS) */}
                          {p.status === "received" && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                               <div className="flex items-center gap-3 mb-4">
                                  <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                                     <History className="h-4 w-4" />
                                  </div>
                                  <p className="text-xs font-bold text-slate-500">Logistics Loop Closed</p>
                               </div>
                               {p.traveller_id && !reviewedParcels.includes(p.id) && (
                                  <Button 
                                    variant="outline" 
                                    className="w-full h-12 border-orange-500 text-orange-500 font-bold text-xs uppercase rounded-xl hover:bg-orange-50"
                                    onClick={() => setReviewParcel(p)}
                                  >
                                     Rate Experience
                                  </Button>
                               )}
                               {reviewedParcels.includes(p.id) && (
                                  <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest bg-green-50 py-3 rounded-xl justify-center">
                                     <Sparkles className="h-3 w-3" /> Feedback Recorded
                                  </div>
                               )}
                            </div>
                          )}
                       </div>
                   </motion.div>
                ))}
             </div>
           )}
        </div>
      </div>

      {activeChat && (
        <ParcelChat 
          deliveryId={activeChat} 
          currentUserId={user?.id || ""} 
          onClose={() => setActiveChat(null)} 
        />
      )}

      <UserProfileModal 
        user={profileUser} 
        isOpen={!!profileUser} 
        onClose={() => setProfileUser(null)} 
      />

      <Dialog open={!!reviewParcel} onOpenChange={(open) => !open && setReviewParcel(null)}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-[#0f1f3d] p-10 text-center text-white">
             <div className="mx-auto h-24 w-24 bg-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
                <Star className="h-10 w-10 text-white fill-white" />
             </div>
             <DialogTitle className="text-3xl font-bold text-white">Rate your Traveller</DialogTitle>
             <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mt-3">Share your logistics experience</p>
          </div>
          
          <div className="p-10 space-y-8 bg-white">
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <button
                  key={starIdx}
                  onClick={() => setRating(starIdx)}
                  className="transition-all hover:scale-125 focus:outline-none"
                >
                  <Star 
                    className={`h-10 w-10 ${starIdx <= rating ? 'fill-orange-400 text-orange-400 drop-shadow-lg' : 'text-slate-100'}`} 
                  />
                </button>
              ))}
            </div>
            
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-[#8896a8] tracking-widest ml-1">Comments (optional)</Label>
              <Textarea 
                placeholder="How was the handover experience?" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none h-32 rounded-3xl bg-[#f4f6f9] border-none font-bold text-[#0f1f3d] p-6 focus:ring-0"
              />
            </div>

            <div className="flex gap-4">
               <Button variant="ghost" onClick={() => setReviewParcel(null)} className="flex-1 font-bold uppercase text-[#8896a8] text-xs">Skip</Button>
               <Button onClick={handleSubmitReview} disabled={submittingReview} className="flex-[2] h-14 bg-[#0f1f3d] rounded-2xl font-bold uppercase tracking-widest text-xs text-white">
                 {submittingReview ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Submit Review"}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
