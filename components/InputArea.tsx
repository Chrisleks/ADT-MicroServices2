
import React, { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';

interface InputAreaProps {
  onSendMessage: (text: string, image?: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to JPEG using Canvas to ensure standard MIME type for Gemini
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            // Force conversion to JPEG to match API expectations
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataUrl.split(',')[1];
            setSelectedImage(base64);
        }
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSend = () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;
    
    onSendMessage(inputText, selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
    setInputText(target.value);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-6 z-20">
      <div className="max-w-3xl mx-auto space-y-3">
        
        {/* Image Preview */}
        {selectedImage && (
          <div className="relative inline-block animate-slide-up">
            <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-300 shadow-md relative group">
              <img 
                src={`data:image/jpeg;base64,${selectedImage}`} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                <button 
                  onClick={removeImage}
                  className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 8.586 5.707 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <span className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 shadow-sm">
              Attached
            </span>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* File Input Trigger */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-1"
            title="Upload math problem photo"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Thinking..." : "Paste your math problem or ask 'Why?'"}
              rows={1}
              className="w-full bg-slate-5 border border-slate-300 rounded-2xl px-5 py-3.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none overflow-hidden min-h-[52px] max-h-[150px] shadow-inner text-sm font-medium"
              disabled={isLoading}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className={`
              p-3.5 rounded-full transition-all duration-200 shadow-lg mb-1
              ${(!inputText.trim() && !selectedImage) || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-95'
              }
            `}
          >
             {isLoading ? (
               <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
             ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
             )}
          </button>
        </div>
      </div>
    </div>
  );
};
