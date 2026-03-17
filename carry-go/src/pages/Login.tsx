import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Package, Mail, Lock, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/lib/authContext";
import { toast } from "sonner";
import AuthAnimationWrapper from "@/components/AuthAnimationWrapper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("sender");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // call login with role
      const success = await login(email, password, role);

      if (success) {
        toast.success("Welcome back!");

        // navigate based on role
        if (role === "sender") {
          navigate("/sender");
        } else if (role === "traveller") {
          navigate("/traveller");
        } else if (role === "receiver") {
          navigate("/receiver");
        }
      } else {
        toast.error("Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  return (
    <AuthAnimationWrapper role={role}>
      <div
        className={`w-full max-w-md rounded-3xl border border-orange-100 bg-white/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 group/card ${
          role === "traveller"
            ? "hover:border-purple-500/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.1)]"
            : "hover:border-orange-500/40 hover:shadow-[0_0_40px_rgba(249,115,22,0.1)]"
        }`}
      >
        <div className="mb-8 text-center text-slate-800">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className={`mx-auto mb-4 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl shadow-lg transition-all duration-300 ${
              role === "traveller"
                ? "bg-purple-600"
                : role === "receiver"
                ? "bg-indigo-600"
                : "bg-orange-500"
            }`}
          >
            {role === "traveller" ? (
              <Truck className="h-7 w-7 text-white" />
            ) : role === "receiver" ? (
              <MapPin className="h-7 w-7 text-white" />
            ) : (
              <Package className="h-7 w-7 text-white" />
            )}
          </motion.div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to your CarryGo account</p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setRole("sender")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${
              role === "sender"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Package className="h-3 w-3" /> Sender
          </button>
          <button
            type="button"
            onClick={() => setRole("traveller")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${
              role === "traveller"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <Truck className="h-3 w-3" /> Traveller
          </button>
          <button
            type="button"
            onClick={() => setRole("receiver")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${
              role === "receiver"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            <MapPin className="h-3 w-3" /> Receiver
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="group space-y-2">
            <Label
              htmlFor="email"
              className="flex items-center gap-2 font-medium text-slate-700 transition-colors group-hover:text-orange-500"
            >
              <Mail className="h-4 w-4" /> Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <div className="group space-y-2">
            <Label
              htmlFor="password"
              className="flex items-center gap-2 font-medium text-slate-700 transition-colors group-hover:text-orange-500"
            >
              <Lock className="h-4 w-4" /> Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className={`w-full font-bold text-white shadow-xl transition-all duration-300 ${
                role === "traveller"
                  ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/20"
                  : role === "receiver"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
                  : "bg-orange-600 hover:bg-orange-500 shadow-orange-600/20"
              }`}
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          </motion.div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className={`font-semibold underline-offset-4 decoration-2 hover:underline transition-colors ${
              role === "traveller"
                ? "text-purple-400 hover:text-purple-300"
                : "text-orange-400 hover:text-orange-300"
            }`}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </AuthAnimationWrapper>
  );
}
