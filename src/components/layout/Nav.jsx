import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Activity, Scale, Calendar, BookOpen, Shield, LogOut, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/",          icon: LayoutDashboard, label: "Home" },
  { to: "/workout",   icon: Dumbbell,        label: "Séance" },
  { to: "/planning",  icon: Calendar,        label: "Planning" },
  { to: "/community", icon: Users,           label: "Social" },
  { to: "/exercises", icon: BookOpen,        label: "Encyclo" },
  { to: "/profile",   icon: Scale,           label: "Profil" },
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
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={13} />
                {label}
                {isActive && (
                  <motion.div layoutId="nav-indicator"
                    className="absolute inset-0 bg-blue-600 rounded-xl -z-10"
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
    <div className="flex justify-around items-center px-2 py-2 pb-safe">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              isActive ? "text-blue-400" : "text-slate-600 hover:text-slate-300"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(59,130,246,.7)]" : ""} />
                {isActive && (
                  <motion.div layoutId="bottom-indicator"
                    className="absolute -inset-1.5 bg-blue-500/15 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.4 }}
                  />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);
