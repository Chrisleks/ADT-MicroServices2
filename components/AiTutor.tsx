
import React, { useState, useRef, useEffect } from 'react';
import { InputArea } from './InputArea';
import { askMathTutor } from '../services/geminiService';
import ReactMarkdown from 'marked'; // Using a simple render approach or just raw text

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string, image?: string}[]>([
    { role: 'model', content: "Hello! I'm your Socratic Math Tutor. Upload a photo of a problem or ask me a question. I'm here to help you learn step-by-step!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, image?: string) => {
    const newMsg = { role: 'user' as const, content: text, image };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    // Convert internal history format if needed, for now we just send the latest prompt
    // In a full implementation, we would send the whole chat history to the API
    const history = messages.map(m => ({ role: m.role, text: m.content }));
    
    const responseText = await askMathTutor(history, text, image);
    
    setMessages(prev => [...prev, { 
      role: 'model', 
      content: responseText || "I'm sorry, I couldn't process that request." 
    }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex items-center gap-4 text-white shadow-md z-10">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl backdrop-blur-sm">
                🎓
            </div>
            <div>
                <h2 className="text-xl font-black tracking-tight">Compassionate Math Tutor</h2>
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Socratic Method • Vision Enabled</p>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 pb-24">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.image && (
                           <div className="w-48 rounded-xl overflow-hidden border-2 border-white shadow-sm mb-1">
                              <img src={`data:image/jpeg;base64,${msg.image}`} alt="User upload" className="w-full h-auto" />
                           </div>
                        )}
                        <div className={`rounded-2xl p-5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none font-medium'
                        }`}>
                            {msg.content}
                        </div>
                    </div>
                </div>
            ))}
            
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-500 animate-pulse">Thinking...</span>
                        <div className="flex gap-1">
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area Component */}
        <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default AiTutor;
