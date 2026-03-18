import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, Truck, MapPin, Home, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserProfileModal from "./UserProfileModal";
import { UserData } from "@/lib/parcelStore";

const publicNavItems = [
  { path: "/", label: "Home", icon: Home },
];

const roleNavItems = {
  sender: [
    { path: "/dashboard", label: "Dashboard", icon: Package },
    { path: "/profile", label: "Profile", icon: User },
  ],
  traveller: [
    { path: "/dashboard", label: "Dashboard", icon: Truck },
    { path: "/profile", label: "Profile", icon: User },
  ],
  receiver: [
    { path: "/dashboard", label: "Dashboard", icon: MapPin },
    { path: "/profile", label: "Profile", icon: User },
  ],
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  // Convert auth user to UserData format for the modal
  const userData: UserData | null = user ? {
    id: user.id,
    name: user.name,
    rating: 5.0,
    totalTrips: 0,
    profilePhoto: (user as any).profilePhoto,
    bio: (user as any).bio
  } : null;

  const navItems = user
    ? [...publicNavItems, ...roleNavItems[user.role]]
    : publicNavItems;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-transform hover:scale-105 active:scale-95">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Carry<span className="text-secondary">Go</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
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
                    className="absolute inset-0 rounded-full bg-card shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full bg-secondary/10 hover:bg-secondary/20 px-3 py-1.5 transition-all text-secondary gap-2 border-none">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-sm">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:inline font-bold text-xs">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border/40 backdrop-blur-xl">
                <DropdownMenuLabel className="px-2 py-3">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-bold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                    <div className="mt-2 inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary self-start uppercase">
                      {user.role} Account
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem onClick={() => setShowProfile(true)} className="rounded-xl focus:bg-secondary focus:text-secondary-foreground cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary focus:text-secondary-foreground cursor-pointer py-2.5">
                  <Link to="/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl focus:bg-destructive focus:text-destructive-foreground cursor-pointer py-2.5 text-destructive font-medium">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Link to="/login">
                  <LogIn className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md">
                <Link to="/signup">
                  <UserPlus className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <UserProfileModal 
        user={userData} 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </nav>
  );
}
