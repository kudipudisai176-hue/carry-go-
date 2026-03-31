import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Box, Navigation, MapPin, ArrowRight, Shield, Zap, Globe, Users, Star, User, UserPlus } from "lucide-react";
import { motion, useScroll, useTransform, type Variants, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import ParticleCanvas from "@/components/ParticleCanvas";
import BusTravelAnimation from "@/components/BusTravelAnimation";

const features = [
  { icon: Box, title: "Send Parcels", desc: "Create shipments in seconds and track them live.", link: "/dashboard" },
  { icon: Navigation, title: "Carry & Earn", desc: "Browse parcels on your route and earn by delivering.", link: "/dashboard" },
  { icon: MapPin, title: "Live Tracking", desc: "Track your parcel in real-time on an interactive map.", link: "/dashboard" },
];

const stats = [
  { icon: Shield, value: "100%", label: "Secure tracking" },
  { icon: Zap, value: "2min", label: "Avg. match time" },
  { icon: Globe, value: "50+", label: "Countries covered" },
  { icon: Users, value: "10K+", label: "Active users" },
];

const testimonials = [
  { name: "Adaeze O.", role: "Sender", text: "CarryGo made sending a package to my family so easy and affordable!", stars: 5 },
  { name: "James K.", role: "Traveller", text: "I earn extra income on every trip. The platform is super intuitive.", stars: 5 },
  { name: "Fatima B.", role: "Receiver", text: "I love the real-time tracking. I always know where my parcel is!", stars: 5 },
];

const steps = [
  { num: "01", icon: Box, title: "Create a Shipment", desc: "Enter your parcel details, select a destination, and set your price in seconds." },
  { num: "02", icon: MapPin, title: "Locate Travellers", desc: "Our smart algorithm matches you with a verified traveller heading to your destination." },
  { num: "03", icon: Navigation, title: "Handover & Earn", desc: "Hand over the parcel with a secure OTP and earn/save as the delivery completes." },
];

// Stagger container variant
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Index() {
  const { user } = useAuth();
  const [wordIndex, setWordIndex] = useState(0);
  const words = ["ship", "send", "carry", "earn", "deliver"];

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="pt-16">
      {/* ===================== HERO ===================== */}
      <section ref={heroRef} className="aurora-bg relative overflow-hidden" style={{ minHeight: "90vh" }}>
        {/* Particle layer */}
        <ParticleCanvas />

        {/* Radial glow overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_40%,hsl(245_80%_60%/0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(222_100%_60%/0.10),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_20%,hsl(28_100%_55%/0.06),transparent_40%)]" />

        {/* Orbit dots around logo */}
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
          <div className="orbit-container">
            <div className="orbit-dot" />
            <div className="orbit-dot" />
            <div className="orbit-dot" />
          </div>
        </div>

        {/* Bus travel animation at the bottom - moved here to pass behind buttons */}
        <BusTravelAnimation />

        {/* Hero content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl flex-col items-center justify-center px-4 text-center"
        >
          {/* Logo badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-8 logo-pulse"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary shadow-elevated animate-glow-pulse">
              <Box className="h-10 w-10 text-secondary-foreground" />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 px-4 py-1.5 text-sm font-medium text-secondary animate-badge-pulse"
          >
            <Zap className="h-3.5 w-3.5 animate-spin-slow" /> Peer-to-peer delivery platform
          </motion.span>

          {/* Heading with shimmer */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
            className="mb-6 font-heading text-5xl font-bold leading-tight tracking-tight text-primary-foreground md:text-7xl lg:text-8xl"
          >
            Send anything,
            <br />
            <span className="text-shimmer">anywhere.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/80 md:text-2xl font-medium tracking-tight"
          >
            The smartest way to{" "}
            <span className="relative inline-block h-[1.2em] overflow-hidden align-bottom">
              <AnimatePresence mode="wait">
                <motion.span
                  key={words[wordIndex]}
                  initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.23, 1, 0.32, 1] 
                  }}
                  className="inline-block font-bold text-secondary bg-clip-text"
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            anything,{" "}
            <span className="text-shimmer font-bold ml-1">
              anywhere in India.
            </span>
          </motion.p>


          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.5 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            {user ? (
              <div className="flex flex-col items-center gap-6">
                <Button asChild size="lg" className="btn-glow rounded-full bg-secondary px-8 text-secondary-foreground hover:bg-secondary/90 shadow-xl shadow-secondary/20 h-14 text-lg font-bold">
                  <Link to="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="lg" className="btn-glow rounded-full bg-[#000080] border border-white/20 px-8 text-white hover:bg-[#000080]/90">
                <Link to="/signup">
                  Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </motion.div>


        </motion.div>

      </section>

      {/* ===================== STATS ===================== */}
      <section className="border-b border-border bg-card py-14">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="stat-card flex flex-col items-center text-center rounded-xl p-4"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 transition-all duration-300 group-hover:bg-secondary">
                <s.icon className="h-6 w-6 text-secondary" />
              </div>
              <p className="glow-number font-heading text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===================== STEP BY STEP PROCESS (Redesigned) ===================== */}
      <section className="py-32 relative overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-orange-500 hidden md:block" />
        </div>

        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 text-center"
          >
            <span className="mb-4 inline-block rounded-full bg-orange-100 px-6 py-2 text-xs font-bold uppercase tracking-widest text-orange-600">
               Step-by-Step Process
            </span>
            <h2 className="mb-6 font-heading text-4xl font-bold text-slate-900 md:text-6xl tracking-tight">
               How CarryGo Works
            </h2>
            <p className="mx-auto max-w-xl text-slate-500 font-medium">
               A seamless, secure, and peer-to-peer delivery journey designed for the modern world.
            </p>
          </motion.div>

          <div className="grid gap-12 md:grid-cols-3 relative">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group relative flex flex-col items-center text-center px-6"
              >
                {/* Step Circle */}
                <div className="relative mb-10">
                   <div className="h-24 w-24 rounded-[2rem] bg-orange-50 border-2 border-orange-100 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-500 group-hover:rotate-12 group-hover:scale-110 shadow-xl shadow-orange-500/5 group-hover:shadow-orange-500/30">
                      <s.icon className="h-10 w-10 text-orange-500 group-hover:text-white transition-colors" />
                   </div>
                   <div className="absolute -top-4 -right-4 h-10 w-10 border-4 border-white rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-xl">
                      {s.num}
                   </div>
                </div>

                <h3 className="mb-4 font-heading text-2xl font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
                   {s.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                   {s.desc}
                </p>
                
                {/* Visual Connector Line (for desktop) */}
                {i < 2 && (
                   <div className="absolute top-12 left-[80%] w-[40%] h-[2px] border-t-2 border-dashed border-orange-100 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== JOIN SECTION (Add Signup) ===================== */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
         <div className="mx-auto max-w-6xl px-4 text-center">
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
               
               <div className="relative z-10 max-w-2xl mx-auto">
                  <h2 className="text-4xl font-bold text-slate-900 mb-6 font-heading tracking-tight">Join the CarryGo movement</h2>
                  <p className="text-slate-500 font-bold mb-10">Create your account today and start sending or carrying parcels within minutes. It's free to join!</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                     <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all hover:scale-105 uppercase tracking-widest text-xs">
                        <Link to="/signup">
                           <UserPlus className="h-5 w-5 mr-2" /> Sign Up Now
                        </Link>
                     </Button>
                     <Button asChild variant="outline" size="lg" className="h-16 px-10 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">
                        <Link to="/login">
                           Member Login
                        </Link>
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="bg-muted py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
              For Everyone
            </h2>
            <p className="text-muted-foreground">Whether you send, carry, or receive — we've got you covered</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-8 md:grid-cols-3"
          >
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Link
                  to={user ? "/dashboard" : f.link}
                  className="card-hover-glow group block rounded-2xl border border-border bg-card p-8 shadow-card"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 transition-colors group-hover:bg-secondary"
                  >
                    <f.icon className="h-7 w-7 text-secondary transition-colors group-hover:text-secondary-foreground" />
                  </motion.div>
                  <h3 className="mb-2 font-heading text-xl font-semibold text-foreground group-hover:text-secondary transition-colors duration-300">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-secondary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-8px] group-hover:translate-x-0">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
              Loved by Users
            </h2>
            <p className="text-muted-foreground">See what our community says</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-8 md:grid-cols-3"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="testimonial-card rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i + 0.05 * j, type: "spring" }}
                    >
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                    </motion.div>
                  ))}
                </div>
                <p className="mb-4 text-foreground italic">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-glow-pulse">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="aurora-bg py-24 relative overflow-hidden">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(28_100%_55%/0.12),transparent_60%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-3xl px-4 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary animate-glow-pulse"
          >
            <Box className="h-8 w-8 text-secondary-foreground" />
          </motion.div>
          <h2 className="mb-4 font-heading text-3xl font-bold text-primary-foreground md:text-5xl">
            Ready to <span className="text-shimmer">CarryGo?</span>
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/70">
            Join thousands of senders and travellers today. It's free to get started.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {user && (
              <Button asChild size="lg" className="btn-glow rounded-full bg-secondary px-8 text-secondary-foreground hover:bg-secondary/90">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </motion.div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Box className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold text-foreground">
                Carry<span className="text-secondary">Go</span>
              </span>
            </motion.div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {[{ to: "/", label: "Home" }, { to: "/login", label: "Login" }].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="hover:text-foreground transition-colors hover:text-secondary relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-secondary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 CarryGo. Community-powered delivery.
            </p>
          </div>
        </div>
      </footer>
      {user && <BottomNav activeTab="home" />}
    </div>
  );
}
