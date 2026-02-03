import React from 'react';
import { Message } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Safe Markdown rendering
  const renderContent = (text: string) => {
    const rawMarkup = marked.parse(text) as string;
    return { __html: DOMPurify.sanitize(rawMarkup) };
  };
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-slide-up`}>
      <div 
        className={`
          relative max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-base leading-relaxed shadow-sm
          ${isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-md'
          }
        `}
      >
        {/* Image Attachment Display */}
        {message.image && (
          <div className="mb-4 overflow-hidden rounded-lg border border-white/20">
            <img 
              src={`data:image/jpeg;base64,${message.image}`} 
              alt="User upload" 
              className="max-w-full h-auto object-cover max-h-64 rounded-md"
            />
          </div>
        )}

        {/* Text Content */}
        <div className={`prose ${isUser ? 'text-white' : 'text-slate-800'} max-w-none`}>
          <div className="font-medium">
             {message.isThinking ? (
                <div className="flex items-center gap-3 text-slate-500 italic">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </div>
                  <span>Thinking deeply about your question...</span>
                </div>
             ) : (
                <div dangerouslySetInnerHTML={renderContent(message.text)} />
             )}
          </div>
        </div>

        {/* Avatar/Icon Decoration */}
        {!isUser && (
           <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg shadow-sm">
             🦉
           </div>
        )}
      </div>
    </div>
  );
};