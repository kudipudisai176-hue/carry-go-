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
  sender: string;
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
           createdAt: newMsg.created_at || newMsg.createdAt || new Date().toISOString()
        };
        
        return [...prev, formattedMsg as Message];
      });
      
      // Auto-scroll on new message
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [deliveryId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const msgContent = newMessage;
    setNewMessage("");

    try {
      await api.post("/messages", {
        deliveryId,
        message: msgContent
      });
      fetchMessages(true);
    } catch (error) {
      toast.error("Failed to send message");
      setNewMessage(msgContent); // Restore on failure
    }
  };

  return (
    <div className={`flex flex-col overflow-hidden bg-white transition-all duration-300 ${className || 'h-[500px] rounded-[2rem] border border-border shadow-2xl'}`}>
      {showHeader && (
        <div className="flex items-center justify-between bg-secondary p-6 text-white shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-400 animate-ping opacity-75" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Conversation Channel</p>
              <h3 className="font-bold text-base leading-tight">Chat with Delivery Partner</h3>
            </div>
          </div>
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-muted/5 custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground gap-2 text-sm font-medium">
            <Loader2 className="h-5 w-5 animate-spin text-secondary" /> Initializing secure connection...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-3 text-center px-10">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
               <MessageSquare className="h-8 w-8 text-secondary opacity-40" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-secondary">No Messages Yet</p>
            <p className="text-[11px] font-medium leading-relaxed opacity-60">Start a conversation to coordinate delivery details with your partner.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === currentUserId;
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
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
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
