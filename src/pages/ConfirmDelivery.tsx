import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, RefreshCw, Smartphone, X, ArrowLeft, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getParcelById, updateParcelStatus, generateDeliveryOtp, type Parcel } from "@/lib/parcelStore";
import { useAuth } from "@/lib/authContext";
import BottomNav from "@/components/BottomNav";

export default function ConfirmDelivery() {
  const { user, isLoading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  console.log("ConfirmDelivery mounted. ID:", id);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [otp, setOtp] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
       loadParcel(id);
    }
  }, [id]);

  const loadParcel = async (parcelId: string) => {
    const data = await getParcelById(parcelId);
    if (data) setParcel(data);
  };

  const generateOtp = async (parcelId: string) => {
    try {
      const res = await generateDeliveryOtp(parcelId);
      if (res) {
        toast.info("A 4-digit OTP has been generated for authentication.");
        // OTP is normally sent to receiver phone, for demo we can see it
        console.log("New Delivery OTP:", res.otp);
      }
    } catch (err) {
      toast.error("Failed to generate OTP");
    }
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this browser.");
      }
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      toast.error(err.message || "Camera access denied");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        
        canvas.toBlob((blob) => {
           if (blob) {
              const file = new File([blob], `proof-${Date.now()}.jpg`, { type: "image/jpeg" });
              setImageFile(file);
           }
        }, "image/jpeg");
        
        stopCamera();
        toast.success("Photo captured!");
      }
    }
  };

  useEffect(() => {
    // 9. Security: Only traveller should be here
    if (!authLoading && user && user.role !== 'traveller') {
      toast.error("Unauthorized: Only travellers can confirm deliveries.");
      navigate("/dashboard");
    }
  }, [user, navigate, authLoading]);

  const handleVerify = async () => {
    // 🔐 Client-side validation for Length only. Logic is handled by Backend (Correct Architecture)
    if (otp.length !== 4) {
      toast.error("Please enter the 4-digit OTP provided by the receiver.");
      return;
    }
    if (!imageFile) {
      toast.error("Please capture a photo of the receiver as proof of delivery.");
      return;
    }

    setIsConfirming(true);
    try {
      if (!id) return;

      // 🛡️ [Unified Backend Flow] Secure verification & Payout Release (Point 15)
      await updateParcelStatus(id, "delivered", user?.name, otp, image || undefined);

      toast.success("✅ Delivery Confirmed! Payment is being released.", { duration: 5000 });
      setTimeout(() => navigate("/traveller"), 1500);

    } catch (err: any) {
      toast.error(err.message || "Verification failed. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!parcel) return (
    <div className="min-h-screen flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-secondary" />
          <p className="font-bold text-muted-foreground">Fetching parcel details...</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex items-center justify-center py-20 px-4">
      {/* 🔮 Ambient Background Effects (Light Mode) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] rounded-full bg-orange-600/5 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-orange-500/10 blur-[130px]" />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white hover:bg-slate-100 text-slate-600 shadow-sm border border-slate-200">
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20 shadow-sm">
              <Shield className="h-4 w-4 text-orange-600" />
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Secure Verification</span>
           </div>
        </div>

        <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold font-heading text-slate-900 tracking-tight">Delivery Confirm</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] px-4">Finalize handover with secure visual proof</p>
        </div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="rounded-[3rem] border border-white bg-white/80 backdrop-blur-xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] space-y-8"
        >
           {/* Recipient Card */}
           <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                 <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Smartphone className="h-8 w-8" />
                 </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-1.5">
                       <MapPin className="h-3 w-3" /> Receiver
                    </p>
                    <p className="font-bold text-2xl text-slate-900 font-heading leading-none">{parcel.receiver_name}</p>
                    <p className="text-sm text-orange-600 font-bold mt-2 inline-block px-3 py-1 bg-orange-500/10 rounded-xl">{parcel.receiver_phone}</p>
                 </div>
              </div>
           </div>

           {/* OTP Input Section */}
           <div className="space-y-4">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 text-center">Enter 4-Digit Verification OTP</p>
                <p className="text-[9px] text-orange-500 font-bold uppercase tracking-tight">Ask the receiver for this code</p>
              </div>
              <Input 
                 value={otp}
                 onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                 placeholder="0 0 0 0"
                 maxLength={4}
                 className="h-24 text-center text-4xl font-bold tracking-[0.5em] rounded-3xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all text-slate-900 font-mono shadow-inner"
              />
           </div>

           {/* Photo Capture Section */}
           <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 text-center">Visual Handover Proof</p>
              {image ? (
                <div className="relative h-64 w-full overflow-hidden rounded-[2.5rem] border-4 border-white shadow-xl group">
                   <img src={image} className="h-full w-full object-cover" />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                         onClick={() => { setImage(null); setImageFile(null); startCamera(); }} 
                         className="rounded-full bg-white text-slate-900 font-bold uppercase text-xs h-12 px-8 shadow-xl hover:bg-orange-500 hover:text-white transition-colors"
                      >
                         <RefreshCw className="h-4 w-4 mr-2" /> Retake
                      </Button>
                   </div>
                   <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Proof Ready
                   </div>
                </div>
              ) : isCameraOpen ? (
                <div className="relative h-72 w-full overflow-hidden rounded-[2.5rem] bg-slate-900 border-4 border-white shadow-2xl">
                   <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                   <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
                      <Button 
                         onClick={capturePhoto} 
                         className="h-20 w-20 rounded-full bg-white text-slate-900 hover:scale-110 active:scale-95 shadow-2xl border-4 border-slate-900/10 p-0 flex items-center justify-center transition-all"
                      >
                         <div className="h-16 w-16 rounded-full border-2 border-slate-900/5 flex items-center justify-center">
                            <Camera className="h-8 w-8 text-orange-500" />
                         </div>
                      </Button>
                      <Button 
                         onClick={stopCamera} 
                         variant="destructive" 
                         className="h-14 w-14 rounded-full p-0 shadow-2xl"
                      >
                         <X className="h-7 w-7" />
                      </Button>
                   </div>
                </div>
              ) : (
                <Button 
                   onClick={startCamera} 
                   variant="outline" 
                   className="w-full h-48 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50 flex-col gap-4 hover:bg-orange-500/5 hover:border-orange-500/40 transition-all group"
                >
                   <div className="h-16 w-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 shadow-sm">
                      <Camera className="h-9 w-9" />
                   </div>
                    <div className="text-center">
                       <p className="font-bold text-slate-900 text-lg tracking-tight">Open Handover Camera</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Proof is required for payout</p>
                    </div>
                </Button>
              )}
           </div>

           {/* Submit Button */}
           <div className="pt-2">
              <Button 
                 className="w-full h-20 rounded-[1.8rem] bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30"
                 onClick={handleVerify}
                 disabled={isConfirming || otp.length !== 4 || !image}
              >
                 {isConfirming ? (
                    <div className="flex items-center gap-4">
                       <RefreshCw className="h-7 w-7 animate-spin" />
                       <span className="tracking-widest">VERIFYING...</span>
                    </div>
                 ) : (
                    <div className="flex items-center gap-4">
                       <CheckCircle2 className="h-9 w-9" /> 
                       <span className="tracking-tight uppercase">Complete Delivery</span>
                    </div>
                 )}
              </Button>
              <div className="flex flex-col items-center gap-2 mt-8">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                   Verified Secure Handover Gateway
                </p>
                <div className="flex gap-1">
                  <div className="h-1 w-4 rounded-full bg-orange-500" />
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                  <div className="h-1 w-1 rounded-full bg-slate-200" />
                </div>
              </div>
           </div>
        </motion.div>
      </div>
      <BottomNav activeTab="sender" />
    </div>
  );
}
