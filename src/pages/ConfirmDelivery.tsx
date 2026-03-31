import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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
    if (!authLoading && user && user.role !== 'traveller') {
      toast.error("Unauthorized");
      navigate("/dashboard");
    }
  }, [user, navigate, authLoading]);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast.error("Enter the 4-digit code");
      return;
    }
    if (!image) {
      toast.error("Capture a photo for proof");
      return;
    }

    setIsConfirming(true);
    try {
      if (!id) return;
      await updateParcelStatus(id, "delivered", user?.name, otp, image);
      toast.success("Delivery Confirmed!");
      setTimeout(() => navigate("/traveller"), 1500);
    } catch (err: any) {
      toast.error("Verification failed");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!parcel) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-white"><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex items-center gap-2 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-200">
               <Shield className="h-4 w-4 text-orange-600" />
               <span className="text-[10px] font-bold text-orange-600 uppercase">Verification</span>
            </div>
        </div>

        <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Handover Proof</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Verify delivery and release payment</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-8">
           <div className="p-5 bg-slate-50 rounded-3xl flex items-center gap-4">
              <div className="h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20"><Smartphone /></div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Receiver</p>
                 <p className="font-black text-xl leading-none">{parcel.receiverName}</p>
                 <p className="text-xs font-bold text-orange-500 mt-1">{parcel.receiverPhone}</p>
              </div>
           </div>

           <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase text-center">Enter 4-Digit OTP</p>
              <Input 
                 value={otp}
                 onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                 placeholder="0 0 0 0"
                 className="h-20 text-center text-4xl font-bold rounded-3xl border-2 border-slate-100 bg-slate-50"
              />
           </div>

           <div className="space-y-4">
              {image ? (
                <div className="h-64 w-full rounded-3xl overflow-hidden relative group">
                   <img src={image} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => { setImage(null); startCamera(); }} size="sm" className="rounded-full bg-white text-black font-bold uppercase text-[10px]">RETAKE</Button>
                   </div>
                </div>
              ) : isCameraOpen ? (
                <div className="h-64 w-full rounded-3xl overflow-hidden relative bg-slate-900 border-4 border-white shadow-inner">
                   <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                   <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                      <Button onClick={capturePhoto} className="h-14 w-14 rounded-full bg-white text-orange-500 shadow-xl"><Camera /></Button>
                      <Button onClick={stopCamera} variant="destructive" className="h-14 w-14 rounded-full shadow-xl"><X /></Button>
                   </div>
                </div>
              ) : (
                <Button onClick={startCamera} variant="outline" className="w-full h-48 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex-col gap-3">
                    <Camera className="h-8 w-8 text-orange-500" />
                    <div className="text-center"><p className="font-bold">Open Camera</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Proof of handover required</p></div>
                </Button>
              )}
           </div>

           <Button className="w-full h-16 rounded-3xl bg-orange-500 font-black text-white shadow-lg shadow-orange-500/20" onClick={handleVerify} disabled={isConfirming || otp.length !== 4 || !image}>
              {isConfirming ? <RefreshCw className="animate-spin" /> : "COMPLETE DELIVERY"}
           </Button>
        </div>
      </div>
      <BottomNav activeTab="traveller" />
    </div>
  );
}
