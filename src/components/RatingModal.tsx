import { useState } from "react";
import { Star, X, MessageSquare, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import api from "@/lib/api";
import { toast } from "sonner";

interface RatingModalProps {
  parcelId: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RatingModal({ parcelId, revieweeId, revieweeName, onClose, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reviews", {
        parcel: parcelId,
        reviewee: revieweeId,
        rating,
        comment,
      });
      toast.success("Review submitted! Thank you.");
      onSuccess();
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-card border border-white/10 shadow-3xl"
      >
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-center text-white">
          <button 
             onClick={onClose}
             className="absolute right-6 top-6 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <motion.div
             initial={{ rotate: -15, scale: 0.8 }}
             animate={{ rotate: 0, scale: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 12 }}
             className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl"
          >
             <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
          </motion.div>

          <h2 className="text-2xl font-black font-heading">Rate Experience</h2>
          <p className="mt-1 text-sm text-white/70">How was your interaction with <strong>{revieweeName}</strong>?</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Star Selection */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-90"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-10 w-10 ${
                    (hover || rating) >= star 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-muted-foreground/30"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" /> Share your feedback
              </label>
              <Textarea
                placeholder="Write a comment (optional)..."
                className="min-h-[100px] rounded-2xl border-border/50 bg-muted/30 p-4 text-sm focus:border-indigo-500/50"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-14 rounded-2xl bg-indigo-600 font-black text-white shadow-xl shadow-indigo-100 hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              onClick={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? (
                "Submitting..."
              ) : (
                <><CheckCircle2 className="h-5 w-5" /> Submit Review</>
              )}
            </Button>
            
            <button 
              onClick={onClose}
              className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
