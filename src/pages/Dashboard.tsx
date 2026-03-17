import { useAuth } from "@/lib/authContext";
import { Navigate } from "react-router-dom";
import Sender from "./Sender";
import Traveller from "./Traveller";
import Receiver from "./Receiver";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "parcels",
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Realtime update in Dashboard:", payload);
          // This serves as a global listener for debugging or global sync
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
