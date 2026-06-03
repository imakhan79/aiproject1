import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Brain, Zap, MessageCircle, Lightbulb, ArrowRight, FlaskConical, Clock, Target } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { FutureTwin, Simulation, DreamSummary, ChatMessage, Profile } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

function calcNeuroScore(profile: Profile | null | undefined, simCount: number, dreamsCount: number, chatCount: number, hasTwin: boolean): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.onboardingComplete) score += 200;
  score += Math.min(profile.currentSkills.length * 15, 150);
  score += Math.min(profile.interests.length * 10, 100);
  if (profile.careerGoals) score += 100;
  if (profile.personalityType) score += 50;
  if (hasTwin) score += 150;
  score += Math.min(simCount * 30, 90);
  score += Math.min(dreamsCount * 20, 80);
  score += Math.min(chatCount * 5, 80);
  return Math.min(score, 1000);
}

function NeuroScoreRing({ score }: { score: number }) {
  const pct = score / 1000;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const label = score >= 800 ? 'Exceptional' : score >= 600 ? 'Advanced' : score >= 400 ? 'Developing' : score >= 200 ? 'Beginner' : 'New';
  const color = score >= 800 ? '#22d3ee' : score >= 600 ? '#8b5cf6' : score >= 400 ? '#f59e0b' : '#94a3b8';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={110} height={110} className="-rotate-90">
        <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: -80 }}>
        <div className="text-2xl font-black text-white">{score}</div>
        <div className="text-xs text-slate-400">/1000</div>
      </div>
      <div className="text-xs font-medium mt-1" style={{ color }}>{label}</div>
    </div>
  );
}

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
  const neuroScore = calcNeuroScore(profile, simulations?.length ?? 0, dreams?.length ?? 0, chatHistory?.length ?? 0, !!twin);

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      {/* Welcome + NeuroScore */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Your human potential operating system</p>
        </div>
        <div className="glass rounded-2xl p-4 flex flex-col items-center relative flex-shrink-0">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">NeuroScore™</div>
          <div className="relative flex items-center justify-center">
            <NeuroScoreRing score={neuroScore} />
          </div>
        </div>
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

      {/* Innovation Labs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-white text-sm md:text-base">Innovation Labs</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30">NEW</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { to: '/invention-lab', icon: FlaskConical, label: 'AI Invention Lab™', desc: 'Turn any idea into a full startup plan', color: 'text-purple-glow', bg: 'from-purple/10' },
            { to: '/time-machine', icon: Clock, label: 'Time Machine™', desc: 'See which skills to learn before 2035', color: 'text-cyan', bg: 'from-cyan/10' },
            { to: '/skill-gap', icon: Target, label: 'Skill Gap Analyzer™', desc: 'Exact path to your dream role', color: 'text-green-400', bg: 'from-green-400/10' },
          ].map(({ to, icon: Icon, label, desc, color, bg }) => (
            <Link key={to} to={to}
              className={`glass rounded-2xl p-4 hover:bg-white/5 transition-all border border-white/10 hover:border-white/20 bg-gradient-to-br ${bg} to-transparent`}>
              <Icon size={22} className={`${color} mb-3`} />
              <div className="font-medium text-white text-sm">{label}</div>
              <div className="text-xs text-slate-400 mt-1">{desc}</div>
              <div className={`flex items-center gap-1 mt-3 text-xs ${color}`}>Explore <ArrowRight size={12} /></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
