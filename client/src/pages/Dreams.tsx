import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Mic, MicOff, Send, ChevronDown, ChevronUp, Trash2, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import type { Dream, DreamSummary } from '../types';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded-xl animate-pulse ${className}`} />;
}

function ProjectRoadmap({ dream }: { dream: Dream }) {
  return (
    <div className="space-y-5 md:space-y-6">
      <p className="text-slate-300 leading-relaxed text-sm md:text-base">{dream.structuredPlan.overview}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Market Opportunity</div>
          <p className="text-sm text-slate-300">{dream.structuredPlan.marketOpportunity}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Funding Strategy</div>
          <p className="text-sm text-slate-300">{dream.structuredPlan.fundingStrategy}</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-3 text-sm md:text-base">Project Phases</h4>
        <div className="space-y-3">
          {dream.structuredPlan.phases.map((phase, i) => (
            <div key={phase.name} className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-purple/30 border border-purple/50 text-purple-glow text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div>
                  <div className="font-medium text-white text-sm">{phase.name}</div>
                  <div className="text-xs text-slate-500">{phase.duration}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-10">
                <div>
                  <div className="text-xs text-slate-500 mb-1.5">Tasks</div>
                  <ul className="space-y-1">
                    {phase.tasks.map((t) => <li key={t} className="text-xs text-slate-400 flex gap-2 items-start"><span className="text-cyan mt-0.5 flex-shrink-0">✓</span>{t}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1.5">Resources</div>
                  <ul className="space-y-1">
                    {phase.resources.map((r) => <li key={r} className="text-xs text-slate-400 flex gap-2 items-start"><span className="text-purple-glow mt-0.5 flex-shrink-0">→</span>{r}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-3 text-sm md:text-base">12-Week Learning Roadmap</h4>
        <div className="space-y-2">
          {dream.learningRoadmap.milestones.map((m) => (
            <div key={m.week} className="flex gap-3 md:gap-4 items-start">
              <div className="flex-shrink-0 w-14 md:w-16 text-xs text-slate-500 mt-0.5">Week {m.week}</div>
              <div className="flex-1 glass rounded-xl p-3">
                <div className="text-sm text-white mb-1.5">{m.objective}</div>
                <div className="flex flex-wrap gap-1">
                  {m.skills.map((s) => <span key={s} className="px-2 py-0.5 bg-cyan/10 border border-cyan/20 text-cyan-light rounded text-xs">{s}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DreamCard({ summary, onExpand }: { summary: DreamSummary; onExpand: (id: string) => void }) {
  return (
    <button onClick={() => onExpand(summary.id)}
      className="glass glass-hover rounded-2xl p-4 md:p-5 text-left w-full transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm md:text-base truncate">{summary.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{formatDate(summary.createdAt)}</p>
          <p className="text-sm text-slate-400 mt-2 line-clamp-2">{summary.rawInput}</p>
        </div>
        <ChevronDown size={18} className="text-slate-500 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function DreamsPage() {
  const qc = useQueryClient();
  const [rawInput, setRawInput] = useState('');
  const [listening, setListening] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const { data: list, isLoading: listLoading } = useQuery<DreamSummary[]>({
    queryKey: ['dreams'],
    queryFn: async () => { const { data } = await api.get('/dreams'); return data; },
  });

  const { data: dreamDetail, isLoading: detailLoading } = useQuery<Dream>({
    queryKey: ['dream', expanded],
    queryFn: async () => { const { data } = await api.get(`/dreams/${expanded}`); return data; },
    enabled: !!expanded,
  });

  const create = useMutation({
    mutationFn: async () => { const { data } = await api.post('/dreams', { rawInput }); return data; },
    onSuccess: (data: Dream) => {
      setRawInput('');
      qc.invalidateQueries({ queryKey: ['dreams'] });
      setExpanded(data.id);
      toast.success('Dream captured! Your plan is ready.');
    },
    onError: () => toast.error('Failed to process dream. Please try again.'),
  });

  const deleteDream = useMutation({
    mutationFn: (id: string) => api.delete(`/dreams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dreams'] });
      setExpanded(null);
      toast.success('Dream deleted');
    },
    onError: () => toast.error('Failed to delete dream'),
  });

  const toggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice input not supported in this browser'); return; }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e: { results: SpeechRecognitionResultList }) => {
      const transcript = Array.from(e.results).map((r: SpeechRecognitionResult) => r[0].transcript).join('');
      setRawInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); toast.error('Voice input error'); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this dream?')) return;
    deleteDream.mutate(id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dream Capture</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">Speak or write any idea — AI turns it into a project plan</p>
      </div>

      <div className="glass rounded-2xl p-5 md:p-6">
        <textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} rows={4}
          placeholder="Describe your dream or idea... e.g. 'I want to build an app that helps farmers track crop prices using AI'"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60 resize-none text-sm mb-4" />
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <button onClick={toggleVoice}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm border transition-all ${
              listening ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'glass border-white/10 text-slate-300 hover:text-white'
            }`}>
            {listening ? <><MicOff size={15} /> Stop</> : <><Mic size={15} /> Voice Input</>}
          </button>
          <button onClick={() => create.mutate()} disabled={!rawInput.trim() || create.isPending}
            className="flex items-center gap-2 px-4 md:px-5 py-2 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 disabled:opacity-40 text-sm">
            <Send size={15} />
            {create.isPending ? 'Generating Plan...' : 'Capture Dream'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="glass rounded-2xl p-5 md:p-6">
          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-20" />
              <Skeleton className="h-40" />
            </div>
          ) : dreamDetail ? (
            <>
              <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">{dreamDetail.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(dreamDetail.createdAt)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setExpanded(null)} className="p-2 glass rounded-xl text-slate-400 hover:text-white transition-colors">
                    <ChevronUp size={18} />
                  </button>
                  <button onClick={() => handleDelete(expanded)} disabled={deleteDream.isPending}
                    className="p-2 glass rounded-xl text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <ProjectRoadmap dream={dreamDetail} />
            </>
          ) : (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} /> Failed to load dream details
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-cyan" />
          Your Dreams {list ? `(${list.length})` : ''}
        </h2>
        {listLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : list && list.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.filter((d) => d.id !== expanded).map((d) => (
              <DreamCard key={d.id} summary={d} onExpand={setExpanded} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No dreams captured yet. Write or speak your first idea above!</p>
        )}
      </div>
    </div>
  );
}
