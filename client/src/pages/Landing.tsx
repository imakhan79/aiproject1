import { Link } from 'react-router-dom';
import { Brain, Zap, MessageCircle, Lightbulb, Map, FlaskConical } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI Future Twin™', desc: 'A living digital representation of your knowledge, personality, and potential that evolves with you.', color: 'text-purple-glow' },
  { icon: Zap, title: 'Future Simulation Engine', desc: 'Simulate thousands of career paths and see exact salary, probability, and timeline before you commit.', color: 'text-cyan' },
  { icon: MessageCircle, title: 'AI Life Coach', desc: 'A lifelong strategic advisor that knows your full journey and gives direct, actionable guidance.', color: 'text-green-400' },
  { icon: Lightbulb, title: 'Dream Capture System™', desc: 'Speak any idea — AI converts it into a funded startup plan, learning roadmap, and prototype path.', color: 'text-amber-400' },
  { icon: Map, title: 'Knowledge DNA™', desc: 'Your unique cognitive fingerprint: strengths, thinking style, and learning velocity mapped precisely.', color: 'text-pink-400' },
  { icon: FlaskConical, title: 'AI Invention Lab™', desc: 'From idea to CAD sketch, market analysis, and patent roadmap — all powered by AI.', color: 'text-indigo-400' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          <span className="gradient-text text-lg md:text-xl font-bold whitespace-nowrap">NeuroVerse AI</span>
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors hidden sm:block">Sign In</Link>
            <Link to="/signup" className="px-3 md:px-4 py-2 bg-gradient-to-r from-purple to-cyan text-white text-xs md:text-sm font-medium rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-purple/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 glass rounded-full text-xs text-cyan mb-5 md:mb-6 border border-cyan/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            World's First Human Potential Operating System
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-5 md:mb-6 leading-tight">
            Your AI Future Twin<br />
            <span className="gradient-text">Knows Your Best Life</span>
          </h1>
          <p className="text-base md:text-xl text-slate-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop guessing. NeuroVerse simulates millions of possible futures for you, identifies your highest potential path, and guides you step by step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link to="/signup"
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple to-cyan text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity text-base md:text-lg glow-purple">
              Build My Future Twin →
            </Link>
            <Link to="/login" className="px-6 md:px-8 py-3 md:py-4 glass border border-white/20 text-white font-medium rounded-2xl hover:bg-white/5 transition-all text-base md:text-lg sm:hidden block">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* The question / answer */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 border border-white/10">
            <p className="text-slate-400 text-lg mb-4">Instead of asking:</p>
            <p className="text-2xl text-white font-medium mb-6">"What should I learn?"</p>
            <p className="text-slate-400 text-lg mb-4">NeuroVerse answers:</p>
            <p className="text-xl gradient-text font-semibold leading-relaxed">
              "If you learn Skill A instead of Skill B today, your earning potential in 5 years increases by 43%, your probability of working in AI rises by 61%, and your chances of launching a startup improve by 29%."
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-3">Everything you need to reach your highest potential</h2>
          <p className="text-slate-400 text-center mb-12">Six revolutionary systems working together</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass glass-hover rounded-2xl p-6">
                <Icon size={28} className={`${color} mb-4`} />
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start your journey today</h2>
          <p className="text-slate-400 mb-8">Join thousands discovering their best possible future</p>
          <Link to="/signup"
            className="inline-block px-10 py-4 bg-gradient-to-r from-purple to-cyan text-white font-semibold rounded-2xl hover:opacity-90 transition-opacity text-lg">
            Create Free Account →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-slate-600 text-sm">
        © 2026 NeuroVerse AI. Human Potential Operating System.
      </footer>
    </div>
  );
}
