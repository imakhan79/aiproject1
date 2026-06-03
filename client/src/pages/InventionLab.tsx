import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FlaskConical, Rocket, TrendingUp, Shield, Map, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';

interface InventionResult {
  productName: string;
  tagline: string;
  problemStatement: string;
  solution: string;
  targetMarket: string;
  marketSize: string;
  revenueModel: string;
  competitorAnalysis: string[];
  uniqueAdvantages: string[];
  mvpFeatures: string[];
  techStack: string[];
  patentAngles: string[];
  pitchDeckOutline: string[];
  fundingStrategy: string;
  timeToMarket: string;
  successProbability: number;
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, items, icon: Icon, color }: { title: string; items: string[]; icon: React.ElementType; color: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm md:text-base">
          <Icon size={18} className={color} />{title}
        </h3>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
              <span className={`${color} font-bold flex-shrink-0 text-xs mt-0.5`}>{String(i + 1).padStart(2, '0')}</span>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const EXAMPLES = [
  "A drone that plants trees in deforested areas using AI to find optimal spots",
  "An app that turns your dreams into NFT art using AI image generation",
  "A wearable that detects mental stress and plays personalized calming music",
  "A platform where retired experts teach skills via 5-minute micro-lessons",
];

export default function InventionLabPage() {
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState<InventionResult | null>(null);

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api-features/invention', { idea });
      return data as InventionResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Invention analyzed!');
    },
    onError: () => toast.error('Failed to analyze invention. Try again.'),
  });

  const probColor = (result?.successProbability ?? 0) >= 70 ? 'text-green-400' : (result?.successProbability ?? 0) >= 50 ? 'text-amber-400' : 'text-orange-400';

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text flex items-center gap-3">
          <FlaskConical size={28} className="text-purple-glow" /> AI Invention Lab™
        </h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Describe any idea — get a full product analysis, market research, MVP roadmap & pitch deck
        </p>
      </div>

      <div className="glass rounded-2xl p-5 md:p-6 space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Describe your invention or idea</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            placeholder="e.g. A drone that plants trees in deforested areas using AI to find optimal spots..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60 resize-none text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setIdea(ex)}
                className="px-3 py-1.5 glass rounded-full text-xs text-slate-300 hover:text-white border border-white/10 hover:border-purple/40 transition-all text-left">
                {ex.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => generate.mutate()} disabled={!idea.trim() || generate.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 disabled:opacity-40 transition-opacity text-sm">
          <Sparkles size={16} />
          {generate.isPending ? 'Analyzing invention...' : 'Analyze My Invention'}
        </button>
      </div>

      {generate.isPending && (
        <div className="glass rounded-2xl p-8 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple/30 border-t-purple rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Running market analysis, competitor research, and MVP planning...</p>
        </div>
      )}

      {result && !generate.isPending && (
        <div className="space-y-5">
          {/* Header */}
          <div className="glass rounded-2xl p-5 md:p-6 border-l-4 border-cyan">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{result.productName}</h2>
                <p className="text-cyan-light mt-1 italic text-sm md:text-base">"{result.tagline}"</p>
              </div>
              <div className="text-center glass rounded-xl px-4 py-3 flex-shrink-0">
                <div className={`text-2xl font-bold ${probColor}`}>{result.successProbability}%</div>
                <div className="text-xs text-slate-500">success chance</div>
              </div>
            </div>
            <p className="text-slate-300 mt-4 text-sm leading-relaxed">{result.solution}</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatPill label="Market Size" value={result.marketSize} color="text-green-400" />
            <StatPill label="Time to Market" value={result.timeToMarket} color="text-cyan" />
            <StatPill label="Revenue Model" value={result.revenueModel} color="text-purple-glow" />
            <StatPill label="Funding Path" value={result.fundingStrategy} color="text-amber-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Problem */}
            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold text-white text-sm mb-2 flex items-center gap-2"><Shield size={16} className="text-red-400" /> Problem</h3>
              <p className="text-slate-400 text-sm">{result.problemStatement}</p>
            </div>
            {/* Target market */}
            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold text-white text-sm mb-2 flex items-center gap-2"><Map size={16} className="text-cyan" /> Target Market</h3>
              <p className="text-slate-400 text-sm">{result.targetMarket}</p>
            </div>
          </div>

          <Section title="Unique Advantages" items={result.uniqueAdvantages} icon={Sparkles} color="text-yellow-400" />
          <Section title="MVP Features" items={result.mvpFeatures} icon={Rocket} color="text-cyan" />
          <Section title="Tech Stack" items={result.techStack} icon={FlaskConical} color="text-purple-glow" />
          <Section title="Patent Angles" items={result.patentAngles} icon={Shield} color="text-green-400" />
          <Section title="Competitor Analysis" items={result.competitorAnalysis} icon={TrendingUp} color="text-orange-400" />
          <Section title="Pitch Deck Outline" items={result.pitchDeckOutline} icon={Rocket} color="text-pink-400" />
        </div>
      )}
    </div>
  );
}
