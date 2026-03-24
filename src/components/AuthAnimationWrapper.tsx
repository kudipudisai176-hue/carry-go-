import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import ParticleCanvas from "./ParticleCanvas";
import { type UserRole } from "@/lib/authContext";

export default function AuthAnimationWrapper({ children, role }: { children: React.ReactNode; role?: string | null }) {
    // Check if this is the first visit — skip animation if not
    const isFirstVisit = !localStorage.getItem("carrygo_signup_visited");
    const [step, setStep] = useState(isFirstVisit ? 0 : 4);

    useEffect(() => {
        // Only run the intro animation sequence on first visit
        if (!isFirstVisit) return;

        // Mark as visited so future visits skip the animation
        localStorage.setItem("carrygo_signup_visited", "true");

        // Animation sequence (Delivery Boy Edition):
        // 0: Boy slides in from side (1.8s)
        // 1: Brake & Skid (0.6s)
        // 2: Steady & Look (0.6s)
        // 3: Throwing paper (0.8s)
        // 4: Show form (rest)

        const timers = [
            setTimeout(() => setStep(1), 1000),
            setTimeout(() => setStep(2), 1400),
            setTimeout(() => setStep(3), 1800),
            setTimeout(() => setStep(4), 2400),
        ];

        return () => timers.forEach(t => clearTimeout(t));
    }, []);

    return (
        <motion.div
            animate={{
                backgroundColor: role === 'traveller' ? "#f5f3ff" : "#ffffff"
            }}
            className="relative min-h-screen w-full overflow-hidden transition-colors duration-700"
        >
            <div className="absolute inset-0 z-0 text-white">
                {/* Modern Soft Gradients */}
                <motion.div
                    animate={{
                        background: role === 'traveller'
                            ? "radial-gradient(circle_at_20%_30%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)"
                            : "radial-gradient(circle_at_20%_30%, rgba(249, 115, 22, 0.05) 0%, transparent 50%)"
                    }}
                    className="absolute top-0 left-0 w-full h-full"
                />
                <motion.div
                    animate={{
                        background: role === 'traveller'
                            ? "radial-gradient(circle_at_80%_70%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)"
                            : "radial-gradient(circle_at_80%_70%, rgba(249, 115, 22, 0.08) 0%, transparent 50%)"
                    }}
                    className="absolute bottom-0 right-0 w-full h-full"
                />

                {/* Mesh Pattern */}
                <motion.div
                    animate={{
                        opacity: role ? 0.04 : 0.02,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${role === 'traveller' ? '7c3aed' : 'f97316'}' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6zM36 4V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                    className="absolute inset-0 transition-opacity duration-700"
                />


                {/* Floating Elements (Light Theme) */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`float-${i}`}
                            initial={{
                                x: Math.random() * 100 + "%",
                                y: Math.random() * 100 + "%",
                                opacity: Math.random() * 0.2 + 0.1,
                                scale: Math.random() * 0.5 + 0.5
                            }}
                            animate={{
                                y: ["-10px", "10px", "-10px"],
                                opacity: [0.1, 0.3, 0.1],
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className={`absolute w-2 h-2 rounded-full blur-[1px] ${role === 'traveller' ? 'bg-purple-200/50' : 'bg-orange-200/50'}`}
                        />
                    ))}
                </div>

                {/* Nebula Glows (Updated for Light Theme) */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: role ? 0.5 : 0.3,
                            backgroundColor: role === 'traveller' ? "#ddd6fe" : "#ffedd5"
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/4 -left-1/4 w-full h-full blur-[120px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            scale: [1.1, 1, 1.1],
                            opacity: role ? 0.4 : 0.2,
                            backgroundColor: role === 'traveller' ? "#ede9fe" : "#fff7ed"
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-1/4 -right-1/4 w-full h-full blur-[120px] rounded-full"
                    />
                </div>

                {/* Road Light Streaks */}
                <div className="absolute bottom-[10%] left-0 w-full h-1 pointer-events-none perspective-[1000px]">
                    <div className="absolute inset-0 flex flex-col gap-4">
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={`streak-${i}`}
                                initial={{ x: "-100%", opacity: 0 }}
                                animate={{
                                    x: "200%",
                                    opacity: [0, 0.8, 0.8, 0]
                                }}
                                transition={{
                                    duration: 3 + i,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.8
                                }}
                                className={`h-[1px] w-1/3 bg-gradient-to-r from-transparent via-${role === 'traveller' ? (i % 2 === 0 ? 'purple' : 'indigo') : (i % 2 === 0 ? 'orange' : 'purple')}-500 to-transparent shadow-[0_0_15px_${role === 'traveller' ? (i % 2 === 0 ? 'rgba(168,85,247,0.5)' : 'rgba(99,102,241,0.5)') : (i % 2 === 0 ? 'rgba(249,115,22,0.5)' : 'rgba(168,85,247,0.5)')}]`}
                                style={{
                                    transform: `translateY(${i * 10}px) rotateX(45deg) skewX(-20deg)`
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* High-performance Particle System */}
                <ParticleCanvas role={role} />

            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center p-4 pt-20">
                {/* The Bike Character */}
                {step < 4 && (
                    <motion.div
                        initial={{ x: "-120vw", opacity: 0 }}
                        animate={{
                            x: step === 0 ? "0" : "0",
                            opacity: 1,
                            transition: {
                                duration: step === 0 ? 1.8 : 0.4,
                                ease: step === 0 ? [0.23, 1, 0.32, 1] : "easeOut"
                            }
                        }}
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
                    >
                        {/* 3D Delivery Bike Image with Dynamic Motion */}
                        <motion.div
                            animate={step === 0 ? {
                                y: [0, -4, 0, -4, 0],
                                rotate: [0, 1, -1, 1, 0],
                            } : step === 1 ? {
                                x: [0, 10, 0],
                                rotate: [0, 5, 0],
                                y: [0, -2, 0]
                            } : {
                                y: 0,
                                rotate: 0,
                                x: 0
                            }}
                            transition={step === 0 ? {
                                duration: 0.4,
                                repeat: Infinity,
                                ease: "linear"
                            } : {
                                duration: 0.6,
                                ease: "easeOut"
                            }}
                            className="relative"
                        >
                            {/* Shadow */}
                            <motion.div
                                animate={step === 0 ? {
                                    scale: [1, 1.1, 1],
                                    opacity: [0.3, 0.4, 0.3]
                                } : { scale: 1, opacity: 0.3 }}
                                transition={{ duration: 0.4, repeat: Infinity }}
                                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 sm:w-48 h-4 sm:h-6 bg-black/20 blur-2xl rounded-full"
                            />

                            <img
                                src="/delivery-boy.png"
                                alt="Delivery Boy"
                                className="w-40 sm:w-56 h-auto drop-shadow-2xl relative z-10"
                            />

                            <AnimatePresence>
                                {step === 1 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0, y: 0 }}
                                        animate={{ scale: 1, opacity: 1, y: -20 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1.5 rounded-2xl shadow-xl text-[12px] font-black uppercase tracking-tighter italic"
                                    >
                                        Skrrrt!
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* The Thrown Paper (Form Materializer) */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: [-20, -100, -250], // Adjusted for mobile height
                                    x: [0, 40, -10],
                                    rotate: [0, 720, 1440],
                                }}
                                transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
                                className="absolute top-10 sm:top-20 flex items-center justify-center"
                            >
                                <div className="w-12 h-16 sm:w-16 sm:h-20 bg-white rounded shadow-2xl border-2 border-primary/20 flex flex-col p-2 gap-1 overflow-hidden">
                                    <div className="w-full h-1 bg-secondary/30 rounded" />
                                    <div className="w-[80%] h-1 bg-muted rounded" />
                                    <div className="w-full h-1 bg-muted rounded" />
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* The Form Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.1, y: 100, rotate: -20 }}
                    animate={{
                        opacity: step >= 4 ? 1 : 0,
                        scale: step >= 4 ? 1 : 0.1,
                        y: step >= 4 ? 0 : 100,
                        rotate: step >= 4 ? 0 : -20
                    }}
                    transition={{
                        type: "spring",
                        damping: 14,
                        stiffness: 100,
                        duration: 0.8
                    }}
                    className="w-full max-w-[95%] sm:max-w-md"
                >
                    {children}
                </motion.div>
            </div>

            <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-20" />

            {step === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-orange-600 font-black italic uppercase tracking-widest"
                >
                    📦 Delivery on the way!
                </motion.div>
            )}
        </motion.div>
    );
}
