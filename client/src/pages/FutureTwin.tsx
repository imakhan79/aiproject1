import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';
import type { FutureTwin } from '../types';
import { RefreshCw, Brain, Zap, Target } from 'lucide-react';
import { toast } from 'sonner';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

export default function FutureTwinPage() {
  const qc = useQueryClient();

  const { data: twin, isLoading, isError } = useQuery<FutureTwin>({
    queryKey: ['twin'],
    queryFn: async () => { const { data } = await api.get('/twin'); return data; },
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: () => api.post('/twin/generate'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['twin'] });
      toast.success('Future Twin regenerated!');
    },
    onError: () => toast.error('Failed to generate twin. Please try again.'),
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );

  if (isError || !twin) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Brain size={48} className="text-slate-600" />
      <p className="text-slate-400 text-center">Your AI Future Twin hasn't been generated yet.</p>
      <button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 disabled:opacity-50">
        {regenerate.isPending ? 'Generating...' : 'Generate My Twin'}
      </button>
    </div>
  );

  const radarData = twin.knowledgeDNA.domains.map((d) => ({ subject: d.name, score: d.score }));

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Your AI Future Twin</h1>
          <p className="text-slate-400 mt-1 text-sm">Last updated: {new Date(twin.updatedAt).toLocaleDateString()}</p>
        </div>
        <button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm disabled:opacity-50 flex-shrink-0">
          <RefreshCw size={16} className={regenerate.isPending ? 'animate-spin' : ''} />
          Regenerate
        </button>
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-5 md:p-6 border-l-4 border-purple">
        <p className="text-slate-300 leading-relaxed text-base md:text-lg italic">"{twin.summaryNarrative}"</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Knowledge DNA Radar */}
        <div className="glass rounded-2xl p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain size={20} className="text-purple-glow" /> Knowledge DNA
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#0f1629', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-1.5">
            {twin.knowledgeDNA.domains.map((d) => (
              <div key={d.name} className="text-xs text-slate-400">
                <span className="text-white font-medium">{d.name}:</span> {d.description}
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Profile */}
        <div className="glass rounded-2xl p-5 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-cyan" /> Cognitive Profile
          </h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <div className="glass rounded-xl px-3 py-1.5 text-cyan-light">{twin.cognitiveProfile.learningVelocity} learner</div>
              <div className="glass rounded-xl px-3 py-1.5 text-purple-glow">{twin.cognitiveProfile.thinkingStyle} thinker</div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Strengths</p>
              <div className="space-y-1.5">
                {twin.cognitiveProfile.strengths.map((s) => (
                  <div key={s} className="flex items-start gap-2 text-sm text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />{s}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Growth Areas</p>
              <div className="space-y-1.5">
                {twin.cognitiveProfile.blindSpots.map((s) => (
                  <div key={s} className="flex items-start gap-2 text-sm text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />{s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Strengths */}
      <div className="glass rounded-2xl p-5 md:p-6">
        <h2 className="text-base md:text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <Target size={20} className="text-cyan" /> Learning Strengths
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {twin.learningStrengths.dimensions.map((d) => (
            <div key={d.name}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">{d.name}</span>
                <span className="text-slate-400">{d.score}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-purple to-cyan transition-all duration-700"
                  style={{ width: `${d.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
