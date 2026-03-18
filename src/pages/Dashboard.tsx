import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";
import Sender from "./Sender";
import Traveller from "./Traveller";
import Receiver from "./Receiver";
export default function Dashboard() {
  const { user, isLoading } = useAuth();


  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "sender":
      return <Sender />;
    case "traveller":
      return <Traveller />;
    case "receiver":
      return <Receiver />;
    default:
      return <Navigate to="/" replace />;
  }
}
