import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { ChatBubble } from './ChatBubble';
import { InputArea } from './InputArea';
import { getMathHelp } from '../services/geminiService';

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm your Socratic Math Tutor. I'm here to help you conquer calculus, algebra, or any math challenge you're facing. Feel free to upload a photo of a problem or type your question. How can I support you today?",
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string, image?: string) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      image
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 2. Call AI Service
    // We pass the previous messages (excluding the new one we just added to state, 
    // but the service logic constructs the full chain)
    const aiText = await getMathHelp(messages, text, image);

    // 3. Add Model Response
    const modelMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiText || "I'm thinking..."
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-slate-50 relative">
       {/* Tutor Header */}
       <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-200">
                🦉
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">AI Math Tutor</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Socratic Mode • Gemini 3 Flash</p>
             </div>
          </div>
          <button 
            onClick={() => setMessages([messages[0]])}
            className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
       </div>

       {/* Messages Area */}
       <div className="flex-1 overflow-y-auto p-4 pb-32">
          <div className="max-w-3xl mx-auto">
             {messages.map((msg) => (
               <ChatBubble key={msg.id} message={msg} />
             ))}
             
             {isLoading && (
               <div className="flex justify-start mb-6 animate-pulse">
                  <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-bl-none shadow-md">
                     <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                        <span className="ml-2">Analyzing problem...</span>
                     </div>
                  </div>
               </div>
             )}
             <div ref={bottomRef} />
          </div>
       </div>

       {/* Input Area */}
       <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default AiTutor;