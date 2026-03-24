import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) return "Email is required";
    if (!re.test(val)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (val: string) => {
    if (!val) return "Password is required";
    if (val.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });

    if (emailErr || passwordErr) {
      toast.error("Please fix the errors");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Welcome back to CarryGo!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(result.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50/50 px-4 pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
           <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-500/30">
              <ShieldCheck className="h-10 w-10 text-white" />
           </div>
           <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
           <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-400" /> All-in-one Platform access
           </p>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-2xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`h-14 border-slate-200 bg-slate-50 pl-12 rounded-2xl focus:border-orange-500 focus:ring-orange-500/10 font-medium ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-bold pl-2">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1 pr-1">
                 <Label htmlFor="password" title="" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</Label>
                 <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`h-14 border-slate-200 bg-slate-50 pl-12 rounded-2xl focus:border-orange-500 focus:ring-orange-500/10 font-medium ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-bold pl-2">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 h-14 w-full bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 text-lg group"
            >
              {isSubmitting ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="flex items-center gap-2">SIGN IN NOW <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
              )}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              New to CarryGo?{" "}
              <Link to="/signup" className="text-orange-500 hover:text-orange-600 font-black decoration-2 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
        
        {/* Footnote */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
           <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4 grayscale" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" className="h-4 grayscale" />
           <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 grayscale" />
        </div>
      </motion.div>
    </div>
  );
}

// Helper icon
function ChevronRight(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" 
      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
