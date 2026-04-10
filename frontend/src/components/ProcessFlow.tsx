import { motion } from "framer-motion";
import { User, Package, Truck, Lock, MapPin, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: User,
    color: "bg-indigo-500",
    glow: "shadow-indigo-500/40",
    title: "Login",
    desc: "Start sending or delivering parcels.",
  },
  {
    icon: Package,
    color: "bg-orange-500",
    glow: "shadow-orange-500/40",
    title: "Sender Creates",
    desc: "Enter details & payment.",
  },
  {
    icon: Truck,
    color: "bg-amber-500",
    glow: "shadow-amber-500/40",
    title: "Nearby Request",
    desc: "Travellers request your trip.",
  },
  {
    icon: Lock,
    color: "bg-emerald-500",
    glow: "shadow-emerald-500/40",
    title: "Accept & OTP",
    desc: "Approve & share secure code.",
  },
  {
    icon: MapPin,
    color: "bg-violet-500",
    glow: "shadow-violet-500/40",
    title: "Safe Transit",
    desc: "Carried to the destination city.",
  },
  {
    icon: CheckCircle2,
    color: "bg-green-500",
    glow: "shadow-green-500/40",
    title: "Handover",
    desc: "Verify OTP & confirm delivery.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export default function ProcessFlow() {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
      className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] w-full max-w-sm border border-white/10 shadow-2xl relative overflow-hidden group"
    >
      <div className="relative z-10">
        <div className="relative border-l border-white/10 ml-2 pl-6 space-y-6">
          {steps.map((step, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="relative group/item"
            >
              {/* Circle Indicator */}
              <div className={`absolute -left-[37px] top-0 w-8 h-8 ${step.color} rounded-xl flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 shadow-lg ${step.glow}`}>
                <step.icon className="h-4 w-4 text-white" />
              </div>

              {/* Box (Compact) */}
              <div className="hover:translate-x-1 transition-transform duration-300">
                <h3 className="text-white font-black text-[12px] uppercase tracking-wider mb-0.5">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-[10px] font-bold leading-tight">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
