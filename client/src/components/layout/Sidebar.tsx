import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Brain, Zap, MessageCircle, Lightbulb,
  LogOut, X, Clock, Target, FlaskConical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/twin', icon: Brain, label: 'Future Twin' },
  { to: '/simulation', icon: Zap, label: 'Simulation' },
  { to: '/coach', icon: MessageCircle, label: 'AI Coach' },
  { to: '/dreams', icon: Lightbulb, label: 'Dreams' },
];

const innovationLinks = [
  { to: '/invention-lab', icon: FlaskConical, label: 'Invention Lab™', badge: 'NEW' },
  { to: '/time-machine', icon: Clock, label: 'Time Machine™', badge: 'NEW' },
  { to: '/skill-gap', icon: Target, label: 'Skill Gap™', badge: 'NEW' },
];

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed left-0 top-0 h-screen w-64 flex flex-col glass border-r border-white/10 z-50
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="gradient-text text-lg font-bold tracking-tight">NeuroVerse AI</span>
            <p className="text-xs text-slate-500 mt-0.5">Human Potential OS</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1"><X size={18} /></button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs text-slate-600 uppercase tracking-widest px-3 py-2">Core</p>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-purple/20 text-purple-glow border border-purple/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <Icon size={17} />{label}
            </NavLink>
          ))}

          <p className="text-xs text-slate-600 uppercase tracking-widest px-3 py-2 mt-2">Innovation</p>
          {innovationLinks.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-cyan/20 text-cyan-light border border-cyan/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }>
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30">{badge}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all w-full">
            <LogOut size={17} />Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
