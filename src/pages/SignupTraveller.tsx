import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Camera, FileText, ShieldCheck, Upload, 
  ChevronRight, ChevronLeft, CheckCircle2, Calendar, 
  MapPinned, CreditCard, UserCircle, Check, User, Mail, Lock, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";
import LiveCameraModal from "@/components/LiveCameraModal";

const idTypes = ["Aadhaar", "PAN", "Passport"];

export default function SignupTraveller() {
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  
  const [idType, setIdType] = useState("Aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  
  const [agreedTerms, setAgreedTerms] = useState(false);

  // UI State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoadingInProgress, setIsLoadingInProgress] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100;

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setter(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
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
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber || !idPhoto || !livePhoto) {
      toast.error("Please complete verification details");
      return;
    }
    if (!agreedTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsLoadingInProgress(true);
    const signupData = {
      name,
      email,
      password,
      role: "traveller" as any,
      phone: `+91${phone}`,
      dob,
      gender,
      address,
      idProofType: idType,
      idNumber,
      idPhoto,
      livePhoto,
      profilePhoto: profilePhoto || livePhoto,
    };

    const result = await signup(signupData);
    setIsLoadingInProgress(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/traveller", { replace: true });
      }, 3000);
    } else {
      toast.error(result.message || "Registration failed. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-orange-50 p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-3xl bg-white p-12 text-center shadow-2xl"
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
            >
              <CheckCircle2 className="h-16 w-16" />
            </motion.div>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900">Traveller Account Created!</h2>
          <p className="text-slate-500">Welcome to CarryGo. Redirecting you to your dashboard...</p>
          <div className="mt-8 flex justify-center">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
              <motion.div 
                className="h-full bg-purple-600"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5 }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-white to-orange-100 p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div 
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    step >= s ? "border-purple-600 bg-purple-600 text-white" : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? "text-purple-600" : "text-slate-400"}`}>
                  Step {s}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progressValue} className="h-1.5 bg-slate-100" />
        </div>

        <motion.div 
          layout
          className="rounded-[2.5rem] border border-white/50 bg-white p-8 shadow-2xl backdrop-blur-2xl sm:p-10"
        >
          <div className="mb-8 text-center text-slate-800">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 shadow-lg">
               <Truck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {step === 1 ? "Traveller Info" : step === 2 ? "Personal Details" : "Verify Identity"}
            </h1>
            <p className="mt-2 text-slate-500 font-medium">
              Join as a traveller and start earning
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <User className="h-4 w-4 text-purple-600" /> Full Name
                      </Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Mail className="h-4 w-4 text-purple-600" /> Email Address
                      </Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Lock className="h-4 w-4 text-purple-600" /> Create Password
                      </Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Smartphone className="h-4 w-4 text-purple-600" /> Phone Number
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">+91</div>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 flex-1 rounded-xl" required />
                      </div>
                    </div>
                  </div>
                  <Button type="button" onClick={nextStep} className="h-12 w-full rounded-2xl bg-purple-600 text-lg font-bold shadow-lg">
                    Continue <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Calendar className="h-4 w-4 text-purple-600" /> Date of Birth
                      </Label>
                      <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <UserCircle className="h-4 w-4 text-purple-600" /> Gender (Optional)
                      </Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">Profile Photo</Label>
                    <div className="relative group">
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setProfilePhoto)} className="hidden" id="profile-upload" />
                      <label htmlFor="profile-upload" className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-purple-200 bg-purple-50">
                        {profilePhoto ? <img src={profilePhoto} className="h-full w-full object-cover" /> : <Upload className="h-8 w-8 text-purple-400" />}
                      </label>
                      <div className="absolute -bottom-1 -right-1 rounded-full bg-purple-600 p-1.5 text-white shadow-lg">
                        <Camera className="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPinned className="h-4 w-4 text-purple-600" /> Permanent Address
                    </Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl" required />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" onClick={prevStep} variant="outline" className="h-12 flex-1 rounded-2xl font-bold">
                       Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="h-12 flex-[2] rounded-2xl bg-purple-600 font-bold shadow-lg">
                      Next Step <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Select ID Proof Type</Label>
                      <Select value={idType} onValueChange={setIdType}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select ID Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {idTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CreditCard className="h-4 w-4 text-purple-600" /> {idType} Number
                      </Label>
                      <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="h-12 rounded-xl" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">ID Front Image</Label>
                        <div className="relative">
                           <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setIdPhoto)} className="hidden" id="id-photo-upload" />
                           <label htmlFor="id-photo-upload" className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
                              {idPhoto ? <img src={idPhoto} className="h-full w-full object-cover" /> : <Upload className="h-6 w-6 text-slate-400" />}
                           </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase">Live Selfie</Label>
                        <button type="button" onClick={() => setIsCameraOpen(true)} className="flex h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 group overflow-hidden">
                          {livePhoto ? <img src={livePhoto} className="h-full w-full object-cover" /> : <Camera className="h-6 w-6 text-purple-500" />}
                        </button>
                        <LiveCameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={setLivePhoto} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 rounded-xl bg-slate-50 p-4">
                    <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(checked) => setAgreedTerms(checked as boolean)} />
                    <label htmlFor="terms" className="text-[11px] leading-tight text-slate-600">
                      I agree to the <Link to="/terms" className="font-bold text-purple-600 underline">Terms of Service</Link> and <Link to="/privacy" className="font-bold text-purple-600 underline">Privacy Policy</Link>.
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" onClick={prevStep} variant="outline" className="h-12 flex-1 rounded-2xl font-bold">Back</Button>
                    <Button type="submit" disabled={isLoadingInProgress} className="h-12 flex-[2] rounded-2xl bg-purple-600 text-lg font-bold shadow-lg disabled:opacity-50">
                      {isLoadingInProgress ? "Processing..." : "Create Traveller Account"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
             Already have an account? <Link to="/login" className="font-bold text-purple-600">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
