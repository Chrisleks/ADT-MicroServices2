
import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { db } from './services/firebase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChatSystem from './components/ChatSystem';
import BulkMessage from './components/BulkMessage';
import GeneralLedger from './components/GeneralLedger';
import Approvals from './components/Approvals';
import LoanList from './components/LoanList';
import LoanSchedule from './components/LoanSchedule';
import LoanCalculator from './components/LoanCalculator';
import Registration from './components/Registration';
import FieldCollection from './components/FieldCollection';
import FieldRegister from './components/FieldRegister';
import Cashbook from './components/Cashbook';
import SummaryRegister from './components/SummaryRegister';
import CustomerProfiles from './components/CustomerProfiles';
import GroupPortfolio from './components/GroupPortfolio';
import Reports from './components/Reports';
import AuditTrail from './components/AuditTrail';
import Settings from './components/Settings';
import Support from './components/Support';
import AiAnalyst from './components/AiAnalyst';
import { Logo } from './components/Logo';
import { INITIAL_LOANS } from './constants';
import {
  UserRole, SystemUser, Loan, AppNotification, AuditLog, ResetRequest,
  TransactionCategory, ApprovalStatus, ChatMessage
} from './types';

// Mock Initial Data for Authentication Seeding
const INITIAL_USERS: SystemUser[] = [
  { username: 'admin', role: UserRole.MASTER_ADMIN, isActive: true, password: 'password' },
  { username: 'manager', role: UserRole.HOB, isActive: true, password: 'password' },
  { username: 'officer', role: UserRole.FIELD_OFFICER, isActive: true, password: 'password' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  
  // Login State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Recovery State
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Connection States
  const [dbConnected, setDbConnected] = useState(true); // True if Firebase API Key is present
  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine); // True if Browser has Internet

  // Data State
  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications] = useState<AppNotification[]>([]);
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // --- 1. NETWORK LISTENER ---
  useEffect(() => {
    const handleOnline = () => {
        console.log("Network Online");
        setIsNetworkOnline(true);
    };
    const handleOffline = () => {
        console.log("Network Offline");
        setIsNetworkOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- 2. DATA INITIALIZATION (Hybrid: Local First, then Firebase) ---
  useEffect(() => {
    // A. Always load from LocalStorage first (Cache Strategy)
    try {
        const storedLoans = localStorage.getItem('adt_loans');
        const storedUsers = localStorage.getItem('adt_users');
        const storedLogs = localStorage.getItem('adt_logs');
        const storedMsgs = localStorage.getItem('adt_messages');

        if (storedLoans) setLoans(JSON.parse(storedLoans));
        else if (!db) setLoans(INITIAL_LOANS); // Fallback to initial only if no DB

        if (storedUsers) setUsers(JSON.parse(storedUsers));
        else if (!db) setUsers(INITIAL_USERS);

        if (storedLogs) setAuditLogs(JSON.parse(storedLogs));
        
        if (storedMsgs) setMessages(JSON.parse(storedMsgs));

    } catch (e) {
        console.error("Error loading local data:", e);
    }

    // B. If Firebase is available, set up listeners (Sync Strategy)
    if (db) {
        // Loans
        const loansRef = ref(db, 'loans');
        const unsubLoans = onValue(loansRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loanArray = Object.values(data) as Loan[];
                setLoans(loanArray);
            }
        }, (error) => {
            console.error("Firebase Read Error", error);
            // Don't disable dbConnected here, just rely on local data
        });

        // Users
        const usersRef = ref(db, 'system_users');
        const unsubUsers = onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                if (Array.isArray(data)) {
                     setUsers(data);
                } else {
                     setUsers(Object.values(data));
                }
            } else {
                // Seed if empty
                const seedRef = ref(db, 'system_users');
                const userMap = INITIAL_USERS.reduce((acc, user) => ({...acc, [user.username]: user}), {});
                set(seedRef, userMap);
                setUsers(INITIAL_USERS);
                
                // Seed loans if needed
                const loansSeedRef = ref(db, 'loans');
                const loansMap = INITIAL_LOANS.reduce((acc, loan) => ({...acc, [loan.id]: loan}), {});
                set(loansSeedRef, loansMap);
            }
        });

        // Audit Logs
        const logsRef = ref(db, 'audit_logs');
        const unsubLogs = onValue(logsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setAuditLogs(Object.values(data).reverse() as AuditLog[]);
        });

        // Chat
        const chatRef = ref(db, 'chat_messages');
        const unsubChat = onValue(chatRef, (snapshot) => {
            const data = snapshot.val();
            if (data) setMessages(Object.values(data));
        });

        return () => {
            unsubLoans();
            unsubUsers();
            unsubLogs();
            unsubChat();
        };
    } else {
        setDbConnected(false);
        console.log("App running in LOCAL MODE (No Firebase Config)");
    }
  }, []);

  // --- 3. PERSISTENCE (Always backup to LocalStorage) ---
  useEffect(() => {
    localStorage.setItem('adt_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('adt_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('adt_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('adt_messages', JSON.stringify(messages));
  }, [messages]);


  // --- HANDLERS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === loginUser.toLowerCase() && u.password === loginPass);
    if (user) {
      if (!user.isActive) {
        setLoginError('Account disabled. Contact Admin.');
        return;
      }
      setCurrentUser(user);
      setLoginError('');
      // Route based on role
      if (user.role === UserRole.FIELD_OFFICER) setActiveTab('collections');
      else setActiveTab('dashboard');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryUser.trim()) return;

    // Simulate sending email link
    setTimeout(() => {
        setRecoverySuccess(true);
        // In background, log a request for admin just in case
        const request: ResetRequest = {
            id: `RST-${Date.now()}`,
            timestamp: new Date().toISOString(),
            username: recoveryUser,
            phone: 'Email-Link-Request',
            newPassword: 'USER-INITIATED',
            status: 'Pending'
        };
        // Update local requests state specifically for this session logic, though normally synced with DB
        setRequests(prev => [...prev, request]);
    }, 1500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUser('');
    setLoginPass('');
    setActiveTab('dashboard');
    setIsForgotPassword(false);
    setRecoverySuccess(false);
    setRecoveryUser('');
  };

  const addAuditLog = (action: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      actor: currentUser?.username || 'System',
      role: currentUser?.role || 'System',
      action,
      details,
      severity
    };
    
    // Always update local state immediately
    if (!db) {
        setAuditLogs(prev => [newLog, ...prev]);
    } else {
        push(ref(db, 'audit_logs'), newLog);
    }
  };

  // Data Update Handlers
  const handleAddLoan = (loan: Loan) => {
    if (!db) {
        setLoans(prev => [...prev, loan]);
    } else {
        // Firebase handles offline queuing automatically
        set(ref(db, `loans/${loan.id}`), loan);
    }
    addAuditLog('Create Loan', `Registered new loan for ${loan.borrowerName} (ID: ${loan.id})`, 'INFO');
  };

  const handleUpdateLoan = (updatedLoan: Loan) => {
    if (!db) {
        setLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
    } else {
        update(ref(db, `loans/${updatedLoan.id}`), updatedLoan);
    }
    addAuditLog('Update Loan', `Updated profile for ${updatedLoan.borrowerName}`, 'INFO');
  };

  const handleDeleteLoan = (id: string) => {
    if (!db) {
        setLoans(prev => prev.filter(l => l.id !== id));
    } else {
        remove(ref(db, `loans/${id}`));
    }
    addAuditLog('Delete Loan', `Deleted loan record ID: ${id}`, 'CRITICAL');
  };

  const handleTransaction = (loanId: string, category: TransactionCategory, direction: 'In' | 'Out', amount: number, notes: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    // Check for approval if needed (Outbound)
    if (direction === 'Out' && (category === 'Savings' || category === 'Adashe')) {
        const request: any = {
            id: `REQ-${Date.now()}`,
            loanId,
            borrowerName: loan.borrowerName,
            amount,
            category,
            status: ApprovalStatus.PENDING_BDM,
            loanGroup: loan.groupName
        };
        
        const updatedLoan = { ...loan, pendingRequests: [...(loan.pendingRequests || []), request] };
        
        if (!db) {
            setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
        } else {
            update(ref(db, `loans/${loanId}`), updatedLoan);
        }
        addAuditLog('Request Withdrawal', `Requested ${category} withdrawal of ${amount} for ${loan.borrowerName}`, 'WARNING');
        return;
    }

    const newPayment = {
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category,
        direction,
        amount,
        notes
    };

    let updatedSavings = loan.savingsBalance;
    let updatedAdashe = loan.adasheBalance;

    if (category === 'Savings') updatedSavings += (direction === 'In' ? amount : -amount);
    if (category === 'Adashe') updatedAdashe += (direction === 'In' ? amount : -amount);

    const updatedLoan = { 
      ...loan, 
      payments: [...(loan.payments || []), newPayment],
      savingsBalance: updatedSavings,
      adasheBalance: updatedAdashe
    };
    
    if (!db) {
        setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    } else {
        update(ref(db, `loans/${loanId}`), updatedLoan);
    }
    addAuditLog('Post Transaction', `Posted ${direction} ${category} of ${amount} for ${loan.borrowerName}`, 'INFO');
  };

  const handleDeleteTransaction = (loanId: string, txnId: string) => {
      const loan = loans.find(l => l.id === loanId);
      if(!loan) return;
      const txn = (loan.payments || []).find(p => p.id === txnId);
      if(!txn) return;

      let updatedSavings = loan.savingsBalance;
      let updatedAdashe = loan.adasheBalance;

      if (txn.category === 'Savings') {
          updatedSavings -= (txn.direction === 'In' ? txn.amount : -txn.amount);
      } else if (txn.category === 'Adashe') {
          updatedAdashe -= (txn.direction === 'In' ? txn.amount : -txn.amount);
      }

      const updatedPayments = (loan.payments || []).filter(p => p.id !== txnId);

      const updatedLoan = {
          ...loan,
          payments: updatedPayments,
          savingsBalance: updatedSavings,
          adasheBalance: updatedAdashe
      };
      
      if (!db) {
          setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
      } else {
          update(ref(db, `loans/${loanId}`), updatedLoan);
      }
      addAuditLog('Delete Transaction', `Reversed ${txn.category} transaction ${txnId} for ${loan.borrowerName}`, 'WARNING');
  };

  const handleApproveLoan = (loanId: string, currentStatus: ApprovalStatus) => {
      let nextStatus = currentStatus;
      if (currentStatus === ApprovalStatus.PENDING_BDM) nextStatus = ApprovalStatus.PENDING_SFO;
      else if (currentStatus === ApprovalStatus.PENDING_SFO) nextStatus = ApprovalStatus.PENDING_HOB;
      else if (currentStatus === ApprovalStatus.PENDING_HOB) nextStatus = ApprovalStatus.APPROVED;

      const finalUpdates = nextStatus === ApprovalStatus.APPROVED 
        ? { disbursementStatus: nextStatus, status: 'Current' }
        : { disbursementStatus: nextStatus };

      if (!db) {
          setLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...finalUpdates } as Loan : l));
      } else {
          update(ref(db, `loans/${loanId}`), finalUpdates);
      }
      addAuditLog('Approve Loan', `Advanced loan ${loanId} to ${nextStatus}`, 'INFO');
  };

  const handleRejectLoan = (loanId: string) => {
      if (!db) {
          setLoans(prev => prev.map(l => l.id === loanId ? { ...l, disbursementStatus: ApprovalStatus.REJECTED } as Loan : l));
      } else {
          update(ref(db, `loans/${loanId}`), { disbursementStatus: ApprovalStatus.REJECTED });
      }
      addAuditLog('Reject Loan', `Rejected loan application ${loanId}`, 'WARNING');
  };

  const handleApproveTransaction = (loanId: string, reqId: string, currentStatus: ApprovalStatus) => {
      let nextStatus = currentStatus;
      if (currentStatus === ApprovalStatus.PENDING_BDM) nextStatus = ApprovalStatus.PENDING_SFO;
      else if (currentStatus === ApprovalStatus.PENDING_SFO) nextStatus = ApprovalStatus.PENDING_HOB;
      else if (currentStatus === ApprovalStatus.PENDING_HOB) nextStatus = ApprovalStatus.APPROVED;

      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;

      if (nextStatus === ApprovalStatus.APPROVED) {
          // Execute Withdrawal
          const req = (loan.pendingRequests || []).find(r => r.id === reqId);
          if (req) {
              const newPayment = {
                id: `TXN-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                category: req.category,
                direction: 'Out' as const,
                amount: req.amount,
                notes: 'Approved Withdrawal'
              };
              
              let updatedSavings = loan.savingsBalance;
              let updatedAdashe = loan.adasheBalance;
              if (req.category === 'Savings') updatedSavings -= req.amount;
              if (req.category === 'Adashe') updatedAdashe -= req.amount;

              const remainingRequests = (loan.pendingRequests || []).filter(r => r.id !== reqId);

              const updatedLoan = {
                ...loan,
                payments: [...(loan.payments || []), newPayment],
                savingsBalance: updatedSavings,
                adasheBalance: updatedAdashe,
                pendingRequests: remainingRequests
              };
              
              if (!db) {
                  setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
              } else {
                  update(ref(db, `loans/${loanId}`), updatedLoan);
              }
              addAuditLog('Approve Withdrawal', `Final approval for ${req.category} withdrawal of ${req.amount}`, 'INFO');
              return;
          }
      } 

      // Just update status
      const updatedRequests = (loan.pendingRequests || []).map(r => r.id === reqId ? { ...r, status: nextStatus } : r);
      if (!db) {
          setLoans(prev => prev.map(l => l.id === loanId ? { ...l, pendingRequests: updatedRequests } : l));
      } else {
          update(ref(db, `loans/${loanId}`), { pendingRequests: updatedRequests });
      }
      addAuditLog('Approve Step', `Advanced transaction request ${reqId} to ${nextStatus}`, 'INFO');
  };

  const handleRejectTransaction = (loanId: string, reqId: string) => {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;
      
      const updatedRequests = (loan.pendingRequests || []).map(r => r.id === reqId ? { ...r, status: ApprovalStatus.REJECTED } : r);
      
      if (!db) {
          setLoans(prev => prev.map(l => l.id === loanId ? { ...l, pendingRequests: updatedRequests } : l));
      } else {
          update(ref(db, `loans/${loanId}`), { pendingRequests: updatedRequests });
      }
      addAuditLog('Reject Withdrawal', `Rejected transaction request ${reqId}`, 'WARNING');
  };

  // User Management
  const handleAddUser = (user: SystemUser) => {
      if (!db) {
          setUsers(prev => [...prev, user]);
      } else {
          set(ref(db, `system_users/${user.username}`), user);
      }
      addAuditLog('Create User', `Created user ${user.username}`, 'CRITICAL');
  };

  const handleDeleteUser = (username: string) => {
      if (!db) {
          setUsers(prev => prev.filter(u => u.username !== username));
      } else {
          remove(ref(db, `system_users/${username}`));
      }
      addAuditLog('Delete User', `Deleted user ${username}`, 'CRITICAL');
  };

  const handleUpdateUserRole = (username: string, role: UserRole) => {
      if (!db) {
          setUsers(prev => prev.map(u => u.username === username ? { ...u, role } : u));
      } else {
          update(ref(db, `system_users/${username}`), { role });
      }
      addAuditLog('Update Role', `Changed role for ${username} to ${role}`, 'CRITICAL');
  };

  const handleChangeOwnPassword = (username: string, oldPass: string, newPass: string) => {
      const user = users.find(u => u.username === username);
      if (!user) return alert("User not found.");
      if (user.password !== oldPass) return alert("Incorrect current password.");

      if (!db) {
          setUsers(prev => prev.map(u => u.username === username ? { ...u, password: newPass } : u));
      } else {
          update(ref(db, `system_users/${username}`), { password: newPass });
      }
      addAuditLog('Password Change', `User ${username} changed their own password`, 'INFO');
      alert("Password updated successfully!");
  };

  // Chat
  const handleSendMessage = (content: string, channel: string) => {
      const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: currentUser!.username,
          role: currentUser!.role,
          content,
          timestamp: new Date().toISOString(),
          channel
      };
      if (!db) {
          setMessages(prev => [...prev, msg]);
      } else {
          push(ref(db, 'chat_messages'), msg);
      }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 selection:bg-indigo-500 selection:text-white">
        
        {/* Professional Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-slow mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-600/10 blur-[120px] animate-pulse-slow delay-700 mix-blend-screen"></div>
            <div className="absolute top-[40%] left-[40%] w-[20vw] h-[20vw] rounded-full bg-rose-500/10 blur-[100px] animate-float"></div>
        </div>

        {/* Login Container */}
        <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
            <div className="relative group">
                {/* Glow Effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-teal-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    
                    {/* Header Brand */}
                    <div className="pt-12 pb-8 px-10 text-center border-b border-white/5 bg-white/5 relative">
                        <div className="w-24 h-24 mx-auto mb-6 relative group-hover:scale-105 transition-transform duration-500">
                           <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full"></div>
                           <Logo />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase letter-spacing-wide">
                          TEKAN Peace Desk
                        </h1>
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em] mt-2 opacity-80">
                          AWAKE DIGITAL TRANSACTION
                        </p>
                    </div>
                    
                    <div className="p-10 bg-gradient-to-b from-transparent to-black/20">
                        {!isForgotPassword ? (
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="group relative">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 group-focus-within:text-indigo-400 transition-colors">Access ID</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                                                placeholder="Username"
                                                value={loginUser}
                                                onChange={e => setLoginUser(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="group relative">
                                        <div className="flex justify-between items-center mb-1.5 ml-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-indigo-400 transition-colors">Password</label>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <input 
                                                type="password" 
                                                className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                                                placeholder="••••••••"
                                                value={loginPass}
                                                onChange={e => setLoginPass(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center animate-shake">
                                        <p className="text-xs font-bold text-rose-400">{loginError}</p>
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    <button 
                                        type="submit" 
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-indigo-900/30 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 group/btn"
                                    >
                                        <span>Authenticate</span>
                                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                    
                                    <div className="flex justify-between items-center px-1">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsForgotPassword(true)}
                                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-wide"
                                        >
                                            Forgot Password?
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-600">v2.4.0</span>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-6 animate-fade-in">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400 text-xl">
                                        🔐
                                    </div>
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wider">Account Recovery</h3>
                                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">Enter your registered Access ID to receive reset instructions via secure channel.</p>
                                </div>

                                {!recoverySuccess ? (
                                    <>
                                        <div className="group relative">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block ml-1 group-focus-within:text-emerald-400 transition-colors">Access ID</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <svg className="h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-700/50 rounded-xl text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
                                                    placeholder="Enter ID"
                                                    value={recoveryUser}
                                                    onChange={e => setRecoveryUser(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={!recoveryUser}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/30 transition-all transform active:scale-[0.98]"
                                        >
                                            Initiate Reset
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                        <p className="text-emerald-400 text-xs font-bold leading-relaxed">
                                            If the ID <span className="text-white underline">{recoveryUser}</span> exists, a secure link has been dispatched to the registered contact.
                                        </p>
                                    </div>
                                )}

                                <button 
                                    type="button"
                                    onClick={() => { setIsForgotPassword(false); setRecoverySuccess(false); setRecoveryUser(''); }}
                                    className="w-full py-3 text-slate-500 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>←</span> Return to Login
                                </button>
                            </form>
                        )}
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-black/30 p-4 text-center border-t border-white/5">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                            Authorized Personnel Only
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      role={currentUser.role} 
      onLogout={handleLogout}
      notifications={notifications}
    >
       {activeTab === 'dashboard' && <Dashboard loans={loans} onNavigate={setActiveTab} />}
       {activeTab === 'portfolio' && <LoanList loans={loans} onDelete={currentUser.role === UserRole.MASTER_ADMIN ? handleDeleteLoan : undefined} />}
       {activeTab === 'registration' && (
         <Registration 
           loans={loans} 
           onAddLoan={handleAddLoan} 
           existingGroups={Array.from(new Set(loans.map(l => l.groupName)))} 
           existingOfficers={Array.from(new Set(loans.map(l => l.creditOfficer)))} 
         />
       )}
       {activeTab === 'collections' && (
         <FieldCollection 
           loans={loans} 
           onTransaction={handleTransaction} 
           currentUser={currentUser}
           isOnline={dbConnected && isNetworkOnline}
           onManualSync={() => {}}
         />
       )}
       {activeTab === 'register_sheet' && <FieldRegister loans={loans} />}
       {activeTab === 'reports' && <Reports loans={loans} />}
       {activeTab === 'cashbook' && <Cashbook loans={loans} />}
       {activeTab === 'summary' && <SummaryRegister loans={loans} />}
       {activeTab === 'profiles' && (
         <CustomerProfiles 
            loans={loans} 
            onUpdateLoan={handleUpdateLoan} 
            onDeleteLoan={currentUser.role === UserRole.MASTER_ADMIN ? handleDeleteLoan : () => alert('Permission Denied')}
            onDeleteTransaction={handleDeleteTransaction}
         />
       )}
       {activeTab === 'groups' && <GroupPortfolio loans={loans} />}
       {activeTab === 'approvals' && (
         <Approvals 
            loans={loans} 
            role={currentUser.role} 
            onApproveLoan={handleApproveLoan} 
            onRejectLoan={handleRejectLoan}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
         />
       )}
       {activeTab === 'chat' && (
         <ChatSystem 
            currentUser={currentUser} 
            allUsers={users} 
            messages={messages} 
            onSendMessage={handleSendMessage} 
         />
       )}
       {activeTab === 'ai_analyst' && <AiAnalyst loans={loans} />}
       {activeTab === 'schedules' && <LoanSchedule loans={loans} />}
       {activeTab === 'communication' && <BulkMessage loans={loans} />}
       {activeTab === 'ledger' && <GeneralLedger loans={loans} />}
       {activeTab === 'calculator' && <LoanCalculator />}
       {activeTab === 'audit_trail' && <AuditTrail logs={auditLogs} />}
       {activeTab === 'settings' && (
         <Settings 
            currentUser={currentUser}
            users={users} 
            requests={requests} 
            loans={loans}
            auditLogs={auditLogs}
            onAddUser={handleAddUser} 
            onDeleteUser={handleDeleteUser}
            onApproveRequest={() => {}} 
            onRejectRequest={() => {}}
            onResetUserPassword={() => {}}
            onUpdateUserRole={handleUpdateUserRole}
            onDeleteLoan={handleDeleteLoan}
            onChangeOwnPassword={handleChangeOwnPassword}
         />
       )}
       {activeTab === 'support' && <Support />}
    </Layout>
  );
};

export default App;
