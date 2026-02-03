import React, { useState, useEffect } from 'react';
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
import { Logo } from './components/Logo';
import { db } from './services/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import {
  UserRole, SystemUser, Loan, AppNotification, AuditLog, ResetRequest,
  TransactionCategory, ApprovalStatus, ChatMessage, Payment
} from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isLoading, setIsLoading] = useState(true);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications] = useState<AppNotification[]>([]);
  const [requests] = useState<ResetRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const loansRef = ref(db, 'loans');
    const usersRef = ref(db, 'users');
    const auditRef = ref(db, 'audit_logs');
    const messagesRef = ref(db, 'messages');

    onValue(loansRef, (snapshot) => {
      const data = snapshot.val();
      const loadedLoans: Loan[] = data ? Object.values(data) : [];
      setLoans(loadedLoans);
    });

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const loadedUsers: SystemUser[] = data ? Object.values(data) : [];
      setUsers(loadedUsers);
      setIsLoading(false);
    });
    
    onValue(auditRef, (snapshot) => {
        const data = snapshot.val();
        const loadedLogs: AuditLog[] = data ? Object.values(data) : [];
        setAuditLogs(loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        const loadedMessages: ChatMessage[] = data ? Object.values(data) : [];
        setMessages(loadedMessages);
    });

  }, []);

  const addAuditLog = (action: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL') => {
    const newLogRef = ref(db, `audit_logs/${Date.now()}`);
    set(newLogRef, {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      actor: currentUser?.username || 'System',
      role: currentUser?.role || 'System',
      action,
      details,
      severity
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const user = users.find(u => u.username.toLowerCase() === loginUser.toLowerCase() && u.password === loginPass);
    if (user) {
      if (!user.isActive) {
        setLoginError('Account disabled. Contact Admin.');
        return;
      }
      setCurrentUser(user);
      setLoginError('');
      if (user.role === UserRole.FIELD_OFFICER) setActiveTab('collections');
      else setActiveTab('dashboard');
      addAuditLog('User Login', `User ${user.username} logged in successfully.`, 'INFO');
    } else {
      setLoginError('Invalid credentials');
      addAuditLog('Login Failed', `Failed login attempt for username: ${loginUser}.`, 'WARNING');
    }
  };

  const handleLogout = () => {
    addAuditLog('User Logout', `User ${currentUser?.username} logged out.`, 'INFO');
    setCurrentUser(null);
    setLoginUser('');
    setLoginPass('');
    setActiveTab('dashboard');
  };

  const handleAddLoan = (loan: Loan) => {
    const loanRef = ref(db, `loans/${loan.id}`);
    set(loanRef, loan);
    addAuditLog('Create Loan', `Registered new loan for ${loan.borrowerName} (ID: ${loan.id})`, 'INFO');
  };

  const handleUpdateLoan = (updatedLoan: Loan) => {
    const loanRef = ref(db, `loans/${updatedLoan.id}`);
    set(loanRef, updatedLoan);
    addAuditLog('Update Loan', `Updated profile for ${updatedLoan.borrowerName}`, 'INFO');
  };

  const handleDeleteLoan = (id: string) => {
    const loanRef = ref(db, `loans/${id}`);
    remove(loanRef);
    addAuditLog('Delete Loan', `Deleted loan record ID: ${id}`, 'CRITICAL');
  };
  
  const handleTransaction = (loanId: string, category: TransactionCategory, direction: 'In' | 'Out', amount: number, notes: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (direction === 'Out' && (category === 'Savings' || category === 'Adashe')) {
        const reqId = `REQ-${Date.now()}`;
        const request: any = { id: reqId, loanId, borrowerName: loan.borrowerName, amount, category, status: ApprovalStatus.PENDING_BDM, loanGroup: loan.groupName };
        const updatedRequests = [...(loan.pendingRequests || []), request];
        const reqRef = ref(db, `loans/${loanId}/pendingRequests`);
        set(reqRef, updatedRequests);
        addAuditLog('Request Withdrawal', `Requested ${category} withdrawal of ${amount} for ${loan.borrowerName}`, 'WARNING');
        return;
    }

    const newPayment: Payment = { id: `TXN-${Date.now()}`, date: new Date().toISOString().split('T')[0], category, direction, amount, notes };
    
    const updatedPayments = [...(loan.payments || []), newPayment];
    let updatedSavings = loan.savingsBalance;
    let updatedAdashe = loan.adasheBalance;

    if (category === 'Savings') updatedSavings += (direction === 'In' ? amount : -amount);
    if (category === 'Adashe') updatedAdashe += (direction === 'In' ? amount : -amount);
    
    const loanRef = ref(db, `loans/${loanId}`);
    update(loanRef, {
      payments: updatedPayments,
      savingsBalance: updatedSavings,
      adasheBalance: updatedAdashe,
    });
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
      
      const loanRef = ref(db, `loans/${loanId}`);
      update(loanRef, {
        payments: updatedPayments,
        savingsBalance: updatedSavings,
        adasheBalance: updatedAdashe
      });
      
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
    
    const loanRef = ref(db, `loans/${loanId}`);
    update(loanRef, finalUpdates);
    addAuditLog('Approve Loan', `Advanced loan ${loanId} to ${nextStatus}`, 'INFO');
  };

  const handleRejectLoan = (loanId: string) => {
      const loanRef = ref(db, `loans/${loanId}/disbursementStatus`);
      set(loanRef, ApprovalStatus.REJECTED);
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
          const req = (loan.pendingRequests || []).find(r => r.id === reqId);
          if (req) {
              const newPayment: Payment = { id: `TXN-${Date.now()}`, date: new Date().toISOString().split('T')[0], category: req.category, direction: 'Out', amount: req.amount, notes: 'Approved Withdrawal' };
              
              let updatedSavings = loan.savingsBalance;
              let updatedAdashe = loan.adasheBalance;
              if (req.category === 'Savings') updatedSavings -= req.amount;
              if (req.category === 'Adashe') updatedAdashe -= req.amount;

              const remainingRequests = (loan.pendingRequests || []).filter(r => r.id !== reqId);

              const loanRef = ref(db, `loans/${loanId}`);
              update(loanRef, {
                payments: [...(loan.payments || []), newPayment],
                savingsBalance: updatedSavings,
                adasheBalance: updatedAdashe,
                pendingRequests: remainingRequests
              });
              addAuditLog('Approve Withdrawal', `Final approval for ${req.category} withdrawal of ${req.amount}`, 'INFO');
          }
      } else {
        const updatedRequests = (loan.pendingRequests || []).map(r => r.id === reqId ? { ...r, status: nextStatus } : r);
        const reqRef = ref(db, `loans/${loanId}/pendingRequests`);
        set(reqRef, updatedRequests);
        addAuditLog('Approve Step', `Advanced transaction request ${reqId} to ${nextStatus}`, 'INFO');
      }
  };

  const handleRejectTransaction = (loanId: string, reqId: string) => {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) return;
      const updatedRequests = (loan.pendingRequests || []).map(r => r.id === reqId ? { ...r, status: ApprovalStatus.REJECTED } : r);
      const reqRef = ref(db, `loans/${loanId}/pendingRequests`);
      set(reqRef, updatedRequests);
      addAuditLog('Reject Withdrawal', `Rejected transaction request ${reqId}`, 'WARNING');
  };

  // User Management
  const handleAddUser = (user: SystemUser) => {
      const userRef = ref(db, `users/${user.username}`);
      set(userRef, user);
      addAuditLog('Create User', `Created user ${user.username}`, 'CRITICAL');
  };

  const handleDeleteUser = (username: string) => {
      const userRef = ref(db, `users/${username}`);
      remove(userRef);
      addAuditLog('Delete User', `Deleted user ${username}`, 'CRITICAL');
  };

  const handleUpdateUserRole = (username: string, role: UserRole) => {
      const roleRef = ref(db, `users/${username}/role`);
      set(roleRef, role);
      addAuditLog('Update Role', `Changed role for ${username} to ${role}`, 'CRITICAL');
  };

  // Chat
  const handleSendMessage = (content: string, channel: string) => {
      const msgRef = ref(db, `messages/${Date.now()}`);
      set(msgRef, {
          id: Date.now().toString(),
          sender: currentUser!.username,
          role: currentUser!.role,
          content,
          timestamp: new Date().toISOString(),
          channel
      });
  };
  
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/30 blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full bg-emerald-500/20 blur-[100px] animate-float"></div>
        <div className="relative z-10 w-full max-w-md p-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-3xl blur-lg transform scale-105 opacity-50"></div>
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
              <div className="p-10 pb-0 text-center relative">
                <div className="w-32 h-32 mx-auto mb-4 relative z-10 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                   <Logo />
                </div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight uppercase drop-shadow-sm">
                  TEKAN PEACE DESK
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mt-2">
                  AWAKE MICROCREDIT SERVICES
                </p>
              </div>
              <form onSubmit={handleLogin} className="p-10 space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-blue-400 transition-colors">Access ID</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-500 group-focus-within:text-blue-400 transition-colors">👤</span>
                        </div>
                        <input 
                          type="text" 
                          className="w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-slate-700/50 rounded-xl font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-600 shadow-inner"
                          placeholder="Enter Username"
                          value={loginUser}
                          onChange={e => setLoginUser(e.target.value)}
                        />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest group-focus-within:text-blue-400 transition-colors">Password</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-500 group-focus-within:text-blue-400 transition-colors">🔒</span>
                        </div>
                        <input 
                          type="password" 
                          className="w-full pl-11 pr-4 py-4 bg-slate-950/50 border border-slate-700/50 rounded-xl font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder-slate-600 shadow-inner"
                          placeholder="••••••••"
                          value={loginPass}
                          onChange={e => setLoginPass(e.target.value)}
                        />
                    </div>
                  </div>
                </div>
                
                {loginError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center backdrop-blur-sm animate-pulse">
                    <p className="text-xs font-bold text-rose-400">{loginError}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-[0.15em] shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-wait"
                >
                  <span className="relative z-10">{isLoading ? 'Loading Users...' : 'Authenticate'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <div className="text-center pt-2">
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                     Secure Gateway • Authorized Personnel Only
                   </p>
                   <p className="text-[9px] text-slate-600 font-bold mt-1">
                     @2026 AWAKE Digital Transaction
                   </p>
                </div>
              </form>
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
           isOnline={navigator.onLine}
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
       {activeTab === 'schedules' && <LoanSchedule loans={loans} />}
       {activeTab === 'communication' && <BulkMessage loans={loans} />}
       {activeTab === 'ledger' && <GeneralLedger loans={loans} />}
       {activeTab === 'calculator' && <LoanCalculator />}
       {activeTab === 'audit_trail' && <AuditTrail logs={auditLogs} />}
       {activeTab === 'settings' && (
         <Settings 
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
         />
       )}
       {activeTab === 'support' && <Support />}
    </Layout>
  );
};

export default App;
