import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserPlus, Mail, Lock, Phone, Calendar, MapPin, 
  Upload, ChevronRight, ChevronLeft, Building2,
  Package, Truck, CheckCircle2, ShieldCheck, User, Camera, Check, Map as MapIcon,
  MapPinned, UserCircle
} from "lucide-react";
import { toast } from "sonner";
import LiveCameraModal from "@/components/LiveCameraModal";
import AuthAnimationWrapper from "@/components/AuthAnimationWrapper";
import ProcessFlow from "@/components/ProcessFlow";

const idTypes = ["Aadhaar", "PAN", "Passport"];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signup, user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Unified State from SignupUser/Traveller
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"sender_receiver" | "traveller">("sender_receiver");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Modals & UI status
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Integrated Advanced File Handler with Compression from SignupUser.tsx
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 1200;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 80% quality
          setter(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name || !email || !password || !phone) {
        toast.error("Please fill all account details");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Invalid email format");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (phone.length !== 10) {
        toast.error("Phone number must be 10 digits");
        return;
      }
    } else if (step === 2) {
      if (!dob || !address) {
        toast.error("Please fill all personal details");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber || !idPhoto || !livePhoto) {
      toast.error("Please complete verification details");
      return;
    }
    if (!agreedTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }

    setSubmitting(true);
    try {
      // Logic from SignupUser/Traveller: use selected role
      const result = await signup({
        name,
        email,
        password,
        phone: `+91${phone.replace(/^(?:\+91|91)/, "").slice(-10)}`,
        role: role as any,
        sub_role: role === "sender_receiver" ? "sender" : undefined,
        dob,
        gender,
        address,
        idProofType: idType,
        idNumber,
        idPhoto: idPhoto || undefined,
        livePhoto: livePhoto || undefined,
        profilePhoto: profilePhoto || livePhoto || undefined
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success("Account created successfully!");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 3000);
      } else {
        toast.error(result.message || "Signup failed. Please check your details.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred during signup.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-2xl border border-white/60">
           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-xl shadow-green-500/30">
             <CheckCircle2 className="h-12 w-12" />
           </motion.div>
           <h1 className="mb-4 text-3xl font-black text-slate-800">Account Created!</h1>
           <p className="text-slate-500 font-medium max-w-sm mb-6">Welcome to CarryGo. Redirecting you to your unified dashboard...</p>
           <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
             <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} className="h-full bg-green-500" />
           </div>
        </motion.div>
      </div>
    );
  }

  const renderStepOne = () => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
      <div className="space-y-6">
        {/* Role Selection Pulled from SignupType */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <button 
            type="button"
            onClick={() => setRole("sender_receiver")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === "sender_receiver" ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10' : 'border-neutral-100 hover:border-orange-200'}`}
           >
              <Package className={`h-6 w-6 ${role === "sender_receiver" ? 'text-orange-500' : 'text-neutral-400'}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${role === "sender_receiver" ? 'text-orange-600' : 'text-neutral-500'}`}>Send/Receive</span>
           </button>
           <button 
            type="button"
            onClick={() => setRole("traveller")}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === "traveller" ? 'border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10' : 'border-neutral-100 hover:border-orange-200'}`}
           >
              <Truck className={`h-6 w-6 ${role === "traveller" ? 'text-orange-500' : 'text-neutral-400'}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${role === "traveller" ? 'text-orange-600' : 'text-neutral-500'}`}>Traveller</span>
           </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
          <Label className="font-semibold text-slate-600 ml-1">Full Name</Label>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="relative group">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" className="h-14 pl-11 rounded-2xl bg-neutral-50 border-neutral-200 focus:bg-white focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-all font-bold text-slate-700 shadow-sm" />
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
             <Label className="font-semibold text-slate-600 ml-1">Email Address</Label>
             <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="relative group">
               <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
               <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-14 pl-11 rounded-2xl bg-neutral-50 border-neutral-200 focus:bg-white focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-all font-bold text-slate-700 shadow-sm" />
             </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
             <Label className="font-semibold text-slate-600 ml-1">Phone Number</Label>
             <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="relative group">
               <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
               <Input required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="1234567890" className="h-14 pl-11 rounded-2xl bg-neutral-50 border-neutral-200 focus:bg-white focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-all font-bold text-slate-700 shadow-sm" />
             </motion.div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-2">
          <Label className="font-semibold text-slate-600 ml-1">Secure Password</Label>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="relative group">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-orange-500" />
            <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-14 pl-11 rounded-2xl bg-neutral-50 border-neutral-200 focus:bg-white focus-visible:ring-orange-500/20 focus-visible:border-orange-500 transition-all font-bold text-slate-700 shadow-sm" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
        <Button onClick={handleNext} className="w-full h-16 rounded-[1.5rem] bg-orange-500 hover:bg-orange-600 text-white font-black text-xl shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.02] hover:-translate-y-1 flex items-center justify-center gap-3">
          Next Step <ChevronRight className="h-6 w-6" />
        </Button>
      </motion.div>
    </motion.div>
  );

  const renderStepTwo = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-semibold text-slate-600">Birthday</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-12 pl-11 rounded-xl bg-neutral-50 border-neutral-200 font-medium" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold text-slate-600">Gender</Label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-neutral-50 border-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500">
               <option value="">Select</option>
               <option value="male">Male</option>
               <option value="female">Female</option>
               <option value="other">Other</option>
            </select>
          </div>
       </div>

       {/* Pulled from specialized pages: Profile Photo */}
       <div className="flex flex-col items-center justify-center space-y-3">
          <Label className="text-sm font-semibold text-slate-700">Profile Photo (Optional)</Label>
          <div className="relative group">
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setProfilePhoto)} className="hidden" id="profile-upload" />
            <label htmlFor="profile-upload" className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-orange-200 bg-orange-50">
              {profilePhoto ? <img src={profilePhoto} className="h-full w-full object-cover" /> : <Upload className="h-8 w-8 text-orange-400" />}
            </label>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-orange-600 p-1.5 text-white shadow-lg">
              <Camera className="h-3 w-3" />
            </div>
          </div>
        </div>

       {/* Pulled from specialized pages: Address */}
       <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 ml-1">
            <MapPinned className="h-4 w-4 text-orange-500" /> Permanent Address
          </Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, State, ZIP" className="h-12 rounded-xl bg-neutral-50 border-neutral-200 font-medium" required />
       </div>

       <div className="space-y-4">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest pt-2">Identity Verification</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label className="font-semibold text-slate-600">ID Type</Label>
                <select value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-neutral-50 border-neutral-200 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500">
                   {idTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <Label className="font-semibold text-slate-600">{idType} Number</Label>
                <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={`Enter ${idType} number`} className="h-12 rounded-xl bg-neutral-50 border-neutral-200 font-medium" />
             </div>
          </div>

          <div className="space-y-2">
             <Label className="font-semibold text-slate-600">Proof of Identity (Photo)</Label>
             <div className="flex items-center gap-4">
                <div className="relative flex-1">
                   <Upload className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setIdPhoto)} className="h-12 pl-11 rounded-xl bg-neutral-50 border-neutral-200 file:hidden cursor-pointer" />
                </div>
                {idPhoto && <div className="h-12 w-12 rounded-lg border overflow-hidden"><img src={idPhoto} className="h-full w-full object-cover" /></div>}
             </div>
          </div>
       </div>

       <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrev} className="h-14 rounded-2xl border-neutral-200 font-bold px-6">Back</Button>
          <Button onClick={handleNext} className="flex-1 h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg group">
            Continue
            <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
       </div>
    </motion.div>
  );

  const renderStepThree = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
       <div className="text-center space-y-3">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-orange-500 mb-2">
             <Camera className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Final Verification</h3>
          <p className="text-sm text-slate-500">Take a quick live photo to secure your account.</p>
       </div>

       <div className="flex flex-col items-center gap-6">
          <div className="relative h-48 w-48 rounded-[2.5rem] bg-neutral-50 border-4 border-dashed border-neutral-200 flex items-center justify-center overflow-hidden">
             {livePhoto ? (
               <img src={livePhoto} className="h-full w-full object-cover" />
             ) : (
               <User className="h-16 w-16 text-slate-300" />
             )}
             <Button onClick={() => setIsCameraOpen(true)} className="absolute bottom-2 h-10 w-10 rounded-full bg-white text-secondary shadow-lg p-0 hover:scale-110 border">
                <Camera className="h-5 w-5" />
             </Button>
          </div>

          <div className="w-full space-y-4 pt-4">
             <div className="flex items-center space-x-3 rounded-2xl border border-neutral-100 bg-neutral-50/50 p-4">
                <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(checked) => setAgreedTerms(checked as boolean)} className="h-5 w-5 rounded-md border-neutral-300" />
                <Label htmlFor="terms" className="text-xs font-medium text-slate-600 leading-relaxed cursor-pointer">
                  I agree to CarryGo's <Link to="/terms" className="text-orange-500 underline font-bold">Terms of Service</Link> and <Link to="/privacy" className="text-orange-500 underline font-bold">Privacy Policy</Link>.
                </Label>
             </div>

             <div className="flex gap-3">
                <Button variant="outline" onClick={handlePrev} className="h-14 rounded-2xl border-neutral-200 font-bold px-6">Back</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-lg shadow-xl shadow-orange-500/30 disabled:opacity-50">
                  {submitting ? "Creating Account..." : "Complete Signup"}
                </Button>
             </div>
          </div>
       </div>

       <LiveCameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={setLivePhoto} 
       />
    </motion.div>
  );

  return (
    <AuthAnimationWrapper fullWidth={true}>
      <div className="flex w-full min-h-screen flex-col overflow-hidden bg-white lg:flex-row shadow-2xl">
        {/* Left Side: Brand & Visuals */}
        <div className="relative hidden lg:flex lg:flex-col justify-start bg-[#0F172A] p-12 text-white lg:w-[45%] xl:w-[40%] overflow-y-auto custom-scrollbar border-r border-white/5 scroll-smooth">
          <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-orange-500/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative z-10 mb-12">
            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-2xl shadow-orange-500/30">
                <Package className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight font-heading">CarryGo</span>
            </Link>
          </div>

          <div className="relative z-10 mb-12 space-y-4">
            <div className="inline-flex rounded-full bg-orange-500/10 px-6 py-2 text-xs font-black uppercase tracking-widest text-orange-500 border border-orange-500/20">
               Secure Handover Ecosystem
            </div>
            <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl tracking-tighter">
               Simple. Secure.<br />
               <span className="text-shimmer bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Smart Delivery.</span>
            </h1>
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center">
             <ProcessFlow />
             <div className="mt-12 text-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Built for speed, trusted for reliability</p>
                <div className="flex justify-center gap-3">
                   <div className="h-1.5 w-12 rounded-full bg-orange-500/30 transition-all hover:bg-orange-500" />
                   <div className="h-1.5 w-4 rounded-full bg-slate-800 transition-all hover:bg-orange-500" />
                   <div className="h-1.5 w-4 rounded-full bg-slate-800 transition-all hover:bg-orange-500" />
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-1 items-center justify-center p-8 lg:p-16 xl:p-24 bg-white/95 backdrop-blur-xl">
          <div className="w-full max-w-lg lg:max-w-md xl:max-w-xl">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-[#0F172A] mb-3 leading-tight">Join the Community</h2>
              <p className="text-slate-500 font-medium font-heading">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-500 underline font-bold hover:text-orange-600">
                  Log in now
                </Link>
              </p>
            </div>

            {/* Step Progress Container */}
            <div className="mb-10 relative">
               <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-100 -translate-y-1/2 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(step / 3) * 100}%` }}
                    className="h-full bg-orange-500"
                  />
               </div>
               <div className="relative flex justify-between">
                  {[1, 2, 3].map((s) => (
                    <motion.div 
                      key={s} 
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 relative z-10 cursor-default ${
                        step >= s ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/40' : 'bg-white border-2 border-neutral-100 text-neutral-300'
                      }`}
                    >
                      {step > s ? <Check className="h-5 w-5" /> : s}
                    </motion.div>
                  ))}
               </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && renderStepOne()}
              {step === 2 && renderStepTwo()}
              {step === 3 && renderStepThree()}
            </AnimatePresence>
            
            <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              CarryGo Logistics • Built for Trust
            </p>
          </div>
        </div>
      </div>
    </AuthAnimationWrapper>
  );
}
