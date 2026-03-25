import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin, CheckCircle2, Navigation, Star, ShieldCheck } from "lucide-react";

export default function WorkFlowAnimation() {
  const [step, setStep] = useState(0);

  // Steps:
  // 0: Initial
  // 1: Parcel Created
  // 2: Boy 1 moves to Stop
  // 3: Bus comes to Stop
  // 4: Giving Parcel to Bus
  // 5: Bus moving to Dest
  // 6: Delivering to Boy 2
  // 7: Done

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const sequence = async () => {
      // Start sequence
      setStep(1);
      await new Promise(r => setTimeout(r, 2000));
      setStep(2);
      await new Promise(r => setTimeout(r, 2000));
      setStep(3);
      await new Promise(r => setTimeout(r, 2000));
      setStep(4);
      await new Promise(r => setTimeout(r, 2000));
      setStep(5);
      await new Promise(r => setTimeout(r, 4000));
      setStep(6);
      await new Promise(r => setTimeout(r, 2000));
      setStep(7);
      await new Promise(r => setTimeout(r, 3000));
      
      // Loop
      setStep(0);
    };

    if (step === 0) {
      sequence();
    }
  }, [step]);

  // Asset paths (from public/assets/images)
  const assets = {
    sender: "/assets/images/sender.png",
    receiver: "/assets/images/receiver.png",
    bus: "/assets/images/bus.png",
    parcel: "/assets/images/parcel.png"
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[320px] bg-[#0F172A] rounded-[3rem] border border-slate-800 overflow-hidden p-8 mt-12 shadow-2xl">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent opacity-60" />
      <div className="absolute bottom-20 left-10 right-10 h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
         <motion.div 
            className="h-full bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500" 
            animate={{ width: `${(step / 7) * 100}%` }}
            transition={{ duration: 0.8 }}
         />
      </div>

      {/* --- ACTORS --- */}

      {/* SENDER PART */}
      <div className="absolute bottom-20 left-[10%] flex flex-col items-center">
        <motion.div 
           animate={{ 
              scale: step >= 1 && step < 4 ? 1.1 : 1,
              opacity: step >= 4 ? 0.6 : 1
           }}
           className="relative"
        >
           <div className={`h-20 w-20 rounded-full border-4 transition-all duration-500 overflow-hidden bg-slate-100 shadow-xl ${step === 1 || step === 2 ? 'border-orange-500 shadow-orange-500/20' : 'border-white'}`}>
              <img src={assets.sender} alt="Sender" className="h-full w-full object-cover" />
           </div>
           
           {/* Parcel in Hand */}
           <AnimatePresence>
            {(step >= 1 && step < 4) && (
                <motion.div 
                    initial={{ scale: 0, x: 20 }}
                    animate={{ scale: 1, x: 40 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 h-10 w-10 z-10"
                >
                    <img src={assets.parcel} alt="Parcel" className="h-full w-full drop-shadow-lg" />
                </motion.div>
            )}
           </AnimatePresence>
        </motion.div>
        
        <div className="mt-6 text-center">
           <h4 className="text-[10px] font-black uppercase text-slate-200 tracking-widest">Rahul (Sender)</h4>
           <p className="text-[8px] font-bold text-slate-500 uppercase">Bengaluru</p>
        </div>
      </div>

      {/* BUS STOP MARKER */}
      <div className="absolute left-[38%] bottom-[120px] flex flex-col items-center opacity-40">
         <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center mb-2">
            <MapPin className="h-4 w-4 text-slate-500" />
         </div>
         <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Pick-up Hub</span>
      </div>

      {/* THE VEHICLE (BUS) */}
      <motion.div 
        className="absolute bottom-24 pointer-events-none"
        initial={{ left: "-20%", opacity: 0 }}
        animate={{ 
            left: step >= 3 ? (step >= 5 ? "110%" : "36%") : "-20%",
            opacity: step >= 3 ? 1 : 0
        }}
        transition={{ 
            left: { duration: step >= 5 ? 4 : 1.5, ease: "easeInOut" },
            opacity: { duration: 0.5 }
        }}
      >
        <div className="relative h-24 w-40 flex items-center justify-center">
            <img src={assets.bus} alt="Bus" className="h-full w-full object-contain filter drop-shadow-2xl" />
            
            {/* Handing over parcel animation */}
            {step === 4 && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute h-8 w-8"
                >
                    <img src={assets.parcel} alt="Parcel" className="h-full w-full" />
                </motion.div>
            )}

            {/* In Transit Glow */}
            {step === 5 && (
                <motion.div 
                    className="absolute inset-0 bg-orange-400/20 rounded-full blur-2xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            )}
        </div>
      </motion.div>

      {/* RECEIVER PART */}
      <div className="absolute bottom-20 right-[15%] flex flex-col items-center">
        <motion.div 
           animate={{ 
              scale: step >= 6 ? 1.1 : 1,
              opacity: step >= 6 ? 1 : 0.4
           }}
           className="relative"
        >
           <div className={`h-20 w-20 rounded-full border-4 transition-all duration-500 overflow-hidden bg-slate-100 shadow-xl ${step === 6 || step === 7 ? 'border-emerald-500 shadow-emerald-500/20' : 'border-white'}`}>
              <img src={assets.receiver} alt="Receiver" className="h-full w-full object-cover" />
           </div>
           
           {/* Success Badge */}
           <motion.div 
                className="absolute -right-2 -top-2 h-8 w-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: step >= 7 ? 1 : 0 }}
            >
                <CheckCircle2 className="h-5 w-5 text-white" />
           </motion.div>

           {/* Received Parcel */}
           <AnimatePresence>
            {step === 6 && (
                <motion.div 
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 h-10 w-10 z-10"
                >
                    <img src={assets.parcel} alt="Parcel" className="h-full w-full" />
                </motion.div>
            )}
           </AnimatePresence>
        </motion.div>
        
        <div className="mt-6 text-center">
           <h4 className="text-[10px] font-black uppercase text-slate-200 tracking-widest">Sneha (Receiver)</h4>
           <p className="text-[8px] font-bold text-slate-500 uppercase">Mysuru</p>
        </div>
      </div>

      {/* OVERLAY: STATUS INDICATOR */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-md px-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Logistics Journey</span>
          </div>
         <div className="relative h-14 w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-4 shadow-xl shadow-slate-900/10">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={step}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-center"
                >
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.15em] transition-all">
                        {step === 0 && "Waiting to Init..."}
                        {step === 1 && "Package Ready for Shipping"}
                        {step === 2 && "Heading to Pickup Station"}
                        {step === 3 && "Verified Driver Arrived"}
                        {step === 4 && "Handing over Parcel"}
                        {step === 5 && "In-Transit to Destination"}
                        {step === 6 && "Handing over to Receiver"}
                        {step === 7 && "Successfully Delivered!"}
                    </h3>
                </motion.div>
            </AnimatePresence>
         </div>
      </div>

      {/* REAL WORLD TOAST (MOCK) */}
      <AnimatePresence>
        {step === 7 && (
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-32 right-12 bg-white p-4 rounded-2xl border border-slate-100 shadow-xl flex items-center gap-4 z-50 max-w-xs"
            >
                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
                    <Star className="h-5 w-5 fill-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Job Finished</p>
                   <p className="text-[8px] font-medium text-slate-500 mt-1 uppercase tracking-tight">Traveller earned ₹450 immediately</p>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
