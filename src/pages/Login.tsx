import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Package, Mail, Lock, Truck, MapPin, Smartphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/lib/authContext";
import { toast } from "sonner";
import AuthAnimationWrapper from "@/components/AuthAnimationWrapper";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
<<<<<<< HEAD
  const [role, setRole] = useState<UserRole>("sender");
  const [errors, setErrors] = useState({ email: "", password: "", phone: "" });
  const { login, user, isLoading } = useAuth();
=======
  const [role, setRole] = useState<"sender" | "traveller" | "receiver">("sender");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { login } = useAuth();
>>>>>>> sender
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
  const validatePhone = (val: string) => {
    if (!val) return "Phone number is required";
    if (!/^\d{10}$/.test(val)) return "Phone number must be exactly 10 digits";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailErr = role === 'receiver' ? "" : validateEmail(email);
    const passwordErr = validatePassword(password);
    const phoneErr = role === 'receiver' ? validatePhone(phone) : "";
    setErrors({ email: emailErr, password: passwordErr, phone: phoneErr });

    if (emailErr || passwordErr || phoneErr) {
      toast.error("Please fix the errors");
      return;
    }

    try {
      // call login with role
      const loginEmail = role === 'receiver' ? `${phone}@receiver.carrygo.com` : email;
      const result = await login(loginEmail, password);
      if (result.success) {
        toast.success("Welcome back!");
<<<<<<< HEAD
        navigate("/dashboard", { replace: true });
=======
        navigate("/dashboard");
>>>>>>> sender
      } else {
        toast.error(result.message || "Invalid email or password");
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



        <form onSubmit={handleSubmit} className="space-y-4">
<<<<<<< HEAD
          {role !== 'receiver' ? (
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
                }}
                placeholder="Enter your email"
                required
                className={`border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-[10px] text-red-500 font-medium pl-1">{errors.email}</p>}
            </div>
          ) : (
            <>
              <div className="group space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 font-medium text-slate-700 transition-colors group-hover:text-blue-500">
                  <User className="h-4 w-4" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all duration-300"
                />
              </div>
              <div className="group space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 font-medium text-slate-700 transition-colors group-hover:text-blue-500">
                  <Smartphone className="h-4 w-4" /> Phone Number
                </Label>
                <div className="flex gap-0 overflow-hidden rounded-md border border-slate-200 transition-all duration-300 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20">
                  <div className="flex items-center justify-center bg-slate-100 px-3 text-sm font-bold text-slate-600 border-r border-slate-200">
                    +91
                  </div>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
                      setErrors(prev => ({ ...prev, phone: validatePhone(val) }));
                    }}
                    placeholder="10-digit number"
                    required
                    className="border-0 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-red-500 font-medium pl-1">{errors.phone}</p>}
              </div>
            </>
          )}
=======
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
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }));
              }}
              placeholder=""
              required
              className={`border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all ${errors.email ? 'border-red-500' : ''}`}
            />
            {errors.email && <p className="text-[10px] text-red-500 font-medium pl-1">{errors.email}</p>}
          </div>
>>>>>>> sender
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
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }));
              }}
              placeholder=""
              required
              className={`border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all ${errors.password ? 'border-red-500' : ''}`}
            />
            {errors.password && <p className="text-[10px] text-red-500 font-medium pl-1">{errors.password}</p>}
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
