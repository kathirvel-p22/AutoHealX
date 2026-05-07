import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Terminal as ChatIcon, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { localAuth } from '../lib/localAuth';

// Initialize Gemini API
const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

const SYSTEM_PROMPT = `You are "AI-Helix", the dedicated support agent for the AutoHealX Platform.
AutoHealX is an advanced L3 Site Reliability Engineering (SRE) and Self-Healing Infrastructure platform.
Features include:
1. Real-time Incident Detection and Automatic Mitigation.
2. Crypto-signed Audit Chains for all infrastructure changes.
3. RBAC (Role-Based Access Control) for granular permissions.
4. Deep Scan capabilities for proactive node health monitoring.
5. Log Stream monitoring using advanced socket.io connectivity.

Your tone is professional, technical, yet helpful. You are "pre-trained" on this system data. 
If asked about specific features, explain how they help SRE teams. 
Keep responses concise and formatted for a terminal-style chat window. 
Do not mention being an AI model unless directly asked; stay in character as AutoHealX's core intelligence.`;

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      content: 'SYSTEM READY. I am AI-Helix. How can I assist with your infrastructure nodes today?', 
      timestamp: new Date().toLocaleTimeString() 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const currentUser = localAuth.getCurrentUser();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toLocaleTimeString() }]);
    setIsLoading(true);

    // Initial Audit Log for User Query
    try {
      await addDoc(collection(db, 'audit_logs'), {
        type: 'CHAT_QUERY',
        user: currentUser?.email || 'ANONYMOUS',
        role: currentUser?.role || 'VIEWER',
        content: userMessage,
        createdAt: new Date().toISOString(),
        metadata: {
          node: 'Helix-01',
          component: 'ChatBot'
        }
      });
    } catch (err) {
      console.error('Audit logging failed (User):', err);
    }

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      const botText = response.text || "NO_RESPONSE_RECEIVED from node.";
      setMessages(prev => [...prev, { role: 'bot', content: botText, timestamp: new Date().toLocaleTimeString() }]);

      // Audit Log for Bot Response
      try {
        await addDoc(collection(db, 'audit_logs'), {
          type: 'CHAT_RESPONSE',
          user: 'AI-Helix',
          role: 'SYSTEM',
          content: botText,
          createdAt: new Date().toISOString(),
          metadata: {
            node: 'Helix-01',
            component: 'ChatBot',
            referencedQuery: userMessage
          }
        });
      } catch (err) {
        console.error('Audit logging failed (Bot):', err);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: "ERROR: Communication timeout. Please verify API_GATEWAY status.", timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] h-[500px] bg-[#0B0C0E] border border-[#2D3139] shadow-2xl flex flex-col rounded-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[#15171A] border-b border-[#2D3139] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-[#00FFC2]/10 flex items-center justify-center border border-[#00FFC2]/20">
                  <Bot className="w-4 h-4 text-[#00FFC2]" />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">AI-Helix Terminal</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse" />
                    <span className="text-[9px] text-gray-500 font-mono uppercase">Node Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[#1C1F23] rounded-sm transition-colors text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[85%]",
                  m.role === 'user' ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-3 rounded-sm text-xs font-mono border",
                    m.role === 'user' 
                      ? "bg-[#1C1F23] border-[#2D3139] text-gray-200" 
                      : "bg-[#0B0C0E] border-[#00FFC2]/10 text-gray-300"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {m.role === 'bot' ? <Bot className="w-3 h-3 text-[#00FFC2]" /> : <User className="w-3 h-3 text-gray-500" />}
                      <span className="text-[9px] uppercase tracking-tighter opacity-50">
                        {m.role === 'bot' ? 'Helix-01' : 'Auth_User'}
                      </span>
                    </div>
                    {m.content}
                  </div>
                  <span className="text-[8px] text-gray-600 mt-1 uppercase font-mono">{m.timestamp}</span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-600 font-mono text-[10px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>TRANSMITTING...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[#15171A] border-t border-[#2D3139]">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="EX: Describe incident mitigation flow..."
                  className="w-full bg-[#0B0C0E] border border-[#2D3139] rounded-sm px-4 py-2.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-[#00FFC2]/30 font-mono"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#00FFC2] disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-sm flex items-center justify-center shadow-2xl transition-all duration-300 group relative overflow-hidden border",
          isOpen 
            ? "bg-[#15171A] border-[#2D3139] text-[#00FFC2]" 
            : "bg-[#00FFC2] border-[#00FFC2] text-black hover:scale-105"
        )}
      >
        {isOpen ? (
          <ChatIcon className="w-6 h-6 animate-pulse" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        {!isOpen && (
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        )}
      </button>
    </div>
  );
}
