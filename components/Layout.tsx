import React, { useState } from 'react';
import { UserRole, AppNotification } from '../types';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  onLogout: () => void;
  notifications?: AppNotification[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, role, onLogout, notifications = [] }) => {
  const [copied, setCopied] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'ai_tutor', label: 'AI Math Tutor', icon: '🦉', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR, UserRole.ENCODER] },
    { id: 'chat', label: 'Team Chat', icon: '💬', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ENCODER, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'communication', label: 'Communication', icon: '📡', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.FIELD_OFFICER] },
    { id: 'ledger', label: 'General Ledger', icon: '📒', roles: [UserRole.MASTER_ADMIN, UserRole.HOB, UserRole.SFO, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'approvals', label: 'Approvals', icon: '✅', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO] },
    { id: 'portfolio', label: 'Portfolio', icon: '🏦', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ENCODER, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'schedules', label: 'Amortization', icon: '🗓️', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'calculator', label: 'Simulator', icon: '🧮', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.FIELD_OFFICER] },
    { id: 'registration', label: 'Registration', icon: '➕', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ENCODER, UserRole.FIELD_OFFICER] },
    { id: 'collections', label: 'Field Collection', icon: '📋', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ENCODER, UserRole.FIELD_OFFICER] },
    { id: 'register_sheet', label: 'ADT Sheet', icon: '📄', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ENCODER, UserRole.FIELD_OFFICER, UserRole.AUDITOR] },
    { id: 'cashbook', label: 'Cashbook', icon: '📖', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'summary', label: 'Summary Register', icon: '📅', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'profiles', label: 'Profiles', icon: '👤', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ENCODER, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'groups', label: 'Groups', icon: '🏘️', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'reports', label: 'Reports', icon: '📈', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.ACCOUNTANT, UserRole.AUDITOR] },
    { id: 'audit_trail', label: 'Audit Trail', icon: '📜', roles: [UserRole.MASTER_ADMIN, UserRole.AUDITOR] },
    { id: 'settings', label: 'Admin Settings', icon: '⚙️', roles: [UserRole.MASTER_ADMIN] },
    { id: 'support', label: 'Help & Support', icon: '❓', roles: [UserRole.MASTER_ADMIN, UserRole.BDM, UserRole.HOB, UserRole.SFO, UserRole.FIELD_OFFICER, UserRole.ACCOUNTANT, UserRole.AUDITOR, UserRole.ENCODER] },
  ];

  const handleCopyKey = async () => {
    const key = process.env.API_KEY;
    if (key) {
      try {
        await navigator.clipboard.writeText(key);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false));
      }
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false); 
  };

  const handleNotificationClick = (link?: string) => {
    if (link) {
      setActiveTab(link);
      setShowNotifications(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-3 flex justify-between items-center sticky top-0 z-30 shadow-lg border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8"><Logo /></div>
          <div className="leading-tight">
            <h1 className="font-black text-xs tracking-tight">TEKAN PEACE DESK</h1>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{role}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
            <button className="relative p-1" onClick={() => setShowNotifications(!showNotifications)}>
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>}
            </button>
            <button onClick={toggleMobileMenu} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
              <span className="text-xl font-bold">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-[#020617] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out shadow-2xl border-r border-slate-800 print:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:sticky md:top-0
      `}>
        <div className="p-4 border-b border-white/5 relative overflow-visible z-50">
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2">
              <Logo className="w-24 h-24" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400 drop-shadow-sm text-center">TEKAN PEACE DESK</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest text-center">{role}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 relative z-10 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {navItems.filter(i => i.roles.includes(role)).map(item => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-[10px] font-black uppercase rounded-xl transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'text-white shadow-[0_10px_20px_-5px_rgba(147,51,234,0.3)]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-teal-600 opacity-100"></div>
              )}
              
              <span className="relative z-10 mr-3 text-base filter drop-shadow-md group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="relative z-10 tracking-wide">{item.label}</span>
              
              {activeTab === item.id && (
                 <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse z-10"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5 bg-black/20 space-y-2 relative z-10">
          <button onClick={handleCopyKey} className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase rounded-xl transition-all border border-transparent ${copied ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20'}`}>
            {copied ? '✅ Key Copied!' : '🔑 Copy API Key'}
          </button>
          <button onClick={onLogout} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-colors border border-transparent hover:border-rose-500/20">
            🚪 Logout Session
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/50 w-full relative">
        
        {/* TOP COMMAND BAR (Desktop Only) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
           {/* Global Search Simulation */}
           <div className="relative group">
              <div className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">🔍</div>
              <input 
                type="text" 
                placeholder="Search system..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-700 w-64 focus:w-80 transition-all focus:ring-2 focus:ring-blue-100 outline-none placeholder-slate-400"
              />
           </div>

           <div className="flex items-center gap-6">
              <button 
                onClick={toggleFullScreen} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Toggle Fullscreen"
              >
                 {isFullScreen ? '↙️' : '↗️'}
              </button>

              {/* Notification Center */}
              <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-xl transition-all ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                 >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                       <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
                    )}
                 </button>

                 {/* Dropdown */}
                 {showNotifications && (
                    <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up origin-top-right z-50">
                       <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Notifications</h4>
                          {unreadCount > 0 && <span className="bg-rose-100 text-rose-600 text-[9px] font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                             <div className="p-8 text-center text-slate-400 text-xs italic">All caught up! No new alerts.</div>
                          ) : (
                             notifications.map(note => (
                                <div 
                                   key={note.id} 
                                   onClick={() => handleNotificationClick(note.link)}
                                   className={`p-4 border-b border-slate-50 hover:bg-blue-50 transition-colors cursor-pointer group ${!note.read ? 'bg-white' : 'bg-slate-50/50'}`}
                                >
                                   <div className="flex gap-3">
                                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                         note.type === 'alert' ? 'bg-rose-500' : 
                                         note.type === 'warning' ? 'bg-amber-500' : 
                                         note.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                                      }`}></div>
                                      <div>
                                         <h5 className={`text-xs font-bold leading-tight ${!note.read ? 'text-slate-800' : 'text-slate-500'}`}>{note.title}</h5>
                                         <p className="text-[10px] text-slate-500 mt-1 leading-relaxed group-hover:text-blue-600 transition-colors">{note.message}</p>
                                         <span className="text-[9px] text-slate-300 font-medium mt-2 block">{new Date(note.timestamp).toLocaleTimeString()}</span>
                                      </div>
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                       <div className="p-2 bg-slate-50 text-center border-t border-slate-100">
                          <button className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Mark all as read</button>
                       </div>
                    </div>
                 )}
              </div>

              {/* User Profile Snippet */}
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                 <div className="text-right hidden xl:block">
                    <div className="text-xs font-black text-slate-800">Admin User</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{role}</div>
                 </div>
                 <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-500/20">
                    {role.charAt(0)}
                 </div>
              </div>
           </div>
        </header>

        {/* Mobile Notification Dropdown (Separate) */}
        {showNotifications && (
            <div className="md:hidden absolute top-[60px] left-0 right-0 z-20 bg-white border-b border-slate-200 shadow-xl p-4 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-slate-800 uppercase text-xs">Alerts Center</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400">✕</button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {notifications.map(note => (
                        <div key={note.id} onClick={() => handleNotificationClick(note.link)} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="font-bold text-xs text-slate-800">{note.title}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{note.message}</div>
                        </div>
                    ))}
                    {notifications.length === 0 && <div className="text-center text-xs text-slate-400 py-4">No new notifications</div>}
                </div>
            </div>
        )}

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;