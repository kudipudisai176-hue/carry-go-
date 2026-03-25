import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import ParticleCanvas from "./ParticleCanvas";
import { Package, ShieldCheck, Zap, Navigation2, CheckCircle2 } from "lucide-react";

export default function AuthAnimationWrapper({ 
  children, 
  role,
  fullWidth = false
}: { 
  children: React.ReactNode; 
  role?: string | null;
  fullWidth?: boolean;
}) {
    // Check if this is the first visit — skip animation if not
    const isFirstVisit = !localStorage.getItem("carrygo_signup_visited_v2");
    const [step, setStep] = useState(isFirstVisit ? 0 : 4);

    useEffect(() => {
        if (!isFirstVisit) return;
        localStorage.setItem("carrygo_signup_visited_v2", "true");

        // Premium Sequence:
        // 0: Parcel emerges from glow (1.2s)
        // 1: Route line maps out (0.8s)
        // 2: Verification Check (0.5s)
        // 3: Portal Unfolds (0.5s)
        // 4: Show form

        const timers = [
            setTimeout(() => setStep(1), 1200),
            setTimeout(() => setStep(2), 2000),
            setTimeout(() => setStep(3), 2500),
            setTimeout(() => setStep(4), 3000),
        ];

        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    return (
        <motion.div
            className="relative min-h-screen w-full overflow-hidden bg-white selection:bg-orange-100"
        >
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* 🟠 Ambient Orange Orbs (Premium Look) */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-orange-500/5 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -40, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] bg-orange-600/[0.03] blur-[140px] rounded-full"
                />

                {/* ⬛ Subtle Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(#000 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }} />

                {/* ✨ Particle Layer */}
                <ParticleCanvas role={role} />
            </div>

            <div className={`relative z-10 flex min-h-screen ${fullWidth ? 'items-stretch' : 'items-center justify-center p-4 pt-20'}`}>
                
                {/* 📦 THE PREMIUM INTRO ANIMATION */}
                <AnimatePresence>
                    {step < 4 && (
                        <motion.div
                            key="intro-sequence"
                            exit={{ opacity: 0, scale: 2, filter: "blur(20px)" }}
                            transition={{ duration: 0.8, ease: "circIn" }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-12"
                        >
                            <div className="relative">
                                {/* Expanding Glow Rings */}
                                <motion.div 
                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-full bg-orange-500/20 blur-2xl"
                                />
                                
                                {/* Central Parcel Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ 
                                        scale: step >= 0 ? 1 : 0, 
                                        rotate: step >= 1 ? 0 : -45,
                                        y: step >= 2 ? -20 : 0
                                    }}
                                    className="relative z-10 h-32 w-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center shadow-[0_20px_50px_rgba(249,115,22,0.3)] border-4 border-white"
                                >
                                    {step < 2 ? (
                                        <Package className="h-14 w-14 text-orange-500" />
                                    ) : (
                                        <ShieldCheck className="h-16 w-16 text-green-400" />
                                    )}
                                </motion.div>

                                {/* 🚀 Animated Route Line (Mapping Out) */}
                                {step >= 1 && (
                                    <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] overflow-visible pointer-events-none">
                                        <motion.circle
                                            cx="200" cy="200" r="160"
                                            fill="none"
                                            stroke="url(#orangeGradient)"
                                            strokeWidth="2"
                                            strokeDasharray="10 10"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1, rotate: 360 }}
                                            transition={{ pathLength: { duration: 2 }, rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
                                        />
                                        <defs>
                                            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
                                                <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
                                                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                )}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-2"
                            >
                                <h1 className="text-2xl font-black text-slate-900 tracking-widest uppercase italic">
                                    {step === 0 && "Initializing Parcel..."}
                                    {step === 1 && "Mapping Best Routes..."}
                                    {step === 2 && "Security Verified"}
                                    {step === 3 && "Accessing Portal..."}
                                </h1>
                                <div className="flex justify-center gap-1">
                                    {[0, 1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ 
                                                width: step === i ? 24 : 8,
                                                backgroundColor: step >= i ? "#f97316" : "#e2e8f0"
                                            }}
                                            className="h-1.5 rounded-full transition-all duration-300"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 🔓 THE FORM CONTENT (Appears as if Unboxed) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
                    animate={{
                        opacity: step >= 4 ? 1 : 0,
                        scale: step >= 4 ? 1 : 0.9,
                        y: step >= 4 ? 0 : 20,
                        filter: step >= 4 ? "blur(0px)" : "blur(10px)"
                    }}
                    transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 80,
                        duration: 0.6
                    }}
                    className={fullWidth ? "w-full h-full" : "w-full max-w-[95%] sm:max-w-md px-4"}
                    style={fullWidth ? { display: 'flex', minHeight: '100vh', width: '100%' } : {}}
                >
                    {children}
                </motion.div>
            </div>

            {/* Bottom Glow Strip */}
            <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-20" />
        </motion.div>
    );
}
