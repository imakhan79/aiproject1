import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { Simulation, SimulationScenario } from '../types';
import { Zap, TrendingUp, Clock, Building2 } from 'lucide-react';
import { formatSalary } from '../lib/utils';
import { toast } from 'sonner';

const SKILL_PATHS = [
  'AI / Machine Learning', 'Full-Stack Web Development', 'Data Science & Analytics',
  'Product Management', 'UX/UI Design', 'Cybersecurity', 'Cloud Architecture',
  'Mobile Development', 'Blockchain', 'Digital Marketing', 'Entrepreneurship', 'Biotech / Health Tech',
];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

function ScenarioCard({ s }: { s: SimulationScenario }) {
  const probColor = s.probability >= 70 ? 'text-green-400' : s.probability >= 50 ? 'text-amber-400' : 'text-orange-400';

  return (
    <div className="glass rounded-2xl p-5 md:p-6 space-y-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-cyan uppercase tracking-wider mb-1 truncate">{s.pathName}</div>
          <h3 className="text-base md:text-lg font-semibold text-white">{s.jobTitle}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xl md:text-2xl font-bold ${probColor}`}>{s.probability}%</div>
          <div className="text-xs text-slate-500">probability</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="glass rounded-xl p-2.5 md:p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><TrendingUp size={11} /> Salary</div>
          <div className="text-xs md:text-sm font-medium text-white">{formatSalary(s.salaryRange.min, s.salaryRange.max)}</div>
        </div>
        <div className="glass rounded-xl p-2.5 md:p-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Clock size={11} /> Timeline</div>
          <div className="text-xs md:text-sm font-medium text-white">{s.timelineYears} years</div>
        </div>
      </div>

      <p className="text-slate-400 text-sm leading-relaxed flex-1">{s.narrative}</p>

      {s.topCompanies?.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2"><Building2 size={11} /> Top companies</div>
          <div className="flex flex-wrap gap-1.5">
            {s.topCompanies.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs text-slate-300">{c}</span>
            ))}
          </div>
        </div>
      )}

      {s.keyMilestones?.length > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-2">Key milestones</div>
          <ul className="space-y-1">
            {s.keyMilestones.map((m) => (
              <li key={m} className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-purple-glow mt-0.5 flex-shrink-0">→</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SimulationPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [current, setCurrent] = useState<Simulation | null>(null);

  const { data: history, isLoading: histLoading } = useQuery<Simulation[]>({
    queryKey: ['simulations'],
    queryFn: async () => { const { data } = await api.get('/simulation'); return data; },
  });

  const run = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/simulation', { skillPaths: selected });
      return data;
    },
    onSuccess: (data) => {
      setCurrent(data);
      toast.success('Simulation complete!');
    },
    onError: () => toast.error('Simulation failed. Please try again.'),
  });

  const toggle = (path: string) => {
    setSelected((p) => p.includes(path) ? p.filter((x) => x !== path) : p.length < 3 ? [...p, path] : p);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Future Simulation Engine</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">Select 2–3 skill paths to simulate your career futures</p>
      </div>

      <div className="glass rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-white text-sm md:text-base">Choose Skill Paths ({selected.length}/3)</h2>
          {selected.length >= 2 && (
            <button onClick={() => run.mutate()} disabled={run.isPending}
              className="flex items-center gap-2 px-4 md:px-5 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 disabled:opacity-50 text-sm">
              <Zap size={16} />
              {run.isPending ? 'Simulating...' : 'Run Simulation'}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
          {SKILL_PATHS.map((p) => (
            <button key={p} onClick={() => toggle(p)}
              className={`p-2.5 md:p-3 rounded-xl text-xs md:text-sm border transition-all text-left ${
                selected.includes(p)
                  ? 'bg-purple/20 border-purple/50 text-purple-glow'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
              } ${!selected.includes(p) && selected.length === 3 ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {run.isPending && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">Simulating your futures...</h2>
          <div className={`grid gap-4 ${selected.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {selected.map((p) => <Skeleton key={p} className="h-80" />)}
          </div>
        </div>
      )}

      {current && !run.isPending && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">Simulation Results</h2>
          <div className={`grid gap-4 ${(current.results as SimulationScenario[]).length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {(current.results as SimulationScenario[]).map((s) => (
              <ScenarioCard key={s.pathName} s={s} />
            ))}
          </div>
        </div>
      )}

      {!current && !run.isPending && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">Past Simulations</h2>
          {histLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map((sim) => (
                <button key={sim.id} onClick={() => setCurrent(sim)}
                  className="w-full glass rounded-xl p-4 text-left hover:bg-white/5 transition-colors">
                  <div className="text-sm text-slate-300">{sim.skillPaths.join(' vs ')}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(sim.createdAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No simulations yet. Select 2–3 paths above to run your first one.</p>
          )}
        </div>
      )}
    </div>
  );
}
