
import React, { useState, useEffect, useRef } from 'react';
import { SystemUser, ChatMessage, UserRole } from '../types';
import { sanitizeInput } from '../utils/security';

interface ChatSystemProps {
  currentUser: { username: string; role: UserRole };
  allUsers: SystemUser[];
  messages: ChatMessage[];
  onSendMessage: (content: string, channel: string) => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ currentUser, allUsers, messages, onSendMessage }) => {
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for current view
  const displayMessages = messages.filter(msg => {
    if (activeChannel === 'general') {
      return msg.channel === 'general';
    } else {
      // Direct Message Logic: Show if sender is me AND receiver is activeChannel, OR sender is activeChannel AND receiver is me
      // In our simplified model, the 'channel' field in the message stores the Target (general) or the Pair ID.
      // To keep it simple: if channel is not general, it implies a DM context.
      // Let's interpret 'channel' in DB as: 'general' OR 'dm-user1-user2' (sorted alphabetically)
      
      const pairId = [currentUser.username, activeChannel].sort().join('-');
      return msg.channel === pairId;
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, activeChannel]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    let targetChannel = 'general';
    if (activeChannel !== 'general') {
       // It's a DM, create consistent Pair ID
       targetChannel = [currentUser.username, activeChannel].sort().join('-');
    }

    // SECURITY: Sanitize message to prevent XSS in chat
    const safeMessage = sanitizeInput(newMessage);

    onSendMessage(safeMessage, targetChannel);
    setNewMessage('');
  };

  // Helper to format time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper for role colors
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.MASTER_ADMIN: return 'text-purple-600 bg-purple-50 border-purple-100';
      case UserRole.BDM: return 'text-blue-600 bg-blue-50 border-blue-100';
      case UserRole.SFO: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
      
      {/* Sidebar: Channels & Users */}
      <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
           <h2 className="text-xl font-black text-slate-800 tracking-tight">Team Chat</h2>
           <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online as {currentUser.username}</span>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           {/* Channels */}
           <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Channels</h3>
              <button 
                onClick={() => setActiveChannel('general')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  activeChannel === 'general' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">📢</span>
                <span className="font-bold text-sm">General Room</span>
              </button>
           </div>

           {/* Direct Messages */}
           <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Direct Messages</h3>
              <div className="space-y-1">
                 {allUsers.filter(u => u.username !== currentUser.username).map(user => {
                   const isActive = activeChannel === user.username;
                   return (
                     <button
                       key={user.username}
                       onClick={() => setActiveChannel(user.username)}
                       className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                         isActive ? 'bg-white shadow-md border border-slate-100' : 'text-slate-600 hover:bg-slate-100'
                       }`}
                     >
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase ${
                         user.role === UserRole.MASTER_ADMIN ? 'bg-purple-500' : 'bg-slate-400'
                       }`}>
                         {user.username.charAt(0)}
                       </div>
                       <div className="text-left leading-tight">
                          <div className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                            {user.username}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase truncate w-32">{user.role}</div>
                       </div>
                     </button>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm relative z-10">
           <div className="flex items-center gap-3">
              <span className="text-2xl">{activeChannel === 'general' ? '📢' : '💬'}</span>
              <div>
                 <h3 className="font-black text-slate-800 text-lg capitalize">
                    {activeChannel === 'general' ? 'General Room' : activeChannel}
                 </h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {activeChannel === 'general' ? 'Company-wide announcements' : 'Private Conversation'}
                 </p>
              </div>
           </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
           {displayMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <span className="text-6xl mb-4">💭</span>
                <p className="font-bold text-sm uppercase tracking-widest">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
             </div>
           ) : (
             displayMessages.map((msg, idx) => {
               const isMe = msg.sender === currentUser.username;
               const showHeader = idx === 0 || displayMessages[idx - 1].sender !== msg.sender || (new Date(msg.timestamp).getTime() - new Date(displayMessages[idx - 1].timestamp).getTime() > 300000); // 5 min gap

               return (
                 <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {showHeader && !isMe && (
                       <div className="flex items-center gap-2 mb-1 ml-1">
                          <span className="text-xs font-black text-slate-700 capitalize">{msg.sender}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${getRoleColor(msg.role)}`}>
                             {msg.role}
                          </span>
                       </div>
                    )}

                    <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-5 py-3 shadow-sm relative text-sm leading-relaxed ${
                       isMe 
                       ? 'bg-blue-600 text-white rounded-tr-none' 
                       : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                    }`}>
                       {msg.content}
                       <div className={`text-[9px] font-bold mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-300'}`}>
                          {formatTime(msg.timestamp)}
                       </div>
                    </div>
                 </div>
               );
             })
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
           <form onSubmit={handleSend} className="flex items-center gap-3">
              <input 
                type="text" 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder={`Message ${activeChannel === 'general' ? '#general' : '@' + activeChannel}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95"
              >
                Send
              </button>
           </form>
        </div>

      </div>
    </div>
  );
};

export default ChatSystem;
