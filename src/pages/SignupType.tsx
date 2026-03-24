import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Package, ChevronRight, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupType() {
  const [selected, setSelected] = useState<"traveller" | "user" | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected === "traveller") {
      navigate("/signup/traveller");
    } else if (selected === "user") {
      navigate("/signup/user");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border border-white/50 bg-white/70 p-8 shadow-2xl backdrop-blur-2xl sm:p-10"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 shadow-xl shadow-purple-200">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Join CarryGo</h1>
            <p className="mt-2 text-slate-500 font-medium">Select how you want to use the platform</p>
          </div>

          <div className="grid gap-4">
            <div 
              onClick={() => setSelected("traveller")}
              className={`group relative flex cursor-pointer items-center gap-4 rounded-3xl border-2 p-5 transition-all duration-300 ${
                selected === "traveller" 
                  ? "border-purple-600 bg-purple-50/50 ring-4 ring-purple-600/10" 
                  : "border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50/50"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                selected === "traveller" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-purple-100 group-hover:text-purple-600"
              }`}>
                <Truck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold transition-colors ${selected === "traveller" ? "text-purple-900" : "text-slate-700"}`}>Traveller</h3>
                <p className="text-xs font-medium text-slate-500">Earn money while you travel</p>
              </div>
              {selected === "traveller" && (
                <motion.div layoutId="check" className="absolute right-6 h-3 w-3 rounded-full bg-purple-600 ring-4 ring-purple-100" />
              )}
            </div>

            <div 
              onClick={() => setSelected("user")}
              className={`group relative flex cursor-pointer items-center gap-4 rounded-3xl border-2 p-5 transition-all duration-300 ${
                selected === "user" 
                  ? "border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10" 
                  : "border-slate-100 bg-white hover:border-orange-200 hover:bg-slate-50/50"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                selected === "user" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500"
              }`}>
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold transition-colors ${selected === "user" ? "text-slate-900" : "text-slate-700"}`}>Send / Receive</h3>
                <p className="text-xs font-medium text-slate-500">Send parcels or receive them</p>
              </div>
              {selected === "user" && (
                <motion.div layoutId="check" className="absolute right-6 h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
              )}
            </div>
          </div>

          <Button 
            onClick={() => {
              console.log("Signup type selected:", selected);
              handleContinue();
            }}
            disabled={!selected}
            className={`mt-8 h-14 w-full rounded-2xl text-lg font-bold shadow-xl transition-all duration-300 ${
              selected === 'traveller' 
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' 
                : selected === 'user' 
                ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                : 'bg-slate-200 text-slate-400'
            }`}
          >
            Continue <ChevronRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-purple-600 hover:underline">
              Log In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
