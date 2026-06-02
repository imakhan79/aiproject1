import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Brain, Zap, MessageCircle, Lightbulb, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { FutureTwin, Simulation, DreamSummary, ChatMessage } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: twin, isLoading: twinLoading } = useQuery<FutureTwin>({
    queryKey: ['twin'],
    queryFn: async () => { const { data } = await api.get('/twin'); return data; },
    retry: false,
  });

  const { data: simulations, isLoading: simLoading } = useQuery<Simulation[]>({
    queryKey: ['simulations'],
    queryFn: async () => { const { data } = await api.get('/simulation'); return data; },
  });

  const { data: dreams, isLoading: dreamsLoading } = useQuery<DreamSummary[]>({
    queryKey: ['dreams'],
    queryFn: async () => { const { data } = await api.get('/dreams'); return data; },
  });

  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ['coach-history'],
    queryFn: async () => { const { data } = await api.get('/coach/history'); return data; },
  });

  const profile = user?.profile;
  const firstName = profile?.firstName ?? user?.email?.split('@')[0] ?? 'there';
  const anyLoading = twinLoading || simLoading || dreamsLoading;

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">Your human potential operating system</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {anyLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          [
            { label: 'Skills', value: profile?.currentSkills?.length ?? 0, icon: Brain, color: 'text-purple-glow' },
            { label: 'Simulations', value: simulations?.length ?? 0, icon: Zap, color: 'text-cyan' },
            { label: 'Conversations', value: chatHistory?.length ?? 0, icon: MessageCircle, color: 'text-green-400' },
            { label: 'Dreams', value: dreams?.length ?? 0, icon: Lightbulb, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-2xl p-4 md:p-5">
              <Icon size={20} className={`${color} mb-2 md:mb-3`} />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs md:text-sm text-slate-400">{label}</div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Twin Preview */}
        <div className="glass rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm md:text-base">
              <Brain size={18} className="text-purple-glow" /> Future Twin
            </h2>
            <Link to="/twin" className="text-xs text-purple-glow hover:text-purple-light flex items-center gap-1">
              View <ArrowRight size={12} />
            </Link>
          </div>
          {twinLoading ? (
            <Skeleton className="h-44" />
          ) : twin ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={twin.knowledgeDNA.domains.map((d) => ({ subject: d.name, score: d.score }))}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-3 line-clamp-2 italic">"{twin.summaryNarrative}"</p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <p className="text-slate-500 text-sm">Twin not generated yet</p>
              <Link to="/twin" className="px-4 py-2 bg-purple/20 border border-purple/30 text-purple-glow rounded-xl text-sm hover:bg-purple/30 transition-colors">
                Generate Twin
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white text-sm md:text-base">Quick Actions</h2>
          {[
            { to: '/simulation', icon: Zap, label: 'Run a Simulation', desc: 'Compare career paths', color: 'text-cyan' },
            { to: '/coach', icon: MessageCircle, label: 'Talk to Your Coach', desc: 'Get strategic advice', color: 'text-green-400' },
            { to: '/dreams', icon: Lightbulb, label: 'Capture a Dream', desc: 'Turn ideas into plans', color: 'text-amber-400' },
          ].map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to}
              className="glass glass-hover rounded-2xl p-4 flex items-center gap-4 hover:border-purple/30 transition-all">
              <Icon size={20} className={`${color} flex-shrink-0`} />
              <div className="min-w-0">
                <div className="font-medium text-white text-sm">{label}</div>
                <div className="text-xs text-slate-400">{desc}</div>
              </div>
              <ArrowRight size={16} className="ml-auto text-slate-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {((dreams?.length ?? 0) > 0 || (simulations?.length ?? 0) > 0) && (
        <div>
          <h2 className="font-semibold text-white mb-3 text-sm md:text-base">Recent Activity</h2>
          <div className="space-y-2">
            {dreams?.slice(0, 2).map((d) => (
              <Link key={d.id} to="/dreams" className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                <Lightbulb size={16} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm text-slate-300 truncate">{d.title}</span>
              </Link>
            ))}
            {simulations?.slice(0, 2).map((s) => (
              <Link key={s.id} to="/simulation" className="glass rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                <Zap size={16} className="text-cyan flex-shrink-0" />
                <span className="text-sm text-slate-300 truncate">Simulated: {s.skillPaths.join(' vs ')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
