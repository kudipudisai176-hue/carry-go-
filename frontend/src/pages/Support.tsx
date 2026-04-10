import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Headphones, Phone, Mail, MessageSquare, 
  HelpCircle, ShieldCheck, CreditCard, Truck, LayoutDashboard,
  Search, Send, CheckCircle2, LifeBuoy, ChevronRight, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const supportCategories = [
  { id: 'orders', name: 'Order & Delivery', icon: Truck, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'payments', name: 'Payments & Wallet', icon: CreditCard, color: 'bg-green-500/10 text-green-600' },
  { id: 'account', name: 'Account & Safety', icon: ShieldCheck, color: 'bg-amber-500/10 text-amber-600' },
  { id: 'app', name: 'App Guide', icon: LayoutDashboard, color: 'bg-purple-500/10 text-purple-600' },
];

const faqs = [
  { 
    cat: 'orders',
    q: "How do I track my parcel?", 
    a: "Once a traveller is assigned, you can view the real-time location and status on your 'Sender' dashboard tracking card." 
  },
  { 
    cat: 'payments',
    q: "When do I get paid for a delivery?", 
    a: "Payouts are released to your CarryGo wallet instantly after the receiver verifies the 4-digit delivery OTP and proof photo." 
  },
  { 
    cat: 'account',
    q: "How do I update my Aadhaar details?", 
    a: "You can update verification documents in the 'Profile' section. Note that changes may trigger a re-verification process." 
  },
];

export default function Support() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !msg) return toast.error("Please fill in all fields");
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Ticket submitted! Our team will respond within 24 hours.");
      setSubject("");
      setMsg("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 pt-20">
      {/* ── Header ── */}
      <div className="relative overflow-hidden bg-white px-6 pb-20 pt-16">
        <div className="absolute inset-0 z-0">
           <div className="absolute -top-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-secondary/5 blur-3xl opacity-60"></div>
           <div className="absolute -bottom-[20%] -left-[10%] h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-3xl opacity-40"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-xl shadow-secondary/20 mb-6"
          >
            <Headphones className="h-6 w-6" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight text-foreground sm:text-5xl"
          >
            How can we <span className="text-secondary">help you</span> today?
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Browse help topics or contact our support team directly. We're here 24/7 to ensure your deliveries are smooth.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 mx-auto max-w-lg relative"
          >
            <div className="group relative flex items-center bg-white rounded-3xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.1)] border border-border/50 p-2 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
              <Search className="ml-4 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for help..." 
                className="border-none bg-transparent shadow-none focus-visible:ring-0 text-lg h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="rounded-2xl bg-secondary hover:bg-secondary/90 text-white px-6 font-bold h-12">Search</Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 -mt-10 relative z-20">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* ── Left Content: Categories & FAQ ── */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Quick Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {supportCategories.map((c) => (
                 <motion.button
                   key={c.id}
                   whileHover={{ y: -4 }}
                   onClick={() => setSelectedCat(c.id)}
                   className={`flex flex-col items-center justify-center rounded-3xl p-5 transition-all border ${selectedCat === c.id ? 'bg-white border-secondary shadow-lg shadow-secondary/5' : 'bg-white border-border/40 hover:border-border shadow-sm'}`}
                 >
                   <div className={`h-12 w-12 rounded-2xl ${c.color} flex items-center justify-center mb-3`}>
                      <c.icon className="h-6 w-6" />
                   </div>
                   <span className="text-xs font-bold text-center">{c.name}</span>
                 </motion.button>
               ))}
            </div>

            {/* Support Options Card */}
            <div className="rounded-[3rem] bg-indigo-950 p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-secondary/20 to-transparent pointer-events-none"></div>
               <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                  <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-pulse">
                     <LifeBuoy className="h-10 w-10 text-secondary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                     <h2 className="text-2xl font-black text-white mb-2">Direct Company Support</h2>
                     <p className="text-white/60 text-sm leading-relaxed mb-6">Need urgent help? Our dedicated agents and automated support bots are ready to assist you right now.</p>
                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                        <a href="tel:+918123456789">
                           <Button className="rounded-2xl bg-white text-indigo-950 hover:bg-white/90 font-bold px-6 h-12 gap-2">
                              <Phone className="h-4 w-4" /> Call Agent
                           </Button>
                        </a>
                        <Button variant="outline" className="rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold px-6 h-12 gap-2">
                           <MessageSquare className="h-4 w-4" /> Live Chat
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            {/* FAQs */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-secondary" /> Frequently Asked Questions
              </h3>
              <div className="grid gap-3">
                 {faqs.filter(f => selectedCat === 'all' || f.cat === selectedCat).map((f, i) => (
                   <div key={i} className="group rounded-3xl bg-white p-6 border border-border/40 hover:border-secondary/30 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="font-bold text-foreground group-hover:text-secondary transition-colors">{f.q}</h4>
                         <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-secondary" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* ── Right Content: Ticket Form ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[3rem] bg-white p-8 shadow-xl border border-border/50">
              <h3 className="text-2xl font-black mb-1">Inquiry Form</h3>
              <p className="text-sm text-muted-foreground mb-8">Send us a direct message and we'll get back to you.</p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-1.5">
                    <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subject</label>
                    <Input 
                      placeholder="e.g. Payment issue" 
                      className="rounded-2xl border-border bg-muted/20 h-12 focus:ring-secondary/20"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Priority Message</label>
                    <Textarea 
                      placeholder="Explain the situation briefly..." 
                      className="rounded-2xl border-border bg-muted/20 min-h-[150px] focus:ring-secondary/20 resize-none"
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                    />
                 </div>
                 
                 <Button 
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-black h-16 shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                 >
                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Send className="h-5 w-5 fill-white" /> SUBMIT TICKET</>}
                 </Button>

                 <div className="mt-8 flex flex-col items-center gap-4 pt-8 border-t border-border/50">
                    <div className="flex items-center -space-x-3 mb-1">
                       {[1,2,3].map(i => <div key={i} className={`h-10 w-10 rounded-full bg-muted border-2 border-white flex items-center justify-center text-[10px] font-bold overflow-hidden`}><img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="Support" /></div>)}
                       <div className="h-10 w-10 rounded-full bg-secondary border-2 border-white flex items-center justify-center text-[9px] font-bold text-white uppercase tracking-tighter shadow-md">Support</div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">4.9/5 Average Agent Rating</p>
                 </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Link ── */}
      <div className="mt-20 text-center text-sm text-muted-foreground">
         <div className="flex items-center justify-center gap-6 mb-4">
            <a href="#" className="hover:text-secondary transition-colors font-semibold">Terms of Service</a>
            <a href="#" className="hover:text-secondary transition-colors font-semibold">Privacy Policy</a>
            <a href="#" className="hover:text-secondary transition-colors font-semibold">Legal</a>
         </div>
         <p>© 2026 CarryGo Logistics Technologies. All rights reserved.</p>
      </div>
    </div>
  );
}
