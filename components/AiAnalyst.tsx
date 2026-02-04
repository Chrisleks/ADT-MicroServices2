
import React, { useState, useRef, useEffect } from 'react';
import { Loan } from '../types';
import { askPortfolioAssistant } from '../services/geminiService';

interface AiAnalystProps {
  loans: Loan[];
}

const AiAnalyst: React.FC<AiAnalystProps> = ({ loans }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Hello! I am your Portfolio Intelligence Assistant. You can ask me questions about loan performance, specific borrower details, or ask me to draft messages for defaulters. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const aiResponse = await askPortfolioAssistant(userMsg, loans);
    
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse || "Sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
                🤖
            </div>
            <div>
                <h2 className="text-xl font-black text-white tracking-tight">AI Portfolio Analyst</h2>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Powered by Gemini 3 Flash</p>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none font-medium'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            <form onSubmit={handleSend} className="relative">
                <input 
                    type="text" 
                    className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                    placeholder="Ask about arrears, group performance, or draft a letter..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-4 rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ➤
                </button>
            </form>
            <div className="flex gap-2 mt-3 px-2 overflow-x-auto pb-2">
                <SuggestionBtn text="Who are the top defaulters?" onClick={setInput} />
                <SuggestionBtn text="Total portfolio value?" onClick={setInput} />
                <SuggestionBtn text="Summarize Victory Women group" onClick={setInput} />
                <SuggestionBtn text="Draft warning for ID 1003" onClick={setInput} />
            </div>
        </div>
    </div>
  );
};

const SuggestionBtn = ({ text, onClick }: { text: string, onClick: (val: string) => void }) => (
    <button 
        type="button"
        onClick={() => onClick(text)}
        className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-200"
    >
        {text}
    </button>
);

export default AiAnalyst;
