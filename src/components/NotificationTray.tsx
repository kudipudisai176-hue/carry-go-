import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Trash2, Clock, Info, MessageSquare, Truck, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  referenceId?: string;
}

export default function NotificationTray() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'chat_message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'parcel_requested': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'parcel_accepted': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'transit_started': return <Truck className="h-4 w-4 text-indigo-500" />;
      case 'delivered': return <Check className="h-4 w-4 text-emerald-500" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors active:scale-90"
      >
        <Bell className={`h-6 w-6 ${unreadCount > 0 ? "text-indigo-600" : "text-muted-foreground"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[140]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-80 max-h-[450px] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl z-[999] flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                <h3 className="font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-600 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((n) => (
                      <div 
                        key={n._id} 
                        className={`p-4 flex gap-3 transition-colors hover:bg-muted/30 cursor-pointer ${!n.read ? "bg-indigo-50/30" : ""}`}
                        onClick={() => markRead(n._id)}
                      >
                        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-indigo-100" : "bg-muted"}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!n.read ? "font-bold text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-tighter">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shadow-sm shadow-indigo-200" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t bg-muted/10 text-center">
                 <p className="text-[10px] text-muted-foreground">Showing last 20 internal updates</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
