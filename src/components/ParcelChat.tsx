import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { subscribeToMessages } from "@/lib/parcelStore";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  _id: string;
  sender: string | { _id?: string, id?: string, name?: string, profilePhoto?: string } | null;
  message: string;
  createdAt: string;
}

export default function ParcelChat({ deliveryId, currentUserId, showHeader = true, className = "", onClose }: { deliveryId: string, currentUserId: string, showHeader?: boolean, className?: string, onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/messages/${deliveryId}`);
      setMessages(data);
      if (!silent) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // 📡 Use Realtime subscriptions for instant updates (Point 11)
    const subscription = subscribeToMessages(deliveryId, (newMsg) => {
      setMessages(prev => {
        // Prevent duplicates
        if (prev.some(m => (m._id === newMsg.id || m._id === newMsg._id))) return prev;
        
        // Match the Message interface
        const formattedMsg = {
           _id: newMsg.id || newMsg._id,
           sender: newMsg.sender_id || newMsg.sender,
           message: newMsg.message,
           createdAt: newMsg.created_at || newMsg.createdAt
        };
        
        const updated = [...prev, formattedMsg as unknown as Message];
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        return updated;
      });
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [deliveryId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await api.post("/messages", {
        deliveryId,
        message: newMessage,
      });

      // Update UI immediately (the subscription will also catch it but this is snappier)
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message. Please check connection.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col h-[560px] bg-white rounded-t-[3rem] shadow-2xl overflow-hidden border-t border-slate-100 ${className}`}>
      {showHeader && (
        <div className="bg-gradient-to-r from-secondary to-orange-400 p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
               <MessageSquare className="h-5 w-5 text-white" />
             </div>
             <div>
               <h3 className="text-white font-black text-sm uppercase tracking-widest leading-none mb-1">Secure Inbox</h3>
               <p className="text-white/60 text-[9px] font-bold uppercase tracking-tighter">Real-time Encrypted Chat</p>
             </div>
          </div>
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-muted/5 custom-scrollbar">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="h-10 w-10 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="h-2 w-2 bg-orange-500 rounded-full animate-ping" />
              </div>
            </div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">Establishing Secure Channel...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
               <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">No messages yet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Start the conversation! Say hello to coordinate the pickup.</p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            {/* Support Bot Welcome (SIMULATION) */}
            <div className="flex justify-start">
               <div className="max-w-[85%] bg-slate-100 rounded-[1.25rem] rounded-tl-none p-4 text-xs font-bold text-slate-600 border border-slate-200/50 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1 text-orange-600">
                     <div className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse" />
                     <span className="text-[9px] uppercase tracking-widest">Support Bot</span>
                  </div>
                  👋 Welcome to the secure chat! Please use this to coordinate your delivery. 
                  Never share personal data like passwords or credit card details here.
               </div>
            </div>
            
            {messages.map((m) => {
              const senderId = (m.sender && typeof m.sender === 'object') ? (m.sender._id || m.sender.id) : m.sender;
              const isMe = senderId === currentUserId;
              return (
                <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm shadow-md transition-all ${
                      isMe
                        ? "bg-secondary text-white rounded-tr-none shadow-secondary/20"
                        : "bg-white text-foreground border border-border/50 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed font-medium">{m.message}</p>
                    <p className={`text-[9px] mt-1.5 font-black uppercase tracking-tighter opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border/40 p-5 bg-white flex gap-3 items-center">
        <Input
          placeholder="New message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          className="flex-1 rounded-[1.2rem] bg-muted/30 border-none h-14 px-6 text-sm font-medium focus-visible:ring-secondary/20 transition-all"
        />
        <Button size="icon" onClick={sendMessage} className="bg-secondary hover:bg-orange-600 h-14 w-14 rounded-[1.2rem] shrink-0 shadow-xl shadow-secondary/30 hover:scale-105 active:scale-95 transition-all">
          <Send className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}
