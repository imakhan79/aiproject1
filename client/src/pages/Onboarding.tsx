import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const TOTAL_STEPS = 7;

const EDUCATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'self_taught', label: 'Self-Taught' },
];

const INTEREST_OPTIONS = [
  'Technology', 'Artificial Intelligence', 'Business', 'Design', 'Science', 'Medicine',
  'Education', 'Finance', 'Music', 'Art', 'Sports', 'Environment', 'Politics', 'Gaming',
  'Writing', 'Photography', 'Travel', 'Psychology', 'Philosophy', 'Engineering',
];

const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual', desc: 'I learn by seeing diagrams, videos, and images' },
  { value: 'auditory', label: 'Auditory', desc: 'I learn by listening and discussing' },
  { value: 'kinesthetic', label: 'Hands-On', desc: 'I learn by doing and experimenting' },
  { value: 'reading_writing', label: 'Reading/Writing', desc: 'I learn through text and note-taking' },
];

const PERSONALITY_QUESTIONS = [
  { key: 'energy', q: 'Where do you get your energy?', a: [{ v: 'E', l: 'From being around people' }, { v: 'I', l: 'From time alone to reflect' }] },
  { key: 'info', q: 'How do you prefer to take in information?', a: [{ v: 'S', l: 'Facts and concrete details' }, { v: 'N', l: 'Patterns and big-picture ideas' }] },
  { key: 'decisions', q: 'How do you make decisions?', a: [{ v: 'T', l: 'Logic and objective analysis' }, { v: 'F', l: 'Values and how people are affected' }] },
  { key: 'structure', q: 'How do you like your life structured?', a: [{ v: 'J', l: 'Planned and organized' }, { v: 'P', l: 'Flexible and spontaneous' }] },
];

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 px-3 py-1 bg-purple/20 text-purple-glow border border-purple/30 rounded-full text-sm">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="text-purple-glow/60 hover:text-white ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60"
        />
        <button onClick={add} className="px-4 py-3 bg-purple/20 border border-purple/30 text-purple-glow rounded-xl hover:bg-purple/30 transition-colors">
          Add
        </button>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [personalityRaw, setPersonalityRaw] = useState<Record<string, string>>({});

  const progress = (step / TOTAL_STEPS) * 100;

  const personalityType = Object.values(personalityRaw).join('');

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    setLoading(true);
    try {
      // 1. Save profile (fast)
      await api.post('/profile', {
        firstName, lastName: lastName || undefined,
        age: age ? parseInt(age) : undefined,
        educationLevel: educationLevel || undefined,
        currentSkills, interests,
        careerGoals: careerGoals || undefined,
        learningStyle: learningStyle || undefined,
        personalityRaw,
        personalityType: personalityType.length === 4 ? personalityType : undefined,
        onboardingComplete: true,
      });

      // 2. Navigate to dashboard immediately — don't wait for twin
      await refreshUser();
      navigate('/dashboard');
      toast.success('Profile saved! Generating your AI Future Twin...');

      // 3. Generate twin in background (non-blocking)
      api.post('/twin/generate').catch(() => {
        toast.error('Twin generation failed — click Regenerate on the Twin page.');
      });

    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <span className="gradient-text text-2xl font-bold">Build Your AI Future Twin</span>
          <p className="text-slate-400 mt-1 text-sm">Step {step} of {TOTAL_STEPS}</p>
        </div>

        <div className="w-full bg-white/5 rounded-full h-1.5 mb-8">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-purple to-cyan transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="glass rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">What's your name?</h2>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name *" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">Tell us about yourself</h2>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" min={10} max={100} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60" />
              <div className="grid grid-cols-2 gap-3">
                {EDUCATION_OPTIONS.map((o) => (
                  <button key={o.value} onClick={() => setEducationLevel(o.value)}
                    className={`p-3 rounded-xl text-sm border transition-all ${educationLevel === o.value ? 'bg-purple/20 border-purple/50 text-purple-glow' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">What are your current skills?</h2>
              <p className="text-slate-400 text-sm">Type a skill and press Enter or click Add</p>
              <TagInput tags={currentSkills} onChange={setCurrentSkills} placeholder="e.g. Python, Graphic Design, Public Speaking" />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">What are you passionate about?</h2>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((i) => (
                  <button key={i} onClick={() => setInterests((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])}
                    className={`px-4 py-2 rounded-full text-sm border transition-all ${interests.includes(i) ? 'bg-cyan/20 border-cyan/50 text-cyan-light' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">What do you want to achieve?</h2>
              <p className="text-slate-400 text-sm">Describe your career goals, dreams, or vision for your future.</p>
              <textarea value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} rows={5}
                placeholder="I want to become a machine learning engineer and eventually start my own AI company..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60 resize-none" />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-white">How do you learn best?</h2>
              <div className="space-y-3">
                {LEARNING_STYLES.map((s) => (
                  <button key={s.value} onClick={() => setLearningStyle(s.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${learningStyle === s.value ? 'bg-purple/20 border-purple/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <div className="font-medium text-white">{s.label}</div>
                    <div className="text-sm text-slate-400 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Quick personality check</h2>
              <p className="text-slate-400 text-sm">4 questions to calibrate your AI Twin</p>
              {PERSONALITY_QUESTIONS.map((q) => (
                <div key={q.key}>
                  <p className="text-sm text-slate-300 mb-3">{q.q}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {q.a.map((a) => (
                      <button key={a.v} onClick={() => setPersonalityRaw((p) => ({ ...p, [q.key]: a.v }))}
                        className={`p-3 rounded-xl text-sm border transition-all ${personalityRaw[q.key] === a.v ? 'bg-purple/20 border-purple/50 text-purple-glow' : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'}`}>
                        {a.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button onClick={back} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors">Back</button>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <button onClick={next} disabled={step === 1 && !firstName}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
                Continue
              </button>
            ) : (
              <button onClick={submit} disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple to-cyan text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40">
                {loading ? 'Generating your Twin...' : 'Launch My Future Twin ✨'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
