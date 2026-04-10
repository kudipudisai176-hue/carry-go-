import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, X } from "lucide-react";
import { api } from "@/lib/parcelStore";
import { toast } from "sonner";

interface Message {
  id: string;
  _id: string;
  sender_id: { _id?: string, name?: string, profile_photo?: string } | string;
  message: string;
  created_at: string;
}

import { socket } from "@/lib/socket";

export default function ParcelChat({ deliveryId, currentUserId, showHeader = true, className = "", onClose }: { deliveryId: string, currentUserId: string, showHeader?: boolean, className?: string, onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const { data } = await api.get(`/messages/${deliveryId}`);
      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    if (!deliveryId) return;
    
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));

    // Real-time via Sockets
    console.log("Joining chat room:", deliveryId);
    socket.emit("join_chat", deliveryId.toString());
    
    const handleNewMessage = (msg: any) => {
      // Check both deliveryId as string/ObjectId
      const msgDeliveryId = msg.delivery_id?.toString() || msg.deliveryId?.toString();
      if (msgDeliveryId === deliveryId.toString()) {
        setMessages(prev => {
          if (prev.some(m => (m._id || m.id) === (msg._id || msg.id))) return prev;
          return [...prev, msg];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [deliveryId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !deliveryId) return;

    const msgContent = newMessage;
    setNewMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const { data } = await api.post('/messages', {
        deliveryId: deliveryId.toString(),
        message: msgContent
      });
      
      setMessages(prev => {
         if (prev.some(m => (m._id || m.id) === (data._id || data.id))) return prev;
         return [...prev, data];
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error: any) {
      console.error("Send message error:", error);
      const errMsg = error.response?.data?.message || "Check your connection and try again.";
      toast.error(`Message failed: ${errMsg}`);
    }
  };

  return (
    <div className={`flex flex-col h-[560px] bg-white rounded-t-[3rem] shadow-2xl overflow-hidden border-t border-slate-100 ${className}`}>
      {showHeader && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
               <MessageSquare className="h-5 w-5 text-white" />
             </div>
             <div>
               <h3 className="text-white font-black text-sm uppercase tracking-widest leading-none mb-1">Secure Inbox</h3>
               <p className="text-white/60 text-[9px] font-bold uppercase tracking-tighter">Coordination</p>
             </div>
          </div>
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} className="rounded-full text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Connecting...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
               <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">No messages yet</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Start the conversation to coordinate pickup!</p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-4">
            {messages.map((m) => {
              // Handle various ID formats from backend (populated vs raw)
              let senderId = '';
              if (typeof m.sender_id === 'string') {
                senderId = m.sender_id;
              } else if (m.sender_id && typeof m.sender_id === 'object') {
                senderId = (m.sender_id as any).id || (m.sender_id as any)._id || '';
              }
              
              const isMe = senderId === currentUserId || (currentUserId && senderId.toString() === currentUserId.toString());
              
              return (
                <div key={m._id || m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm shadow-sm transition-all ${
                      isMe
                        ? "bg-orange-500 text-white rounded-tr-none shadow-orange-500/20"
                        : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                    }`}
                  >
                    <p className="leading-relaxed font-medium">{m.message}</p>
                    <p className={`text-[9px] mt-1.5 font-black uppercase tracking-tighter opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-5 bg-white flex gap-3 items-center">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          className="flex-1 rounded-2xl bg-slate-50 border-none h-14 px-6 text-sm font-medium focus-visible:ring-orange-500/20 transition-all"
        />
        <Button size="icon" onClick={sendMessage} className="bg-orange-500 hover:bg-orange-600 h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-orange-500/20 transition-all">
          <Send className="h-6 w-6 text-white" />
        </Button>
      </div>
    </div>
  );
}
