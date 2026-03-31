import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Wallet, 
  Truck, 
  Package, 
  MapPin, 
  LogOut, 
  ArrowLeft,
  Settings,
  HelpCircle,
  Clock,
  Edit2,
  Check,
  X,
  Loader2,
  Camera,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    navigate("/");
  };

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    const success = await updateUser({ name: editedName });
    setIsSaving(false);
    if (success) {
      toast.success("Username updated!");
      setIsEditing(false);
    } else {
      toast.error("Failed to update username");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      try {
        const base64 = await fileToBase64(file);
        const success = await updateUser({ profilePhoto: base64 });
        if (success) {
          toast.success("Profile photo updated!");
        } else {
          toast.error("Failed to update profile photo");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update profile photo");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-12 transition-all">
      <div className="mx-auto max-w-2xl px-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </motion.button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50"
        >
          {/* Header/Cover */}
          <div className="h-32 w-full bg-orange-600" />

          <div className="px-8 pb-8">
            {/* Avatar Row */}
            <div className="relative -mt-16 mb-6 flex items-end justify-between">
               <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-lg group/avatar relative">
                  {user.profilePhoto ? (
                    <img 
                      src={user.profilePhoto} 
                      alt="Profile" 
                      className="h-full w-full object-cover transition-transform group-hover/avatar:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <User className="h-16 w-16" />
                    </div>
                  )}
                  
                  {/* Photo Edit Overlay */}
                  <label 
                    htmlFor="profile-photo-upload"
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold">Edit Photo</span>
                  </label>
                  <input 
                    type="file" 
                    id="profile-photo-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  
                  {isSaving && !isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 rounded-2xl bg-white p-1.5 shadow-md">
                   <div className="rounded-xl p-1.5 bg-orange-100 text-orange-600">
                     <Package className="h-5 w-5" />
                   </div>
                </div>
              </div>

              <div className="pb-2 flex-1 ml-6">
                <div className="flex items-center gap-2 group">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-8 font-bold text-lg border-primary/50 focus:ring-primary/20"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleUpdateName} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { setIsEditing(false); setEditedName(user.name); }} disabled={isSaving}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-slate-900 leading-tight">{user.name}</h1>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary"
                        title="Edit name"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500 capitalize">CarryGo Member</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                    <p className="text-sm font-semibold text-slate-700">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</p>
                    <p className="text-sm font-semibold text-slate-700">{user.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wallet Balance</p>
                    <p className="text-sm font-bold text-green-600">₹{user.walletBalance || 0}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {user.role === 'traveller' && (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Verification</p>
                        <p className="text-sm font-semibold text-slate-700">{user.idNumber?.replace(/.(?=.{4})/g, '*') || 'Verified'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle Type</p>
                        <p className="text-sm font-semibold text-slate-700 capitalize">{user.vehicleType || 'Not specified'}</p>
                      </div>
                    </div>
                  </>
                )}

                </div>
              </div>
            </div>

            {/* NEW: Personal OTP Section */}
            <div className="mt-8 rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-orange-500 p-2 text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight font-heading">Personal Delivery OTP</h3>
                  </div>
                  <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Secure Code</span>
                  </div>
                </div>
                
                <p className="text-xs font-semibold text-white/50 mb-6 leading-relaxed">
                  Provide this 6-digit code to the traveller when they hand over your parcel. This ensures you've received the correct item.
                </p>

                <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/10 group/otp">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Your Unique Code</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black tracking-[0.3em] font-mono text-white">
                        {user.personalOtp || '000000'}
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/40 group-hover/otp:scale-110 transition-transform">
                    <Smartphone className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Section */}
            <div className="mt-10 border-t border-slate-100 pt-8 text-center pb-8 px-8">
              <Button 
                onClick={handleLogout}
                variant="destructive" 
                className="w-full h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-red-500/10"
              >
                <LogOut className="h-5 w-5" /> Logout from Account
              </Button>
            </div>
          </motion.div>

        {/* Identity Documents (Only for travellers) */}
        {user.idPhoto && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50"
          >
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
              Verification Documents
            </h2>
            <div className="bg-slate-50 rounded-2xl p-4 flex justify-center">
              <img 
                src={user.idPhoto} 
                alt="ID Document" 
                className="max-h-48 rounded-xl shadow-md"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
