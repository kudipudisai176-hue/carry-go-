import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/authContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import Receiver from "./pages/Receiver";
import TravellerDashboard from "./pages/TravellerDashboard";
import CreateParcel from "./pages/CreateParcel";
import Sender from "./pages/Sender";
import Traveller from "./pages/Traveller";
import Profile from "./pages/Profile";
<<<<<<< HEAD
import { ProtectedRoute } from "./components/ProtectedRoute";
=======
import Support from "./pages/Support";
import ConfirmDelivery from "./pages/ConfirmDelivery";
>>>>>>> sender
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppInner() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
<<<<<<< HEAD
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sender" 
          element={
            <ProtectedRoute allowedRole="sender">
              <Sender />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/receiver" 
          element={
            <ProtectedRoute allowedRole="receiver">
              <Receiver />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/traveller" 
          element={
            <ProtectedRoute allowedRole="traveller">
              <Traveller />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
=======
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/sender" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/receiver" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/traveller/dashboard" element={<ProtectedRoute><TravellerDashboard /></ProtectedRoute>} />
        
        <Route path="/create-parcel" element={<ProtectedRoute><CreateParcel /></ProtectedRoute>} />
        <Route path="/confirm-delivery/:id" element={<ProtectedRoute><ConfirmDelivery /></ProtectedRoute>} />
        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/support" element={<Support />} />
>>>>>>> sender
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner richColors position="bottom-right" expand={true} />
      <BrowserRouter>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
