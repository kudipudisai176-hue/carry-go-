import { Home, Box, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface BottomNavProps {
  activeTab?: 'home' | 'sender' | 'traveller' | null;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-8 pt-4 px-6 max-w-4xl mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
      {/* Home Tab */}
      <button 
        onClick={() => navigate('/dashboard')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all duration-300",
          activeTab === 'home' ? "scale-110" : "opacity-60 hover:opacity-100"
        )}
      >
        <Home className={cn("h-6 w-6", activeTab === 'home' ? "text-orange-500" : "text-slate-400")} />
        <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", activeTab === 'home' ? "text-orange-500" : "text-slate-400")}>Home</span>
      </button>

      {/* Sender Tab (Old Trip) */}
      <button 
        onClick={() => navigate('/sender')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all duration-300",
          activeTab === 'sender' ? "scale-110" : "opacity-60 hover:opacity-100"
        )}
      >
        <Box className={cn("h-7 w-7", activeTab === 'sender' ? "text-orange-500" : "text-slate-400 font-bold")} />
        <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", activeTab === 'sender' ? "text-orange-500" : "text-slate-400")}>Sender</span>
      </button>

      {/* Traveller Tab (New) */}
      <button 
        onClick={() => navigate('/traveller')}
        className={cn(
          "flex flex-col items-center gap-1.5 transition-all duration-300",
          activeTab === 'traveller' ? "scale-110" : "opacity-60 hover:opacity-100"
        )}
      >
        <Navigation className={cn("h-6 w-6", activeTab === 'traveller' ? "text-orange-500" : "text-slate-400")} />
        <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", activeTab === 'traveller' ? "text-orange-500" : "text-slate-400")}>Traveller</span>
      </button>
    </nav>
  );
}
