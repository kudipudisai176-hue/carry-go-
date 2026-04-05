import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Star, Package, X, Camera, Save, Loader2, PenLine, Phone, MessageSquare, Truck, Scan, LifeBuoy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserData } from "@/lib/parcelStore";
import { useAuth } from "@/lib/authContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { compressImage } from "@/lib/imageUtils";

import * as Portal from "@radix-ui/react-portal";

interface UserProfileModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user: initialUser, isOpen, onClose }: UserProfileModalProps) {
  const { user: loggedInUser, updateUser, deleteUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (initialUser && isOpen) {
      setName(initialUser.name);
      setBio(initialUser.bio || "");
      setPhoto(initialUser.profilePhoto || "");
      setEmail(initialUser.email || "");
      setPhone(initialUser.phone || "");
      setAadharNumber(initialUser.aadharNumber || "");
      setVehicleType(initialUser.vehicleType || "");
      setIsEditing(false); // Reset editing mode when opening/switching
    }
  }, [initialUser, isOpen]);

  if (!initialUser) return null;

  const isOwnProfile = loggedInUser?.id === initialUser.id;

  const handlePhotoClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await compressImage(file);
        setPhoto(base64);
      } catch (err) {
        console.error("Profile photo update failed:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await updateUser({
        name,
        email,
        phone,
        profilePhoto: photo,
        bio,
        aadharNumber,
        vehicleType,
      });


      if (success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete your CarryGo account and all active delivery data. Are you sure?")) return;
    
    setIsSaving(true);
    try {
      const success = await deleteUser();
      if (success) {
        toast.success("Account deleted. See you again soon!");
        onClose();
      } else {
        toast.error("Failed to delete account");
      }
    } catch (err) {
      toast.error("An error occurred during deletion");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Portal.Root>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSaving && onClose()}
            className="fixed inset-0 cursor-pointer"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-visible rounded-[2.5rem] border border-white/20 bg-card/95 shadow-2xl backdrop-blur-xl my-auto"
          >
            {/* Header / Banner */}
            <div className="h-32 bg-gradient-to-br from-secondary via-secondary/90 to-primary rounded-t-[2.5rem] relative">
               {/* Decorative Circles */}
               <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
               <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/20 blur-xl" />

               <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                disabled={isSaving}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md"
              >
                <X className="h-4 w-4" />
              </Button>

              {isOwnProfile && !isEditing && (
                <Button 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="absolute left-4 top-4 z-10 rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md gap-1.5 border border-white/30"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              )}

              {/* Avatar - Attached to Banner but pops out */}
              <div className="absolute -bottom-10 left-8 z-50">
                <div 
                  className={`h-24 w-24 rounded-3xl border-4 border-card bg-muted shadow-[0_8px_30px_rgb(0,0,0,0.18)] overflow-hidden relative group transition-all duration-300 ${isEditing ? 'ring-2 ring-secondary ring-offset-4 cursor-pointer scale-105' : ''}`}
                  onClick={handlePhotoClick}
                >
                  {photo ? (
                    <img src={photo} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary/10 text-secondary">
                      <User className="h-10 w-10" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-7 w-7 text-white mb-1" />
                      <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Update</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </div>

            {/* Profile Content Container */}
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-8 pt-12 relative custom-scrollbar">
              <div className="mt-2">
                {isEditing ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                        <User className="h-3 w-3" /> Full Name
                      </label>
                      <Input 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your display name"
                        className="rounded-2xl border-border bg-muted/30 focus:ring-secondary/20 h-11"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                          Phone
                        </label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} className="rounded-2xl bg-muted/30 border-none h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                          Email
                        </label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} className="rounded-2xl bg-muted/30 border-none h-11" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                          Aadhaar
                        </label>
                        <Input value={aadharNumber} onChange={e => setAadharNumber(e.target.value)} className="rounded-2xl bg-muted/30 border-none h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                          Vehicle Type
                        </label>
                        <Input value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="rounded-2xl bg-muted/30 border-none h-11" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-1.5">
                        <PenLine className="h-3 w-3" /> About Me (Bio)
                      </label>
                      <Textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell the community about verified trips..."
                        className="rounded-2xl border-border bg-muted/30 min-h-[100px] focus:ring-secondary/20 resize-none p-4"
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                       <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full rounded-2xl bg-secondary text-white font-black h-14 gap-2 shadow-xl shadow-secondary/30 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        SAVE PROFILE DATA
                      </Button>
                      
                      <div className="flex gap-3">
                         <Button 
                          variant="ghost" 
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                          className="flex-1 rounded-2xl h-12 text-muted-foreground hover:bg-muted font-bold"
                        >
                          Cancel
                        </Button>
                         <Button 
                          variant="ghost" 
                          onClick={handleDelete}
                          disabled={isSaving}
                          className="flex-1 rounded-2xl h-12 text-red-500 hover:bg-red-500/10 font-bold"
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold font-heading text-foreground tracking-tight">{initialUser.name}</h3>
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-200/50">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        {initialUser.rating || 5.0}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      {initialUser.bio || "This user is a trusted member of the CarryGo community with a focus on safe and timely deliveries."}
                    </p>

                    {/* Contact & Verification Grid (Point 13) */}
                    <div className="grid grid-cols-1 gap-2.5 mb-8">
                       <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 text-sm">
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                             <Phone className="h-4 w-4" />
                          </div>
                          <div>
                             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Phone Number</p>
                             <p className="font-bold text-foreground">{initialUser.phone || "Not provided"}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 text-sm">
                          <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
                             <MessageSquare className="h-4 w-4" />
                          </div>
                          <div>
                             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Email Address</p>
                             <p className="font-bold text-foreground">{initialUser.email || "Not provided"}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2.5">
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 text-sm">
                             <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0">
                                <Truck className="h-4 w-4" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Vehicle</p>
                                <p className="font-bold text-foreground truncate">{initialUser.vehicleType || "None"}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/30 border border-border/50 text-sm">
                             <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                                <Scan className="h-4 w-4" />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Aadhaar</p>
                                <p className="font-bold text-foreground">
                                   {initialUser.aadharNumber ? `•••• •••• ${initialUser.aadharNumber.slice(-4)}` : "Unverified"}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="group rounded-3xl bg-secondary/5 p-5 border border-secondary/10 text-center transition-colors hover:bg-secondary/10">
                        <div className="h-10 w-10 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Package className="h-5 w-5 text-secondary" />
                        </div>
                        <p className="text-2xl font-black text-foreground leading-none mb-1">{initialUser.totalTrips || 0}</p>
                        <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/60">Completed</p>
                      </div>
                       <div className="group rounded-3xl bg-amber-400/5 p-5 border border-amber-400/10 text-center transition-colors hover:bg-amber-400/10">
                        <div className="h-10 w-10 rounded-2xl bg-amber-400/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-2xl font-black text-foreground leading-none mb-1">{(initialUser.rating || 5.0).toFixed(1)}</p>
                        <p className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/60">Rating</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-4">Help & Support</p>
                      <Button 
                        onClick={() => { navigate('/support'); onClose(); }}
                        className="w-full rounded-2xl h-14 gap-3 bg-secondary/10 hover:bg-secondary/20 text-secondary font-black border-2 border-secondary/20 group transition-all mb-1"
                      >
                         <LifeBuoy className="h-5 w-5 group-hover:rotate-12 transition-transform" /> 
                         VISIT SUPPORT CENTER
                      </Button>
                      <div className="flex gap-2">
                        <a href={`tel:${initialUser.phone || "Not provided"}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            className="w-full rounded-2xl h-14 gap-2.5 font-bold border-muted-foreground/20 hover:bg-muted text-muted-foreground transition-all"
                          >
                            <Phone className="h-4 w-4" />
                            Direct Call
                          </Button>
                        </a>
                        <Button 
                          variant="outline" 
                          onClick={() => { window.dispatchEvent(new CustomEvent('open-chat-support')); onClose(); }}
                          className="flex-1 rounded-2xl h-14 gap-2.5 font-bold border-blue-500/20 hover:bg-blue-500/5 text-blue-500 transition-all"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Support Chat
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={onClose} 
                      className="w-full rounded-2xl bg-foreground text-background font-bold h-14 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-foreground/10"
                    >
                      Close Profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </Portal.Root>
      )}
    </AnimatePresence>
  );
}
