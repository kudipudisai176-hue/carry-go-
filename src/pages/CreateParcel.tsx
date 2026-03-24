import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ArrowRightLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateParcel() {
  const { user, isLoading, switchSubRole } = useAuth();
  const navigate = useNavigate();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      localStorage.setItem("redirectAfterLogin", "/create-parcel");
      navigate("/login", { replace: true });
      return;
    }

    const role = user.role as any;
    if (role !== 'sender_receiver' && role !== 'sender' && role !== 'receiver') {
      toast.error("Only Sender/Receiver accounts can create parcels.");
      navigate("/dashboard", { replace: true });
      return;
    }

    if (user.sub_role === 'receiver') {
      setShowSwitchModal(true);
    } else {
      // Already a sender, go to dashboard with openForm state
      navigate("/user/dashboard", { state: { openForm: true }, replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSwitch = async () => {
    const ok = await switchSubRole('sender');
    if (ok) {
      toast.success("Switched to Sender mode!");
      navigate("/user/dashboard", { state: { openForm: true }, replace: true });
    } else {
      toast.error("Failed to switch mode.");
    }
  };

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
      <AnimatePresence>
        {showSwitchModal && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-orange-100 text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <ArrowRightLeft className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Switch to Sender Mode?</h2>
            <p className="text-slate-500 mb-8 font-medium">You are currently in Receiver mode. You need to switch to Sender mode to create a parcel.</p>
            
            <div className="flex flex-col gap-3">
              <Button onClick={handleSwitch} className="h-12 rounded-2xl bg-orange-500 text-white font-bold text-lg shadow-xl shadow-orange-500/20">
                Switch to Sender <Package className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="ghost" onClick={() => navigate("/user/dashboard")} className="h-12 rounded-2xl font-bold text-slate-400">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
