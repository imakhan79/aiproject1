import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Brain, Zap, MessageCircle, Lightbulb, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/twin', icon: Brain, label: 'Future Twin' },
  { to: '/simulation', icon: Zap, label: 'Simulation' },
  { to: '/coach', icon: MessageCircle, label: 'AI Coach' },
  { to: '/dreams', icon: Lightbulb, label: 'Dreams' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col glass border-r border-white/10 z-50">
      <div className="p-6 border-b border-white/10">
        <span className="gradient-text text-xl font-bold tracking-tight">NeuroVerse AI</span>
        <p className="text-xs text-slate-500 mt-1">Human Potential OS</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple/20 text-purple-glow border border-purple/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
