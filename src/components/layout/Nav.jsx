import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Dumbbell, LayoutDashboard, Activity, Calendar, BookOpen, LogOut, Users, Trophy, Shield, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

// 8 items in bottom nav (mobile)
const bottomNavItems = [
  { to: "/",           icon: LayoutDashboard, label: "Home",     color: "text-blue-400",    activeBg: "bg-blue-500/15"   },
  { to: "/workout",    icon: Dumbbell,        label: "Séance",   color: "text-cyan-400",    activeBg: "bg-cyan-500/15"   },
  { to: "/planning",   icon: Calendar,        label: "Planning", color: "text-violet-400",  activeBg: "bg-violet-500/15" },
  { to: "/exercises",  icon: BookOpen,        label: "Encyclo",  color: "text-amber-400",   activeBg: "bg-amber-500/15"  },
  { to: "/analytics",  icon: Activity,        label: "Stats",    color: "text-emerald-400", activeBg: "bg-emerald-500/15"},
  { to: "/pr-tracker", icon: Trophy,          label: "Records",  color: "text-amber-400",   activeBg: "bg-amber-500/15"  },
  { to: "/community",  icon: MessageSquare,   label: "Social",   color: "text-purple-400",  activeBg: "bg-purple-500/15" },
  { to: "/profile",    icon: Users,           label: "Profil",   color: "text-orange-400",  activeBg: "bg-orange-500/15" },
];

// Desktop nav — 7 items max to avoid overflow
const navItems = [
  { to: "/",           icon: LayoutDashboard, label: "Home",     color: "text-blue-400",    activeBg: "bg-blue-500/15"    },
  { to: "/workout",    icon: Dumbbell,        label: "Séance",   color: "text-cyan-400",    activeBg: "bg-cyan-500/15"    },
  { to: "/analytics",  icon: Activity,        label: "Stats",    color: "text-emerald-400", activeBg: "bg-emerald-500/15" },
  { to: "/pr-tracker", icon: Trophy,          label: "Records",  color: "text-amber-400",   activeBg: "bg-amber-500/15"   },
  { to: "/community",  icon: MessageSquare,   label: "Social",   color: "text-purple-400",  activeBg: "bg-purple-500/15"  },
  { to: "/planning",   icon: Calendar,        label: "Planning", color: "text-violet-400",  activeBg: "bg-violet-500/15"  },
  { to: "/exercises",  icon: BookOpen,        label: "Encyclo",  color: "text-amber-400",   activeBg: "bg-amber-500/15"   },
  { to: "/profile",    icon: Users,           label: "Profil",   color: "text-orange-400",  activeBg: "bg-orange-500/15"  },
];

const useStreak = (history) => React.useMemo(() => {
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

export const Navbar = () => {
  const { profile, logout } = useAuth();
  const { history } = useApp();
  const navigate = useNavigate();
  const streak = useStreak(history);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const userName = profile?.email ? profile.email.split('@')[0] : "U";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 glass-dark border-b border-white/5 shadow-2xl">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5 flex justify-between items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/35 animate-neon-blue shrink-0">
            <Dumbbell size={15} className="text-white" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xs font-black text-white tracking-tight leading-none">
              IRON <span className="text-gradient">TRACKER</span>
            </h1>
            <p className="text-[8px] text-slate-600 uppercase tracking-widest">Sport Pro</p>
          </div>
        </div>

        {/* Desktop nav — icon-only on sm, icon+label on xl */}
        <nav className="hidden sm:flex items-center gap-0.5 glass rounded-2xl p-1 border border-white/10 flex-1 justify-center max-w-xl">
          {navItems.map(({ to, icon: Icon, label, color, activeBg }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-1 px-1.5 lg:px-2 xl:px-3 py-1.5 lg:py-2 rounded-xl text-[9px] lg:text-[10px] xl:text-[11px] font-bold transition-all duration-200 whitespace-nowrap ${
                  isActive ? `${activeBg} ${color}` : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={13} />
                  <span className="hidden xl:block">{label}</span>
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
        <div className="flex items-center gap-1.5 shrink-0">
          {streak > 0 && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400">
              <span className="animate-fire text-xs">🔥</span>
              <span className="text-xs font-black">{streak}</span>
            </motion.div>
          )}
          {/* Admin shield */}
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all border border-transparent hover:border-emerald-500/20">
              <Shield size={15} />
            </NavLink>
          )}
          {/* Avatar */}
          <div className="w-8 h-8 text-xs rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 border border-white/10 shadow-lg shadow-violet-500/25 flex items-center justify-center font-black text-white">
            {initials}
          </div>
          {/* Logout */}
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNav = () => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-dark border-t border-white/5 shadow-2xl">
      <div className="flex flex-nowrap items-center justify-between px-0.5 pt-1.5 pb-safe relative overflow-x-auto scrollbar-hide" style={{ paddingBottom: `calc(max(10px, env(safe-area-inset-bottom)) + 6px)` }}>
        {bottomNavItems.map(({ to, icon: Icon, label, color, activeBg }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-all duration-200 min-w-[32px] ${
                isActive ? color : "text-slate-600 hover:text-slate-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative flex items-center justify-center w-[34px] h-[34px]">
                  <Icon size={18} className={isActive ? `${color} drop-shadow-[0_0_6px_currentColor]` : ""} />
                  {isActive && (
                    <motion.div layoutId="bottom-indicator"
                      className={`absolute inset-0 ${activeBg} rounded-xl -z-10`}
                      transition={{ type: "spring", bounce: 0.25, duration: 0.35 }}
                    />
                  )}
                </div>
                <span className={`text-[6.5px] font-bold uppercase tracking-wider ${isActive ? color : ""}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
