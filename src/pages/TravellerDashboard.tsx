import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";
import Traveller from "./Traveller";

export default function TravellerDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;



  return (
    <div className="min-h-screen">
      <Traveller />
    </div>
  );
}
