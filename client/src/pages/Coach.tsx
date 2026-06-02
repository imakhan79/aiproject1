import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import api from '../lib/api';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';

function ChatBubble({ msg }: { msg: ChatMessage | { role: string; content: string; id: string } }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser ? 'bg-purple/30 border border-purple/40 text-white' : 'glass border border-white/10 text-slate-200'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

export default function CoachPage() {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery<ChatMessage[]>({
    queryKey: ['coach-history'],
    queryFn: async () => { const { data } = await api.get('/coach/history'); return data; },
  });

  const { messages, setMessages, streaming, streamingText, sendMessage } = useChat(history ?? []);

  useEffect(() => {
    if (history) setMessages(history);
  }, [history, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const clearHistory = async () => {
    await api.delete('/coach/history');
    setMessages([]);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Life Coach</h1>
          <p className="text-slate-400 mt-1 text-sm">Your personal strategic advisor, powered by your Future Twin</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-slate-400 hover:text-white text-sm transition-all">
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 chat-scroll pr-1">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <MessageCircle size={48} className="text-slate-700" />
            <p className="text-slate-500 max-w-xs">Ask me anything about your career, learning strategy, or next steps. I know your full profile.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["What's my biggest strength?", "What should I learn first?", "How do I start a startup?"].map((q) => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 glass rounded-full text-xs text-slate-300 hover:text-white border border-white/10 hover:border-purple/40 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => <ChatBubble key={m.id} msg={m} />)}

        {streaming && streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[75%] glass border border-white/10 text-slate-200 rounded-2xl px-4 py-3 text-sm leading-relaxed">
              {streamingText}
              <span className="inline-block w-1 h-4 bg-cyan ml-1 animate-pulse" />
            </div>
          </div>
        )}
        {streaming && !streamingText && (
          <div className="flex justify-start">
            <div className="glass border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Ask your AI coach anything..."
          rows={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple/60 resize-none text-sm"
        />
        <button onClick={handleSend} disabled={!input.trim() || streaming}
          className="px-4 rounded-2xl bg-gradient-to-r from-purple to-cyan text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
