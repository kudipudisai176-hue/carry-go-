import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, RefreshCw, Smartphone, X, ArrowLeft, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getParcelById, updateParcelStatus, generateDeliveryOtp, type Parcel } from "@/lib/parcelStore";
import { useAuth } from "@/lib/authContext";

export default function ConfirmDelivery() {
  const { user, isLoading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  console.log("ConfirmDelivery mounted. ID:", id);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(50);
  const [isConfirming, setIsConfirming] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
       loadParcel(id);
       generateOtp(id);
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
        setTimer(50);
        toast.info("A 6-digit OTP has been generated for authentication.");
        // OTP is normally sent to receiver phone, for demo we can see it
        console.log("New Delivery OTP:", res.otp);
      }
    } catch (err) {
      toast.error("Failed to generate OTP");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

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
    if (timer === 0) {
      toast.error("OTP expired. Please resend.");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP provided by the receiver.");
      return;
    }
    if (!imageFile) {
      toast.error("Please capture a photo of the receiver as proof of delivery.");
      return;
    }

    setIsConfirming(true);
    try {
      if (!id) return;

      // 1. Get Location (Bonus Pro Feature)
      let locationStr = "Not available";
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
        });
        locationStr = `${pos.coords.latitude},${pos.coords.longitude}`;
      } catch (e) {
        console.warn("Location capture failed", e);
      }

      // 2. Upload photo to Supabase Storage
      const { supabase } = await import("@/lib/supabaseClient");
      const fileName = `delivery-proofs/${id}_${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(fileName, imageFile);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 3. Get Public URL
      const { data: urlData } = supabase.storage
        .from('delivery-proofs')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // 4. Update Parcel in Database (using user's column: delivery_proof)
      const { error: dbError } = await supabase
        .from('parcels')
        .update({
          status: 'delivered',
          delivery_proof: imageUrl,
          deliveredAt: new Date().toISOString(),
          delivery_location: locationStr
        })
        .eq('id', id);

      if (dbError) throw new Error(`Database update failed: ${dbError.message}`);

      // 5. Notify backend for internal business logic (e.g., releasing funds in escrow)
      try { await updateParcelStatus(id, "delivered", undefined, otp, undefined); } catch(e) {}

      toast.success("✅ Delivery Confirmed! Payment is being released.", { duration: 5000 });
      setTimeout(() => navigate("/traveller/dashboard"), 1500);

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
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20 px-4">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-white shadow-sm">
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex items-center gap-2 bg-secondary/10 px-4 py-1.5 rounded-full border border-secondary/20">
              <Shield className="h-4 w-4 text-secondary" />
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Secure Verification</span>
           </div>
        </div>

        <div className="space-y-2">
           <h1 className="text-3xl font-black font-heading text-foreground">Delivery Confirm</h1>
           <p className="text-muted-foreground text-sm">Collect the 6-digit OTP from the authorized person and capture a handover photo.</p>
        </div>

        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="rounded-[2.5rem] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-2xl shadow-secondary/5 space-y-8 border-t-4 border-t-secondary"
        >
           {/* Recipient Card */}
           <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10">
                 <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 text-white flex items-center justify-center shadow-lg shadow-secondary/20">
                    <Smartphone className="h-7 w-7" />
                 </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-0.5">
                       <MapPin className="h-3 w-3" /> Destination Receiver
                    </p>
                    <p className="font-black text-xl text-foreground font-heading leading-none">{parcel.receiverName}</p>
                    <p className="text-sm text-secondary font-bold mt-1 inline-block border-b-2 border-secondary/20">{parcel.receiverPhone}</p>
                 </div>
              </div>
           </div>

           {/* OTP Input Section */}
           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <p className="text-sm font-black uppercase tracking-widest text-foreground/70">Enter 6-Digit OTP</p>
                 {timer > 0 ? (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black text-red-500 border border-red-100 tabular-nums">
                       <RefreshCw className="h-3 w-3 animate-spin-slow" />
                       EXPIRES IN: {timer}s
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 border border-slate-200 tabular-nums uppercase">
                       OTP Expired
                    </div>
                 )}
              </div>
              <Input 
                 value={otp}
                 onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                 placeholder="0 0 0 0 0 0"
                 maxLength={6}
                 className="h-20 text-center text-4xl font-black tracking-[0.5em] rounded-3xl border-2 border-secondary/10 bg-muted/10 focus:bg-white focus:border-secondary transition-all shadow-inner font-mono"
                 disabled={timer === 0}
              />
           </div>

           {/* Photo Capture Section */}
           <div className="space-y-4">
              <p className="text-sm font-black uppercase tracking-widest text-foreground/70 px-1">Receiver Visual Proof</p>
              {image ? (
                <div className="relative h-56 w-full overflow-hidden rounded-3xl border-4 border-white shadow-xl group">
                   <img src={image} className="h-full w-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button 
                         onClick={() => { setImage(null); setImageFile(null); startCamera(); }} 
                         variant="secondary" 
                         className="rounded-full px-6 font-bold"
                      >
                         <RefreshCw className="h-4 w-4 mr-2" /> Retake Photo
                      </Button>
                   </div>
                   <div className="absolute top-4 right-4 bg-success text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                      Captured ✅
                   </div>
                </div>
              ) : isCameraOpen ? (
                <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-black border-4 border-white shadow-2xl">
                   <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                   <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4">
                      <Button 
                         onClick={capturePhoto} 
                         className="h-16 w-16 rounded-full bg-white text-black hover:scale-110 shadow-xl border-4 border-white/20 p-0"
                      >
                         <div className="h-12 w-12 rounded-full border-2 border-black/10 flex items-center justify-center">
                            <Camera className="h-7 w-7" />
                         </div>
                      </Button>
                      <Button 
                         onClick={stopCamera} 
                         variant="destructive" 
                         className="h-12 w-12 rounded-full p-0 shadow-xl"
                      >
                         <X className="h-6 w-6" />
                      </Button>
                   </div>
                </div>
              ) : (
                <Button 
                   onClick={startCamera} 
                   variant="outline" 
                   className="w-full h-40 rounded-[2rem] border-4 border-dashed border-secondary/20 bg-muted/10 flex-col gap-3 hover:bg-secondary/5 hover:border-secondary/40 transition-all group"
                >
                   <div className="h-14 w-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="h-8 w-8" />
                   </div>
                   <div className="text-center">
                      <p className="font-black text-foreground">Open Hand-over Camera</p>
                      <p className="text-xs text-muted-foreground font-medium">Verify delivery with a quick photo</p>
                   </div>
                </Button>
              )}
           </div>

           {/* Submit Button */}
           <div className="pt-4">
              <Button 
                 className="w-full h-20 rounded-[1.5rem] bg-gradient-to-r from-secondary to-secondary/90 text-white font-black text-xl shadow-2xl shadow-secondary/30 hover:shadow-secondary/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0"
                 onClick={handleVerify}
                 disabled={isConfirming || otp.length !== 6 || !image || timer === 0}
              >
                 {isConfirming ? (
                    <div className="flex items-center gap-3">
                       <RefreshCw className="h-7 w-7 animate-spin" />
                       PROCESSING...
                    </div>
                 ) : (
                    <div className="flex items-center gap-4">
                       <CheckCircle2 className="h-8 w-8" /> 
                       COMPLETE DELIVERY
                    </div>
                 )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-6 bg-muted/30 py-2 rounded-xl">
                 Secure Handover Powered by CarryGo Verification
              </p>
           </div>
        </motion.div>
      </div>
    </div>
  );
}
