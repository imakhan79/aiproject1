import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Clock, TrendingUp, AlertTriangle, Star, ChevronRight, Zap, BookOpen } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

interface FutureTrend {
  year: number;
  title: string;
  description: string;
  jobsCreated: string;
  jobsDestroyed: string;
  keySkills: string[];
  urgency: 'now' | 'soon' | 'future';
  relevanceScore: number;
}

interface TimeMachineResult {
  personalNarrative: string;
  trends: FutureTrend[];
  criticalSkillsToLearnNow: string[];
  skillsBecomingObsolete: string[];
  yourBestOpportunities: string[];
  weeklyLearningPlan: { day: string; task: string; duration: string }[];
  futureYouIn5Years: string;
}

const URGENCY_CONFIG = {
  now: { label: 'Learn NOW', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  soon: { label: 'Learn Soon', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
  future: { label: 'Watch This', color: 'text-cyan border-cyan/30 bg-cyan/10' },
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

export default function TimeMachinePage() {
  const [result, setResult] = useState<TimeMachineResult | null>(null);

  const { data: twin } = useQuery({
    queryKey: ['twin'],
    queryFn: async () => { const { data } = await api.get('/twin'); return data; },
    retry: false,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api-features/time-machine');
      return data as TimeMachineResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Future analysis complete!');
    },
    onError: () => toast.error('Failed to generate future analysis.'),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-3">
          <Clock size={28} className="text-cyan" /> Time Machine Learning™
        </h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          See the future job market (2025–2035) and discover exactly what to learn today
        </p>
      </div>

      {!result && (
        <div className="glass rounded-2xl p-6 md:p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple/30 to-cyan/30 border border-white/10 flex items-center justify-center">
            <Clock size={36} className="text-cyan animate-pulse-slow" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Simulate Your Future</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              AI analyzes 10 years of market trends, your current profile, and predicts exactly which skills will make you unstoppable by 2035.
            </p>
          </div>
          {!twin && (
            <div className="glass rounded-xl p-3 border border-amber-400/20 text-amber-400 text-sm inline-flex items-center gap-2">
              <AlertTriangle size={15} /> Generate your Future Twin first for personalized predictions
            </div>
          )}
          <button onClick={() => generate.mutate()} disabled={generate.isPending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 disabled:opacity-40 transition-opacity">
            <Zap size={18} />
            {generate.isPending ? 'Scanning the future...' : 'Launch Time Machine'}
          </button>
        </div>
      )}

      {generate.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {result && !generate.isPending && (
        <div className="space-y-6">
          {/* Personal narrative */}
          <div className="glass rounded-2xl p-5 md:p-6 border-l-4 border-cyan">
            <h2 className="text-sm font-semibold text-cyan uppercase tracking-wider mb-3">Your 2035 Outlook</h2>
            <p className="text-white leading-relaxed">{result.personalNarrative}</p>
          </div>

          {/* Future you */}
          <div className="glass rounded-2xl p-5 md:p-6 bg-gradient-to-br from-purple/10 to-cyan/5">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2"><Star size={18} className="text-yellow-400" /> You in 5 Years</h2>
            <p className="text-slate-300 italic text-sm leading-relaxed">"{result.futureYouIn5Years}"</p>
          </div>

          {/* Critical skills grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <Zap size={16} className="text-red-400" /> Learn RIGHT NOW
              </h3>
              <div className="space-y-2">
                {result.criticalSkillsToLearnNow.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="text-white">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className="text-amber-400" /> Skills Becoming Obsolete
              </h3>
              <div className="space-y-2">
                {result.skillsBecomingObsolete.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-slate-300 line-through opacity-60">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trends */}
          <div>
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-glow" /> Future Job Market Trends
            </h2>
            <div className="space-y-3">
              {result.trends.map((trend) => {
                const urg = URGENCY_CONFIG[trend.urgency];
                return (
                  <div key={trend.title} className="glass rounded-2xl p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-xs glass rounded-lg px-2 py-1 text-slate-400 font-mono">{trend.year}</div>
                        <h3 className="font-semibold text-white text-sm md:text-base">{trend.title}</h3>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${urg.color} flex-shrink-0`}>{urg.label}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{trend.description}</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="glass rounded-xl p-2.5 text-xs">
                        <div className="text-green-400 font-medium mb-0.5">Jobs Created</div>
                        <div className="text-slate-300">{trend.jobsCreated}</div>
                      </div>
                      <div className="glass rounded-xl p-2.5 text-xs">
                        <div className="text-red-400 font-medium mb-0.5">Jobs Displaced</div>
                        <div className="text-slate-300">{trend.jobsDestroyed}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {trend.keySkills.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-purple/10 border border-purple/20 text-purple-glow rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your best opportunities */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Star size={18} className="text-yellow-400" /> Your Best Opportunities
            </h3>
            <div className="space-y-2">
              {result.yourBestOpportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <ChevronRight size={16} className="text-cyan flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">{opp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly plan */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-green-400" /> Your Personalized Weekly Learning Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.weeklyLearningPlan.map((item) => (
                <div key={item.day} className="flex items-start gap-3 glass rounded-xl p-3">
                  <div className="text-xs font-bold text-purple-glow w-10 flex-shrink-0 mt-0.5">{item.day}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{item.task}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { setResult(null); generate.mutate(); }}
            className="w-full py-3 glass rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2">
            <Zap size={16} /> Regenerate Analysis
          </button>
        </div>
      )}
    </div>
  );
}
