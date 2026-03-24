import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserRole } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  UserPlus, Mail, Lock, Phone, Calendar, MapPin, 
  Upload, ChevronRight, ChevronLeft, Building2,
  Package, Truck, CheckCircle2, ShieldCheck, User, Camera, Check, Map as MapIcon
} from "lucide-react";
import { toast } from "sonner";
import LiveCameraModal from "@/components/LiveCameraModal";
import AuthAnimationWrapper from "@/components/AuthAnimationWrapper";

const idTypes = ["Aadhaar", "PAN", "Passport"];

export default function Signup() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  // Unified State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Modals & UI status
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) {
      toast.error("Please agree to the Terms & Conditions");
      return;
    }

    setSubmitting(true);
    const finalRole: UserRole = "sender_receiver";

    const res = await signup({
      name, email, password, phone,
      role: finalRole,
      dob, gender, address, city, state, pincode,
      idProofType: idType,
      idNumber, idPhoto: idPhoto || undefined, livePhoto: livePhoto || undefined, profilePhoto: profilePhoto || undefined
    });

    setSubmitting(false);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2500);
    } else {
      toast.error(res.message || "Signup failed");
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
           <p className="text-slate-500 font-medium max-w-sm mb-6">Welcome to CarryGo. Redirecting you to your personalized dashboard...</p>
           <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
             <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} className="h-full bg-green-500" />
           </div>
        </motion.div>
      </div>
    );
  }

  const renderStepOne = () => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">Full Name</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="" className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-purple-500 font-medium" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
             <Label className="font-semibold text-slate-600">Email Address</Label>
             <div className="relative">
               <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
               <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white font-medium" />
             </div>
          </div>
          <div className="space-y-2">
             <Label className="font-semibold text-slate-600">Phone Number</Label>
             <div className="relative">
               <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
               <Input required value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="" className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white font-medium" />
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">Secure Password</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white font-medium" />
          </div>
        </div>
      </div>
      <Button type="button" onClick={handleNext} disabled={!name || !email || !password || phone.length < 10} className="w-full h-12 mt-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg shadow-purple-600/20">Next Step <ChevronRight className="ml-2 h-5 w-5" /></Button>
    </motion.div>
  );

  const renderStepTwo = () => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">Date of Birth</Label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Select Gender" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
         <Label className="font-semibold text-slate-600">Full Address</Label>
         <div className="relative">
           <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
           <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Building, Street Name, Area" className="w-full pl-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">State</Label>
          <Input value={state} onChange={(e) => setStateName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-200" />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">Pincode</Label>
          <Input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 rounded-xl bg-slate-50 border-slate-200" />
        </div>
      </div>

      <div className="space-y-2">
         <Label className="font-semibold text-slate-600">Profile Photo (Optional)</Label>
         <Label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 hover:bg-slate-100 transition-colors">
            {profilePhoto ? (
               <div className="flex items-center gap-4">
                 <img src={profilePhoto} alt="Profile" className="h-16 w-16 rounded-full object-cover shadow-sm border" />
                 <span className="text-sm font-bold text-slate-600">Change Photo</span>
               </div>
            ) : (
               <div className="text-center text-slate-500">
                 <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                 <span className="text-sm font-semibold">Click to upload photo</span>
               </div>
            )}
            <Input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setProfilePhoto)} />
         </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={handlePrev} className="h-12 rounded-xl w-1/3 text-slate-600 border-slate-200 font-bold hover:bg-slate-50"><ChevronLeft className="mr-2 h-5 w-5" /> Back</Button>
        <Button type="button" onClick={handleNext} disabled={!dob || !address || !city} className="h-12 rounded-xl flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-600/20">Next Step <ChevronRight className="ml-2 h-5 w-5" /></Button>
      </div>
    </motion.div>
  );

  const renderStepThree = () => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">ID Proof Type</Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200"><SelectValue placeholder="Select ID Type" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {idTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="font-semibold text-slate-600">ID Number</Label>
          <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value.toUpperCase())} placeholder={`Enter ${idType} Number`} className="h-12 rounded-xl bg-slate-50 border-slate-200 font-mono tracking-wide" />
        </div>
      </div>

      <div className="space-y-2">
         <Label className="font-semibold text-slate-600">Upload ID Document (Front Image)</Label>
         <Label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 hover:bg-slate-100 transition-colors">
            {idPhoto ? (
               <div className="flex flex-col items-center gap-2">
                 <CheckCircle2 className="h-8 w-8 text-green-500" />
                 <span className="text-sm font-bold text-slate-600">Document Uploaded Successfully</span>
               </div>
            ) : (
               <div className="text-center text-slate-500">
                 <Upload className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                 <span className="text-sm font-semibold">Upload clear image of {idType}</span>
               </div>
            )}
            <Input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setIdPhoto)} />
         </Label>
      </div>

      <div className="space-y-2">
         <Label className="font-semibold text-slate-600">Live Identity Check (Selfie)</Label>
         <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {livePhoto ? (
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <img src={livePhoto} alt="Live" className="h-12 w-12 rounded-xl object-cover" />
                   <span className="text-sm font-bold text-slate-600">Identity Verified</span>
                 </div>
                 <Button type="button" variant="outline" size="sm" onClick={() => setIsCameraOpen(true)} className="rounded-full">Retake</Button>
               </div>
            ) : (
               <div className="flex flex-col items-center text-center p-4">
                 <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                 <p className="mb-4 text-sm font-medium text-slate-500">We require a live selfie to verify your identity.</p>
                 <Button type="button" onClick={() => setIsCameraOpen(true)} className="rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-bold px-6">
                   <Camera className="mr-2 h-4 w-4" /> Take Selfie
                 </Button>
               </div>
            )}
         </div>
      </div>

      <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
         <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(val) => setAgreedTerms(val as boolean)} className="rounded-md border-slate-300 text-purple-600" />
         <Label htmlFor="terms" className="text-sm font-medium text-slate-600 leading-tight">
           I agree to CarryGo's <a href="#" className="font-bold text-purple-600 hover:underline">Terms of Service</a> and <a href="#" className="font-bold text-purple-600 hover:underline">Privacy Policy</a>.
         </Label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={handlePrev} className="h-12 rounded-xl w-1/3 text-slate-600 border-slate-200 font-bold hover:bg-slate-50"><ChevronLeft className="mr-2 h-5 w-5" /> Back</Button>
        <Button type="submit" onClick={handleSubmit} disabled={!idNumber || !idPhoto || !livePhoto || !agreedTerms || submitting} className="h-12 flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-wide shadow-lg shadow-emerald-600/20">
          {submitting ? "Processing..." : "Create Account"}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <AuthAnimationWrapper role="sender_receiver">
       <div className="w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-8">
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create your account</h1>
             <p className="text-slate-500 font-medium mt-2">Sign up to CarryGo. It is quick and hassle-free.</p>
          </div>

          {/* Stepper Header */}
          <div className="mb-10 relative">
             <div className="h-1.5 w-full bg-slate-100 rounded-full absolute top-1/2 -translate-y-1/2" />
             <motion.div 
                initial={false}
                animate={{ width: `${(step / 3) * 100}%` }}
                className="h-1.5 absolute top-1/2 -translate-y-1/2 left-0 bg-purple-600 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]"
             />
             <div className="flex justify-between relative z-10 px-1">
               {[1, 2, 3].map((s) => (
                  <div key={s} className={`flex items-center justify-center h-10 w-10 rounded-full font-black text-sm border-4 border-white transition-all duration-300 ${s <= step ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                     {s < step ? <Check className="h-5 w-5" /> : s}
                  </div>
               ))}
             </div>
             <div className="flex justify-between mt-3 px-1">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step >= 1 ? 'text-purple-600' : 'text-slate-400'}`}>Account</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step >= 2 ? 'text-purple-600' : 'text-slate-400'}`}>Personal</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${step === 3 ? 'text-purple-600' : 'text-slate-400'}`}>Verify</span>
             </div>
          </div>

          {/* Form Steps */}
          <form onSubmit={e => e.preventDefault()} className="relative">
             <AnimatePresence mode="wait">
               {step === 1 && <motion.div key="step1">{renderStepOne()}</motion.div>}
               {step === 2 && <motion.div key="step2">{renderStepTwo()}</motion.div>}
               {step === 3 && <motion.div key="step3">{renderStepThree()}</motion.div>}
             </AnimatePresence>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-sm font-semibold text-slate-500">
               Already have an account?{" "}
               <Link to="/login" className="font-bold text-purple-600 hover:text-purple-700 hover:underline">Log in securely</Link>
            </p>
          </div>

          {isCameraOpen && (
            <LiveCameraModal 
              isOpen={isCameraOpen}
              onCapture={(photoStr) => { setLivePhoto(photoStr); setIsCameraOpen(false); }} 
              onClose={() => setIsCameraOpen(false)} 
            />
          )}

       </div>
    </AuthAnimationWrapper>
  );
}
