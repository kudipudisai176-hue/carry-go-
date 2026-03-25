import { Package, Truck, MapPin, User, ChevronRight, Star, ShieldCheck, Clock } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/authContext";
import WorkFlowAnimation from "@/components/WorkFlowAnimation";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="font-bold text-slate-500">Initializing your CarryGo...</p>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  const actions = [
    {
      title: "Send Parcel",
      desc: "Fastest peer-to-peer delivery for your items",
      icon: Package,
      path: "/sender",
      color: "from-[#f97316] via-[#ea580c] to-[#c2410c]", // Deep vibrant orange
      shadow: "shadow-orange-500/25",
      borderClass: "border-orange-500/20 hover:border-orange-500/50",
      badge: "Fastest"
    },
    {
      title: "Earn as Traveller",
      desc: "Monetize your journey and cover travel costs",
      icon: Truck,
      path: "/traveller",
      color: "from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]", // Rich purple
      shadow: "shadow-purple-500/25",
      borderClass: "border-purple-500/20 hover:border-purple-500/50",
      badge: "Income"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-24 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Welcome Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-orange-600 mb-4"
              >
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                DASHBOARD ACTIVE
              </motion.div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">
                Welcome, <span className="text-orange-500">{user.name.split(' ')[0]}!</span>
              </h1>
              <p className="mt-3 text-lg font-medium text-slate-500 max-w-lg">
                Your unified logistics hub. Choose what you want to do today.
              </p>
           </div>
           
           <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                   <p className="font-black text-slate-900 leading-none">Verified Member</p>
                   <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span className="text-xs font-bold">4.9</span>
                   </div>
                   <span className="h-1 w-1 rounded-full bg-slate-200" />
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Gold Tier</p>
                </div>
              </div>
           </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {actions.map((act, i) => (
            <motion.div
              key={act.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={act.path}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-white p-8 border-2 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${act.borderClass} ${act.shadow}`}
              >
                {/* Visual Flair */}
                <div className={`absolute -right-4 -top-4 h-32 w-32 rounded-full bg-gradient-to-br ${act.color} opacity-[0.03] transition-transform duration-500 group-hover:scale-150`} />
                
                <div className="relative">
                  <div className="flex items-start justify-between">
                     <div className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${act.color} text-white shadow-xl group-hover:rotate-6 transition-transform`}>
                        <act.icon className="h-8 w-8" />
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${act.color} text-white opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {act.badge}
                     </span>
                  </div>
                  
                  <div className="mt-8">
                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">{act.title}</h3>
                     <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-wide">
                        {act.desc}
                     </p>
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-slate-50 pt-6">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                           <User className="h-4 w-4 text-slate-300" />
                        </div>
                      ))}
                      <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                         +2k
                      </div>
                   </div>
                   <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg border-2 border-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300`}>
                      <ChevronRight className="h-6 w-6" />
                   </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Animated Feature Showcase */}
        <WorkFlowAnimation />

      </div>
    </div>
  );
}
