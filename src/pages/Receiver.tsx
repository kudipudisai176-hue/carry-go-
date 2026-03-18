import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, PackageCheck, Handshake, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import RouteMap from "@/components/RouteMap";
import { getParcelsByPhone, markReceived, submitReview, type Parcel, type UserData } from "@/lib/parcelStore";
import { toast } from "sonner";
import UserProfileModal from "@/components/UserProfileModal";
import { useAuth } from "@/lib/authContext";

export default function Receiver() {
  const { user } = useAuth();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Polling for updates (Simulating real-time)
  useEffect(() => {
    if (!user?.phone) return;
    const formattedPhone = user.phone.startsWith("+91") ? user.phone : `+91${user.phone.replace(/\D/g, '')}`;

    let previousParcels: Parcel[] = [];

    const checkUpdates = async () => {
      try {
        const fresh = await getParcelsByPhone(formattedPhone);
        
        // Notify of changes (Simplified diffing)
        fresh.forEach(newParcel => {
          const oldParcel = previousParcels.find(p => p.id === newParcel.id);
          if (!oldParcel) return;

          if (oldParcel.status !== newParcel.status) {
            const statusMsgs: Record<string, string> = {
              'requested': '📦 A traveller has requested your parcel. Order is being confirmed!',
              'accepted': 'Your parcel has been accepted and is ready for pickup!',
              'in-transit': '🚚 Your order is confirmed! Your parcel is now in transit!',
              'delivered': '📦 Your parcel has been delivered! Please confirm receipt.',
            };

            const msg = statusMsgs[newParcel.status];
            if (msg) {
              toast.info(msg);
              sendBrowserNotification('CarryGo Update', msg);
            }
          }
        });

        setParcels(fresh);
        previousParcels = fresh;
      } catch (err) {
        console.error("Polling failed:", err);
      }
    };

    const interval = setInterval(checkUpdates, 5000);
    checkUpdates(); // Initial check

    return () => clearInterval(interval);
  }, [user?.phone, sendBrowserNotification]);


  const handleReceive = async (id: string) => {
    await markReceived(id);
    toast.success("Parcel marked as received! Sender will be notified of payment.");
    fetchParcels();
  };

  const handleSubmitReview = async () => {
    if (!reviewParcel || !reviewParcel.travellerId) return;
    setSubmittingReview(true);
    try {
      await submitReview(reviewParcel.id, reviewParcel.travellerId, rating, comment);
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

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-24">
      <div className="mb-8 border-b border-border pb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
          <PackageCheck className="h-7 w-7 text-secondary" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Your Incoming Parcels</h1>
          <p className="text-muted-foreground mt-1">Track and confirm delivery for your incoming packages</p>
        </div>
      </div>

      {!loading && parcels.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border py-20 text-center bg-card shadow-sm mt-6">
          <MapPin className="mb-5 h-16 w-16 text-muted-foreground/30" />
          <h2 className="text-xl font-bold text-foreground mb-2">No incoming parcels</h2>
          <p className="text-muted-foreground max-w-sm">When someone sends a parcel to your registered phone number, it will automatically appear here.</p>
        </div>
      )}

      <AnimatePresence>
        {parcels.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex cursor-pointer items-start justify-between" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div>
                <p className="font-heading font-semibold text-foreground">{p.fromLocation} → {p.toLocation}</p>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center">
                  <span>From: </span>
                  <button 
                    className="text-orange-500 hover:underline cursor-pointer font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.senderData) setProfileUser(p.senderData);
                    }}
                  >
                    {p.senderName}
                  </button>
                  <span>· {p.weight}kg</span>
                </div>
                {p.travellerName && (
                  <div className="mt-2 flex items-center gap-4">
                    <button 
                      className="text-xs text-secondary font-medium hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (p.travellerData) setProfileUser(p.travellerData);
                      }}
                    >
                      Carried by: {p.travellerName}
                    </button>
                  </div>
                )}
              </div>
              <StatusBadge status={p.status} />
            </div>

            {/* Status Timeline */}
            <div className="mt-4 flex items-center gap-1">
              {(['pending', 'requested', 'accepted', 'in-transit', 'delivered', 'received'] as const).map((s, i) => {
                const statusOrder = ['pending', 'requested', 'accepted', 'in-transit', 'delivered', 'received'];
                const currentIdx = statusOrder.indexOf(p.status);
                const isComplete = i <= currentIdx;
                return (
                  <div key={s} className="flex flex-1 items-center">
                    <div className={`h-2 w-full rounded-full transition-colors ${isComplete ? (p.status === 'received' ? 'bg-indigo-500' : 'bg-secondary') : 'bg-muted'}`} />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>Pending</span>
              <span>In Transit</span>
              <span>Delivered</span>
              <span>Received</span>
            </div>

            {p.status === "delivered" && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                    <Handshake className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Parcel is here!</p>
                    <p className="text-xs text-muted-foreground">Please confirm with the traveller and mark as received.</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleReceive(p.id)}
                  className="w-full bg-success font-bold hover:bg-success/90"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Received Delivery
                </Button>
              </div>
            )}

            {p.status === "received" && (
              <div className="mt-4 flex flex-col gap-3 rounded-lg bg-indigo-500/5 p-4 border border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-indigo-500" />
                  <p className="text-sm font-medium text-indigo-500">Delivery confirmed and received!</p>
                </div>
                {p.travellerId && !reviewedParcels.includes(p.id) && (
                  <Button
                    variant="outline"
                    className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReviewParcel(p);
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" /> Leave Feedback for Traveller
                  </Button>
                )}
                {reviewedParcels.includes(p.id) && (
                  <p className="text-xs text-indigo-600 font-medium">✨ Feedback left for traveller.</p>
                )}
              </div>
            )}


            {expanded === p.id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <RouteMap from={p.fromLocation} to={p.toLocation} animate={p.status === "in-transit"} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {/* Profile Modal */}
      <UserProfileModal 
        user={profileUser} 
        isOpen={!!profileUser} 
        onClose={() => setProfileUser(null)} 
      />

      {/* Review Modal */}
      <Dialog open={!!reviewParcel} onOpenChange={(open) => !open && setReviewParcel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate your Traveller</DialogTitle>
            <DialogDescription>
              How was your experience with {reviewParcel?.travellerName}? Your feedback helps keep CarryGo safe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starIdx) => (
                <button
                  key={starIdx}
                  onClick={() => setRating(starIdx)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`h-8 w-8 ${starIdx <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea 
                placeholder="Share your experience..." 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewParcel(null)}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview} className="bg-indigo-600 text-white hover:bg-indigo-700">
              {submittingReview ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
