import { useAuth } from "@/lib/authContext";
import { useLocation, Navigate } from "react-router-dom";
import Sender from "./Sender";

export default function UserDashboard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    console.log("UserDashboard: Auth Loading...");
    return <div className="flex items-center justify-center min-h-screen text-slate-400 font-bold uppercase tracking-widest bg-slate-50">Loading Dashboard...</div>;
  }
  
  if (!user) {
    console.warn("UserDashboard: No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }



  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full">
        <Sender startWithForm={location.state?.openForm} />
      </div>
    </div>
  );
}
