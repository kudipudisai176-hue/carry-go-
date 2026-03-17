import { Link, useLocation } from "react-router-dom";
import { Package, Truck, MapPin, Home, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";

const publicNavItems = [
  { path: "/", label: "Home", icon: Home },
];

const roleNavItems = {
  sender: [
    { path: "/dashboard", label: "Dashboard", icon: Package },
  ],
  traveller: [
    { path: "/dashboard", label: "Dashboard", icon: Truck },
  ],
  receiver: [
    { path: "/dashboard", label: "Dashboard", icon: MapPin },
  ],
};

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = user
    ? [...publicNavItems, ...roleNavItems[user.role]]
    : publicNavItems;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Carry<span className="text-secondary">Go</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-4 py-2 text-sm font-medium transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-card shadow-card"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-medium text-secondary sm:flex">
                <User className="h-3 w-3" />
                {user.name} · {user.role}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link to="/login">
                  <LogIn className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Link to="/signup">
                  <UserPlus className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
