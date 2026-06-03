import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Target, CheckCircle, XCircle, Clock, ArrowRight, Flame } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

interface SkillGapResult {
  dreamRole: string;
  company: string;
  readinessScore: number;
  timeToReady: string;
  matchedSkills: string[];
  missingSkills: { skill: string; importance: 'critical' | 'important' | 'nice'; learningTime: string; resources: string[] }[];
  personalityFit: string;
  salaryRange: string;
  learningPath: { week: string; milestone: string; skills: string[] }[];
  quickWins: string[];
  hardTruths: string;
}

const DREAM_ROLES = [
  'AI/ML Engineer at Google', 'Product Manager at Apple', 'UX Designer at Netflix',
  'Data Scientist at Meta', 'Full-Stack Engineer at Stripe', 'Startup Founder',
  'Cybersecurity Analyst at Microsoft', 'DevOps Engineer at Amazon',
  'Game Developer at Valve', 'Blockchain Developer',
];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

export default function SkillGapPage() {
  const [dreamRole, setDreamRole] = useState('');
  const [result, setResult] = useState<SkillGapResult | null>(null);

  const analyze = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api-features/skill-gap', { dreamRole });
      return data as SkillGapResult;
    },
    onSuccess: (data) => { setResult(data); toast.success('Gap analysis complete!'); },
    onError: () => toast.error('Analysis failed. Please try again.'),
  });

  const importanceConfig = {
    critical: { label: 'Critical', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
    important: { label: 'Important', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
    nice: { label: 'Nice to Have', color: 'text-slate-400 border-slate-400/30 bg-slate-400/10' },
  };

  const readinessColor = (score: number) =>
    score >= 70 ? 'text-green-400' : score >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-3">
          <Target size={28} className="text-cyan" /> Skill Gap Analyzer™
        </h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Pick your dream role — AI shows your exact gap and a step-by-step path to get there
        </p>
      </div>

      <div className="glass rounded-2xl p-5 md:p-6 space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Your dream role</label>
          <input
            value={dreamRole}
            onChange={(e) => setDreamRole(e.target.value)}
            placeholder="e.g. Senior AI Engineer at OpenAI, Startup Founder, Product Manager at Spotify..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">Popular choices:</p>
          <div className="flex flex-wrap gap-2">
            {DREAM_ROLES.map((r) => (
              <button key={r} onClick={() => setDreamRole(r)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  dreamRole === r
                    ? 'bg-purple/20 border-purple/50 text-purple-glow'
                    : 'glass border-white/10 text-slate-300 hover:border-white/20'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => analyze.mutate()} disabled={!dreamRole.trim() || analyze.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 disabled:opacity-40 text-sm">
          <Target size={16} />
          {analyze.isPending ? 'Analyzing gap...' : 'Analyze My Gap'}
        </button>
      </div>

      {analyze.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" /><Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      )}

      {result && !analyze.isPending && (
        <div className="space-y-5">
          {/* Readiness score hero */}
          <div className="glass rounded-2xl p-5 md:p-6">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="text-center glass rounded-2xl p-4 flex-shrink-0">
                <div className={`text-4xl font-black ${readinessColor(result.readinessScore)}`}>{result.readinessScore}%</div>
                <div className="text-xs text-slate-500 mt-1">Ready</div>
              </div>
              <div className="flex-1 min-w-48">
                <h2 className="text-lg font-bold text-white">{result.dreamRole}</h2>
                {result.company && <p className="text-slate-400 text-sm">{result.company}</p>}
                <div className="flex flex-wrap gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1.5 text-cyan"><Clock size={14} />{result.timeToReady}</div>
                  <div className="flex items-center gap-1.5 text-green-400"><Flame size={14} />{result.salaryRange}</div>
                </div>
                <div className="mt-3 w-full bg-white/5 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-green-400 transition-all duration-700`}
                    style={{ width: `${result.readinessScore}%` }} />
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-4 italic">"{result.personalityFit}"</p>
          </div>

          {/* Hard truth */}
          <div className="glass rounded-2xl p-4 border-l-4 border-amber-400">
            <div className="text-xs text-amber-400 uppercase tracking-wider mb-1 font-semibold">Hard Truth</div>
            <p className="text-slate-300 text-sm">{result.hardTruths}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched skills */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-green-400" /> You Already Have ({result.matchedSkills.length})
              </h3>
              <div className="space-y-1.5">
                {result.matchedSkills.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle size={13} className="flex-shrink-0" />{s}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick wins */}
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <Flame size={16} className="text-orange-400" /> Quick Wins (Start Today)
              </h3>
              <div className="space-y-1.5">
                {result.quickWins.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-orange-300">
                    <span className="text-orange-400 font-bold flex-shrink-0">{i + 1}.</span>{w}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Missing skills */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm">
              <XCircle size={16} className="text-red-400" /> Skills to Acquire ({result.missingSkills.length})
            </h3>
            <div className="space-y-3">
              {result.missingSkills.map((ms) => {
                const cfg = importanceConfig[ms.importance];
                return (
                  <div key={ms.skill} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="font-medium text-white text-sm">{ms.skill}</div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={11} />{ms.learningTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ms.resources.map((r) => (
                        <span key={r} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-slate-400">{r}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning path */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm">
              <ArrowRight size={16} className="text-purple-glow" /> Your Learning Path to {result.dreamRole.split(' at ')[0]}
            </h3>
            <div className="space-y-3">
              {result.learningPath.map((phase, i) => (
                <div key={phase.week} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-purple/30 border border-purple/50 text-purple-glow text-xs font-bold flex items-center justify-center">{i + 1}</div>
                    {i < result.learningPath.length - 1 && <div className="w-0.5 h-full bg-purple/20 mt-1 min-h-4" />}
                  </div>
                  <div className="flex-1 glass rounded-xl p-3 mb-1">
                    <div className="text-xs text-slate-500 mb-1">{phase.week}</div>
                    <div className="text-sm font-medium text-white mb-2">{phase.milestone}</div>
                    <div className="flex flex-wrap gap-1">
                      {phase.skills.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-cyan/10 border border-cyan/20 text-cyan-light rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
