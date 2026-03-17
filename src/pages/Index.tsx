import { Link } from "react-router-dom";
import { Package, Truck, MapPin, ArrowRight, Shield, Zap, Globe, Users, Star } from "lucide-react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import ParticleCanvas from "@/components/ParticleCanvas";
import BusTravelAnimation from "@/components/BusTravelAnimation";

const features = [
  { icon: Package, title: "Send Parcels", desc: "Create shipments in seconds and track them live.", link: "/dashboard" },
  { icon: Truck, title: "Carry & Earn", desc: "Browse parcels on your route and earn by delivering.", link: "/dashboard" },
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
  { num: "01", title: "Create a Shipment", desc: "Enter parcel details and destination." },
  { num: "02", title: "Get Matched", desc: "A traveller heading your way picks it up." },
  { num: "03", title: "Track & Receive", desc: "Follow your parcel live until delivery." },
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
              <Package className="h-10 w-10 text-secondary-foreground" />
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
            className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/75 md:text-xl"
          >
            {"The smartest way to ship anything,".split(" ").map((word, i) => (
              <motion.span
                key={i}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [10, 0, 0, -10],
                  filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(10px)"]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  delay: i * 0.1,
                  times: [0, 0.2, 0.8, 1]
                }}
                className="inline-block mr-1.5"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              animate={{
                opacity: [0, 1, 1, 0],
                backgroundPosition: ["-200% 0", "0% 0", "200% 0", "400% 0"]
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                delay: 1.2,
                times: [0, 0.3, 0.7, 1]
              }}
              className="inline-block bg-gradient-to-r from-secondary via-white to-secondary bg-[length:200%_auto] bg-clip-text font-bold text-transparent ml-1"
            >
              anywhere in India.
            </motion.span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.5 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            {user ? (
              <Button asChild size="lg" className="btn-glow rounded-full bg-secondary px-8 text-secondary-foreground hover:bg-secondary/90">
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
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

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle bg glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,hsl(28_100%_55%/0.05),transparent_60%)] pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-3 inline-block rounded-full bg-secondary/10 px-4 py-1 text-sm font-medium text-secondary">
              Simple & Fast
            </span>
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
              How CarryGo Works
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Three simple steps to send or carry a parcel anywhere in the world
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="step-card rounded-2xl border border-border bg-card p-8 shadow-card"
              >
                <motion.span
                  whileHover={{ scale: 1.15, color: "hsl(28 100% 55%)" }}
                  className="font-heading text-5xl font-bold text-secondary/20 inline-block transition-colors duration-300"
                >
                  {s.num}
                </motion.span>
                <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
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
            <Package className="h-8 w-8 text-secondary-foreground" />
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
                <Package className="h-4 w-4 text-primary-foreground" />
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
    </div>
  );
}
