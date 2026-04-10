import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthProvider";
import { useAuth } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Sender from "./pages/Sender";
import Traveller from "./pages/Traveller";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import PaymentStatus from "./pages/PaymentStatus";
import ConfirmDelivery from "./pages/ConfirmDelivery";
import { socket, connectSocket, disconnectSocket } from "@/lib/socket";
import VoiceCall from "@/components/VoiceCall";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

function AppInner() {
  const { user, isLoading } = useAuth();
  const [activeCall, setActiveCall] = useState<{ userId: string; userName: string; isIncoming: boolean; signal?: any; deliveryId?: string } | null>(null);
  
  useEffect(() => {
    if (user?.id) {
      connectSocket(user.id);
      
      socket.on("incoming_call", (data) => {
        setActiveCall({
          userId: data.from,
          userName: data.name,
          isIncoming: true,
          signal: data.signal,
          deliveryId: data.deliveryId
        });
      });

      socket.on("new_message", (msg) => {
        if (msg.sender_id._id !== user.id) {
          toast.info(`New message from ${msg.sender_id.name}`, {
             description: msg.message.slice(0, 50) + "..."
          });
        }
      });

      // Listen for local trigger to start call
      const handleStartCall = (e: any) => {
        const { userId, userName, deliveryId } = e.detail;
        setActiveCall({
          userId,
          userName,
          isIncoming: false,
          deliveryId
        });
      };
      window.addEventListener('start-call', handleStartCall);

      return () => {
        socket.off("incoming_call");
        socket.off("new_message");
        window.removeEventListener('start-call', handleStartCall);
      };
    } else {
      disconnectSocket();
    }
  }, [user?.id]);

  useEffect(() => {
    console.log("App.tsx Auth State Update:", { user: user?.id, role: user?.role, isLoading });
  }, [user, isLoading]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/sender" element={<ProtectedRoute><Sender /></ProtectedRoute>} />
        <Route path="/traveller" element={<ProtectedRoute><Traveller /></ProtectedRoute>} />
        <Route path="/confirm-delivery/:id" element={<ProtectedRoute><ConfirmDelivery /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/support" element={<Support />} />
        <Route path="/payment/status" element={<PaymentStatus />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <AnimatePresence>
        {activeCall && user && (
          <VoiceCall 
            userId={activeCall.userId}
            userName={activeCall.userName}
            currentUserId={user.id}
            currentUserName={user.name}
            isIncoming={activeCall.isIncoming}
            incomingSignal={activeCall.signal}
            deliveryId={activeCall.deliveryId}
            onClose={() => setActiveCall(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner position="top-right" expand={true} richColors />
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
