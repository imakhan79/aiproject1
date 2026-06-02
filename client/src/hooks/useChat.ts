import { useState, useCallback } from 'react';
import type { ChatMessage } from '../types';

export function useChat(initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState('');

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingText('');
    setError('');

    const token = localStorage.getItem('nv_token');

    try {
      const response = await fetch('/api/coach/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (response.status === 401) {
        localStorage.removeItem('nv_token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        const msg = (errData as { error?: string }).error ?? 'Failed to get response';
        setError(msg);
        setStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) {
              full += parsed.text;
              setStreamingText(full);
            }
            if (parsed.done) {
              const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                userId: '',
                role: 'assistant',
                content: full,
                createdAt: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, assistantMsg]);
              setStreamingText('');
              setStreaming(false);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      setError('Network error. Please try again.');
      setStreaming(false);
      setStreamingText('');
    }
  }, []);

  return { messages, setMessages, streaming, streamingText, error, sendMessage };
}
