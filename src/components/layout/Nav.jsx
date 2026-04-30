import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Activity, Scale, Calendar, BookOpen, Shield, LogOut, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/",          icon: LayoutDashboard, label: "Home",     color: "text-blue-400",    activeBg: "bg-blue-500/15"   },
  { to: "/workout",   icon: Dumbbell,        label: "Séance",   color: "text-cyan-400",    activeBg: "bg-cyan-500/15"   },
  { to: "/analytics", icon: Activity,        label: "Stats",    color: "text-emerald-400", activeBg: "bg-emerald-500/15"},
  { to: "/planning",  icon: Calendar,        label: "Planning", color: "text-violet-400",  activeBg: "bg-violet-500/15" },
  { to: "/community", icon: Users,           label: "Social",   color: "text-pink-400",    activeBg: "bg-pink-500/15"   },
  { to: "/exercises", icon: BookOpen,        label: "Encyclo",  color: "text-amber-400",   activeBg: "bg-amber-500/15"  },
  { to: "/profile",   icon: Scale,           label: "Profil",   color: "text-orange-400",  activeBg: "bg-orange-500/15" },
];

export const Navbar = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-40 glass-dark border-b border-white/5 shadow-2xl">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-neon-blue">
          <Dumbbell size={18} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-black text-white tracking-tight leading-none">
            IRON <span className="text-gradient">TRACKER</span>
          </h1>
          <p className="text-[9px] text-slate-600 uppercase tracking-widest">Sport Pro</p>
        </div>
      </div>

      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1 glass rounded-2xl p-1.5 border border-white/10">
        {navItems.map(({ to, icon: Icon, label, color, activeBg }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive ? `${activeBg} ${color} shadow-sm` : "text-slate-500 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={13} className={isActive ? color : ""} />
                {label}
                {isActive && (
                  <motion.div layoutId="nav-indicator"
                    className={`absolute inset-0 ${activeBg} rounded-xl -z-10`}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Auth / Admin actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {profile?.role === 'admin' && (
          <NavLink to="/admin" className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <Shield size={18} className="text-emerald-400" />
          </NavLink>
        )}
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  </header>
  );
};

export const BottomNav = () => (
  <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-white/5 shadow-2xl">
    <div className="flex justify-around items-center px-1 py-2 pb-safe">
      {navItems.map(({ to, icon: Icon, label, color, activeBg }) => (
        <NavLink key={to} to={to} end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 ${
              isActive ? color : "text-slate-600 hover:text-slate-300"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={19} className={isActive ? `${color} drop-shadow-[0_0_8px_currentColor]` : ""} />
                {isActive && (
                  <motion.div layoutId="bottom-indicator"
                    className={`absolute -inset-1.5 ${activeBg} rounded-xl -z-10`}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  />
                )}
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? color : ""}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);
