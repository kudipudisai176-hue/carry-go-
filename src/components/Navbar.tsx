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

const authNavItems = [
  ...publicNavItems,
  { path: "/dashboard", label: "Dashboard", icon: Package },
  { path: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  // Convert auth user to UserData format
  const userData: UserData | null = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePhoto: user.profilePhoto,
    bio: user.bio,
    rating: user.rating || 5.0,
    totalTrips: user.totalTrips || 0,
    aadharNumber: user.aadharNumber || user.idNumber,
    vehicleType: (user as any).vehicleType,
  } : null;

  const navItems = user ? authNavItems : publicNavItems;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 transition-transform hover:scale-105 active:scale-95">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">
            Carry<span className="text-orange-500">Go</span>
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
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
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
                <Button className="rounded-full bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 transition-all text-orange-600 gap-2 border-none">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm font-bold text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-bold text-xs">{user.name.split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border/40 backdrop-blur-xl">
                 <DropdownMenuLabel className="px-2 py-3">
                   <div className="flex flex-col space-y-0.5">
                     <p className="text-sm font-bold text-foreground">{user.name}</p>
                     <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                     <div className="mt-2 inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 self-start uppercase">
                       CarryGo Member
                     </div>
                   </div>
                 </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem onClick={() => setShowProfile(true)} className="rounded-xl focus:bg-orange-500 focus:text-white cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl focus:bg-orange-500 focus:text-white cursor-pointer py-2.5">
                  <Link to="/profile" className="flex items-center w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl focus:bg-destructive focus:text-white cursor-pointer py-2.5 text-destructive font-bold">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-orange-500 text-white hover:bg-orange-600">
                <Link to="/signup">SignUp</Link>
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
