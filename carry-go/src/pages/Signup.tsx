import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Package, Truck, MapPin, User, Mail, Lock, Bike, Bus, Car, Smartphone, Camera, FileText, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type UserRole } from "@/lib/authContext";
import { toast } from "sonner";
import AuthAnimationWrapper from "@/components/AuthAnimationWrapper";
import LiveCameraModal from "@/components/LiveCameraModal";

const roles: { value: UserRole; label: string; icon: typeof Package; desc: string }[] = [
  { value: "sender", label: "Sender", icon: Package, desc: "Send parcels to anyone, anywhere" },
  { value: "traveller", label: "Traveller", icon: Truck, desc: "Carry parcels along your route & earn" },
  { value: "receiver", label: "Receiver", icon: MapPin, desc: "Track incoming parcels in real-time" },
];

const vehicleTypes = [
  { value: "bike", label: "Bike", icon: Bike },
  { value: "car", label: "Car", icon: Car },
  { value: "van", label: "Van", icon: Truck },
  { value: "bus", label: "Bus", icon: Bus },
];

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [adharNumber, setAdharNumber] = useState("");
  const [adharPhoto, setAdharPhoto] = useState<string | null>(null);
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast.error("Please select your role");
      return;
    }
    if (role === "traveller") {
      if (!vehicle) {
        toast.error("Please select your vehicle type");
        return;
      }
      if (!adharNumber || !adharPhoto || !livePhoto) {
        toast.error("All verification fields are required for Travellers");
        return;
      }
    }

    const signupData = {
      name, email, password, role, phone,
      vehicleType: vehicle || undefined,
      adharNumber: role === 'traveller' ? adharNumber : undefined,
      adharPhoto: role === 'traveller' ? adharPhoto : undefined,
      livePhoto: role === 'traveller' ? livePhoto : undefined,
    };

    const success = await signup(signupData);
    if (success) {
      toast.success("Account created! Welcome to CarryGo 🎉");
      navigate(role === 'sender' ? "/sender" : role === 'traveller' ? "/traveller" : "/receiver");
    } else {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <AuthAnimationWrapper role={role}>
      <div className="w-full max-w-lg rounded-3xl border border-orange-100 bg-white/80 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-orange-500/30 hover:shadow-[0_0_50px_rgba(249,115,22,0.1)]">
        <div className="mb-8 text-center text-slate-800">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className={`mx-auto mb-4 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl shadow-lg transition-all duration-300 ${role === 'traveller' ? 'bg-purple-600 shadow-purple-600/20' : role === 'receiver' ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-orange-500 shadow-orange-500/20'
              }`}
          >
            {role === 'traveller' ? <Truck className="h-7 w-7 text-white" /> : role === 'receiver' ? <MapPin className="h-7 w-7 text-white" /> : <Package className="h-7 w-7 text-white" />}
          </motion.div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-2 text-slate-500">Join the CarryGo global network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="group space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors group-hover:text-orange-500">
                <User className="h-4 w-4" /> Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all duration-300"
              />
            </div>
            <div className="group space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors group-hover:text-orange-500">
                <Mail className="h-4 w-4" /> Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all duration-300"
              />
            </div>
          </div>
          <div className="group space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors group-hover:text-orange-500">
              <Lock className="h-4 w-4" /> Secure Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all duration-300"
            />
          </div>

          <div className="group space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors group-hover:text-orange-500">
              <Smartphone className="h-4 w-4" /> Phone Number
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234..."
              required
              className="border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 transition-all duration-300"
            />
          </div>

          <div>
            <Label className="mb-4 block text-sm font-semibold text-slate-700">Choose your role</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {roles.map((r) => {
                const isSelected = role === r.value;
                const Icon = r.icon;
                return (
                  <motion.button
                    key={r.value}
                    type="button"
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setRole(r.value);
                      if (r.value !== 'traveller') setVehicle(null);
                    }}
                    className={`group relative flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all ${isSelected
                      ? r.value === 'traveller'
                        ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10"
                        : r.value === 'receiver'
                          ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                          : "border-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/10"
                      : "border-slate-100 bg-slate-50/50 hover:border-orange-500/40 hover:bg-slate-100"
                      }`}
                  >
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isSelected
                      ? r.value === 'traveller' ? "bg-purple-500 text-white" : r.value === 'receiver' ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:text-orange-500"
                      }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`text-sm font-bold transition-colors ${isSelected
                      ? r.value === 'traveller' ? "text-purple-600" : r.value === 'receiver' ? "text-blue-600" : "text-orange-600"
                      : "text-slate-600"}`}>
                      {r.label}
                    </span>
                    <span className="mt-1 text-[10px] leading-tight text-slate-500">{r.desc}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {role === 'traveller' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-2 border-t border-purple-100"
            >
              <div className="flex items-center gap-2 text-purple-600 font-bold">
                <ShieldCheck className="h-5 w-5" />
                <span>Verification Details</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <FileText className="h-4 w-4" /> Aadhaar Number
                  </Label>
                  <Input
                    value={adharNumber}
                    onChange={(e) => setAdharNumber(e.target.value)}
                    placeholder="12-digit number"
                    className="border-slate-200 focus:border-purple-500 focus:ring-purple-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <Upload className="h-4 w-4" /> Aadhaar Photo
                  </Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setAdharPhoto)}
                      className="hidden"
                      id="adhar-upload"
                    />
                    <label
                      htmlFor="adhar-upload"
                      className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-slate-200 bg-slate-50 text-[10px] hover:bg-slate-100 transition-all font-medium text-slate-500 overflow-hidden"
                    >
                      {adharPhoto ? <img src={adharPhoto} className="h-full w-full object-cover" /> : "Upload Aadhaar PNG/JPG"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <Camera className="h-4 w-4" /> Live Selfie
                  </Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/30 text-[10px] hover:bg-purple-50 transition-all font-medium text-purple-500 overflow-hidden group/camera"
                    >
                      {livePhoto ? (
                        <div className="relative h-full w-full">
                          <img src={livePhoto} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/camera:opacity-100 transition-opacity">
                            <span className="text-white text-[9px] font-bold">Retake Photo</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100/50 transition-transform group-hover/camera:scale-110">
                            <Camera className="h-5 w-5" />
                          </div>
                          <span>Access Live Camera</span>
                        </>
                      )}
                    </button>
                    <LiveCameraModal
                      isOpen={isCameraOpen}
                      onClose={() => setIsCameraOpen(false)}
                      onCapture={setLivePhoto}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="mb-2 block text-sm font-semibold text-slate-700">Vehicle Type</Label>
                  <div className="grid gap-2 grid-cols-2">
                    {vehicleTypes.map((v) => {
                      const isSelected = vehicle === v.value;
                      const Icon = v.icon;
                      return (
                        <motion.button
                          key={v.value}
                          type="button"
                          whileHover={{ y: -2, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setVehicle(v.value)}
                          className={`flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-center transition-all ${isSelected
                            ? "border-purple-500 bg-purple-500/10 shadow-lg"
                            : "border-slate-100 bg-slate-50 hover:border-purple-500/40"
                            }`}
                        >
                          <Icon className={`h-4 w-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? "text-purple-600" : "text-slate-500"}`}>
                            {v.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className={`w-full font-bold text-white shadow-xl transition-all duration-300 ${role === 'traveller' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : role === 'receiver' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20'
                }`}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Get Started
            </Button>
          </motion.div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already a member?{" "}
          <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-500 hover:underline underline-offset-4 decoration-2">
            Sign In
          </Link>
        </p>
      </div>
    </AuthAnimationWrapper>
  );
}
