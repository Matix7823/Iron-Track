import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Activity, Calendar, BookOpen, LogOut, Users, Trophy, Plus, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

// 5 items in bottom nav (grouped), FAB for workout
const bottomNavItems = [
  { to: "/",          icon: LayoutDashboard, label: "Home",     color: "text-blue-400",    activeBg: "bg-blue-500/15"   },
  { to: "/analytics", icon: Activity,        label: "Stats",    color: "text-emerald-400", activeBg: "bg-emerald-500/15"},
  // center slot = FAB
  { to: "/exercises", icon: BookOpen,        label: "Encyclo",  color: "text-amber-400",   activeBg: "bg-amber-500/15"  },
  { to: "/profile",   icon: Trophy,          label: "Profil",   color: "text-orange-400",  activeBg: "bg-orange-500/15" },
];

// Full nav for desktop
const navItems = [
  { to: "/",           icon: LayoutDashboard, label: "Home",      color: "text-blue-400",    activeBg: "bg-blue-500/15"    },
  { to: "/workout",    icon: Dumbbell,        label: "Séance",    color: "text-cyan-400",    activeBg: "bg-cyan-500/15"    },
  { to: "/analytics",  icon: Activity,        label: "Stats",     color: "text-emerald-400", activeBg: "bg-emerald-500/15" },
  { to: "/pr-tracker", icon: Trophy,          label: "Records",   color: "text-amber-400",   activeBg: "bg-amber-500/15"   },
  { to: "/planning",   icon: Calendar,        label: "Planning",  color: "text-violet-400",  activeBg: "bg-violet-500/15"  },
  { to: "/community",  icon: Users,           label: "Social",    color: "text-pink-400",    activeBg: "bg-pink-500/15"    },
  { to: "/exercises",  icon: BookOpen,        label: "Encyclo",   color: "text-amber-400",   activeBg: "bg-amber-500/15"   },
  { to: "/profile",    icon: BarChart2,       label: "Profil",    color: "text-orange-400",  activeBg: "bg-orange-500/15"  },
];

export const Navbar = () => {
  const { profile, logout } = useAuth();
  const { history } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Compute streak for badge
  const streak = React.useMemo(() => {
    const dates = new Set();
    Object.values(history || {}).forEach(entries => {
      if (Array.isArray(entries)) entries.forEach(h => { if (h?.date) dates.add(h.date); });
    });
    const sorted = [...dates].map(d => {
      const [day, month, year] = d.split('/');
      return new Date(+year, +month - 1, +day);
    }).filter(d => d.getTime() > 0).sort((a, b) => b - a);
    if (!sorted.length) return 0;
    const msDay = 864e5;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (Math.floor((now - sorted[0]) / msDay) > 1) return 0;
    let s = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (Math.floor((sorted[i-1] - sorted[i]) / msDay) === 1) s++;
      else break;
    }
    return s;
  }, [history]);

  // Avatar initials
  const userName = profile?.email ? profile.email.split('@')[0] : "U";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass-dark border-b border-white/5 shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/35 animate-neon-blue shrink-0">
            <Dumbbell size={17} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-white tracking-tight leading-none">
              IRON <span className="text-gradient">TRACKER</span>
            </h1>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest">Sport Pro</p>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-0.5 glass rounded-2xl p-1.5 border border-white/10">
          {navItems.map(({ to, icon: Icon, label, color, activeBg }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all duration-200 ${
                  isActive ? `${activeBg} ${color}` : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={13} />
                  {label}
                  {isActive && (
                    <motion.div layoutId="nav-indicator"
                      className={`absolute inset-0 ${activeBg} rounded-xl -z-10`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400"
            >
              <span className="animate-fire text-sm">🔥</span>
              <span className="text-xs font-black">{streak}</span>
            </motion.div>
          )}
          {/* Avatar */}
          <div className="avatar w-9 h-9 text-sm rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 border border-white/10 shadow-lg shadow-violet-500/25">
            {initials}
          </div>
          {/* Logout */}
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNav = () => {
  const navigate = useNavigate();
  const { history } = useApp();

  const streak = React.useMemo(() => {
    const dates = new Set();
    Object.values(history || {}).forEach(entries => {
      if (Array.isArray(entries)) entries.forEach(h => { if (h?.date) dates.add(h.date); });
    });
    const sorted = [...dates].map(d => {
      const [day, month, year] = d.split('/');
      return new Date(+year, +month - 1, +day);
    }).filter(d => d.getTime() > 0).sort((a, b) => b - a);
    if (!sorted.length) return 0;
    const msDay = 864e5;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (Math.floor((now - sorted[0]) / msDay) > 1) return 0;
    let s = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (Math.floor((sorted[i-1] - sorted[i]) / msDay) === 1) s++;
      else break;
    }
    return s;
  }, [history]);

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-white/5 shadow-2xl">
      <div className="flex items-center justify-around px-2 py-2 pb-safe relative">
        {/* First 2 items */}
        {bottomNavItems.slice(0, 2).map(({ to, icon: Icon, label, color, activeBg }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive ? color : "text-slate-600 hover:text-slate-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} className={isActive ? `${color} drop-shadow-[0_0_8px_currentColor]` : ""} />
                  {isActive && (
                    <motion.div layoutId="bottom-indicator"
                      className={`absolute -inset-1.5 ${activeBg} rounded-xl -z-10`}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
                    />
                  )}
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? color : ""}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Center FAB */}
        <div className="flex flex-col items-center -mt-6 relative z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/workout')}
            className="fab fab-pulse mb-1"
            style={{ width: 58, height: 58 }}
          >
            <Dumbbell size={22} className="text-white drop-shadow-lg" />
          </motion.button>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-0.5 -mt-0.5"
            >
              <span className="text-[10px] animate-fire">🔥</span>
              <span className="text-[9px] font-black text-orange-400">{streak}</span>
            </motion.div>
          )}
        </div>

        {/* Last 2 items */}
        {bottomNavItems.slice(2).map(({ to, icon: Icon, label, color, activeBg }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive ? color : "text-slate-600 hover:text-slate-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={20} className={isActive ? `${color} drop-shadow-[0_0_8px_currentColor]` : ""} />
                  {isActive && (
                    <motion.div layoutId="bottom-indicator"
                      className={`absolute -inset-1.5 ${activeBg} rounded-xl -z-10`}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
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
};
