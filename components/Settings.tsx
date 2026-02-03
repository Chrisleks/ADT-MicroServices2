
import React, { useState } from 'react';
import { SystemUser, ResetRequest, UserRole, Loan, AuditLog } from '../types';
import { sanitizeInput } from '../utils/security';

interface SettingsProps {
  users: SystemUser[];
  requests: ResetRequest[];
  loans: Loan[];
  auditLogs: AuditLog[];
  onAddUser: (user: SystemUser) => void;
  onDeleteUser: (username: string) => void;
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
  onResetUserPassword: (username: string, newPass: string) => void;
  onUpdateUserRole: (username: string, newRole: UserRole) => void;
  onDeleteLoan: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  users, requests, loans, auditLogs, onAddUser, onDeleteUser, onApproveRequest, onRejectRequest, onResetUserPassword, onUpdateUserRole, onDeleteLoan
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'security' | 'audit' | 'config' | 'data'>('users');
  
  // Add User Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: UserRole.SFO });
  
  // Edit Role State
  const [editingUser, setEditingUser] = useState<{username: string, role: UserRole} | null>(null);

  // Config State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');

  // Data Management State
  const [loanSearch, setLoanSearch] = useState('');
  const [wipeCandidate, setWipeCandidate] = useState<{id: string, name: string} | null>(null);

  const filteredLoans = loans.filter(l => 
    l.borrowerName.toLowerCase().includes(loanSearch.toLowerCase()) ||
    l.id.includes(loanSearch)
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.username && newUser.password) {
      // SECURITY: Sanitize username input
      onAddUser({
        username: sanitizeInput(newUser.username.toLowerCase()),
        password: newUser.password,
        role: newUser.role,
        isActive: true
      });
      setShowAddModal(false);
      setNewUser({ username: '', password: '', role: UserRole.SFO });
    }
  };

  const handleRoleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUserRole(editingUser.username, editingUser.role);
      setEditingUser(null);
    }
  };

  const toggleMaintenance = () => {
    setMaintenanceMode(!maintenanceMode);
  };

  const handleExportDB = () => {
    const data = {
        timestamp: new Date().toISOString(),
        system_users: users,
        loan_portfolio: loans,
        security_requests: requests,
        audit_logs: auditLogs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ADT_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSync = () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    
    // Simulate API call
    setTimeout(() => {
        setSyncStatus('done');
        alert("✅ Cloud Backup Synced Successfully!");
        setTimeout(() => setSyncStatus('idle'), 2000);
    }, 2000);
  };

  const confirmWipe = () => {
    if (wipeCandidate) {
        // Perform Deletion
        onDeleteLoan(wipeCandidate.id);
        
        // Visual Feedback
        alert(`✅ Success: Record for ${wipeCandidate.name} (ID: ${wipeCandidate.id}) has been permanently deleted from the system.`);
        
        // Close Modal
        setWipeCandidate(null);
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("CRITICAL WARNING: This will wipe ALL data (Loans, Users, Logs, Chats) from this device. The app will return to its initial default state. Are you sure?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">System Settings</h2>
        <p className="text-slate-500 font-medium">Master control panel for users, security, and auditing.</p>
      </div>

      {/* Settings Navigation */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto">
        {[
          { id: 'users', label: 'User Management', icon: '👥' },
          { id: 'security', label: 'Security Center', icon: '🛡️', count: requests.filter(r => r.status === 'Pending').length },
          { id: 'audit', label: 'Audit Trail', icon: '📜' },
          { id: 'data', label: 'Data Management', icon: '🗄️' },
          { id: 'config', label: 'System Config', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest relative transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="mr-2 text-base">{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 bg-rose-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* CONTENT: User Management */}
      {activeTab === 'users' && (
        <div className="animate-slide-up space-y-6">
          <div className="flex justify-between items-center bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <div>
              <h3 className="font-black text-blue-900 text-sm uppercase">System Access Control</h3>
              <p className="text-[10px] text-blue-600 mt-1">Manage personnel access and roles.</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
            >
              <span>+</span> Add User
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.username} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative group hover:border-blue-400 transition-colors">
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${
                         user.role === UserRole.MASTER_ADMIN ? 'bg-purple-600' : 'bg-slate-400'
                       }`}>
                         {user.username.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <div className="font-black text-slate-800 capitalize">{user.username}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{user.role}</div>
                       </div>
                    </div>
                    {user.role !== UserRole.MASTER_ADMIN && (
                      <div className="flex gap-2">
                        <button 
                            onClick={() => setEditingUser({username: user.username, role: user.role})}
                            className="text-slate-300 hover:text-blue-500 transition-colors"
                            title="Edit Role"
                        >
                            ✏️
                        </button>
                        <button 
                            onClick={() => {
                            if(confirm(`Are you sure you want to delete ${user.username}?`)) onDeleteUser(user.username);
                            }}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                            title="Delete User"
                        >
                            🗑️
                        </button>
                      </div>
                    )}
                 </div>
                 <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                       <span className="text-[9px] font-bold uppercase text-slate-400">{user.isActive ? 'Active' : 'Disabled'}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-300">
                       Pass: {'*'.repeat(6)}
                    </div>
                 </div>
              </div>
            ))}
          </div>

          {/* Add User Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-up">
                 <div className="bg-slate-900 p-6 text-white">
                    <h3 className="font-black uppercase tracking-widest">New User Profile</h3>
                 </div>
                 <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Username (ID)</label>
                       <input 
                         type="text" 
                         required 
                         className="w-full p-3 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50"
                         value={newUser.username}
                         onChange={e => setNewUser({...newUser, username: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Role</label>
                       <select 
                         className="w-full p-3 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50"
                         value={newUser.role}
                         onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                       >
                         {Object.values(UserRole).map(role => (
                           <option key={role as string} value={role as string}>{role as string}</option>
                         ))}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Initial Password</label>
                       <input 
                         type="text" 
                         required 
                         className="w-full p-3 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50"
                         value={newUser.password}
                         onChange={e => setNewUser({...newUser, password: e.target.value})}
                       />
                    </div>
                    <div className="pt-4 flex gap-3">
                       <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                       <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-700">Create User</button>
                    </div>
                 </form>
              </div>
            </div>
          )}

          {/* Edit Role Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-up">
                 <div className="bg-slate-900 p-6 text-white">
                    <h3 className="font-black uppercase tracking-widest">Edit Role: {editingUser.username}</h3>
                 </div>
                 <form onSubmit={handleRoleUpdateSubmit} className="p-6 space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Assign New Role</label>
                       <select 
                         className="w-full p-3 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50"
                         value={editingUser.role}
                         onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                       >
                         {Object.values(UserRole).map(role => (
                           <option key={role as string} value={role as string}>{role as string}</option>
                         ))}
                       </select>
                    </div>
                    <div className="pt-4 flex gap-3">
                       <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-3 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                       <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-blue-700">Update Role</button>
                    </div>
                 </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: Security */}
      {activeTab === 'security' && (
        <div className="animate-slide-up space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-black text-slate-800 text-sm uppercase">Password Reset Requests</h3>
                 <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase">{requests.length} Total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                         <th className="px-6 py-4">Time</th>
                         <th className="px-6 py-4">User ID</th>
                         <th className="px-6 py-4">Phone Verify</th>
                         <th className="px-6 py-4">Proposed Password</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {requests.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs italic">No pending requests</td></tr>
                      ) : (
                        requests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50">
                             <td className="px-6 py-4 text-xs font-mono text-slate-500">{new Date(req.timestamp).toLocaleTimeString()}</td>
                             <td className="px-6 py-4 font-black text-slate-700 uppercase">{req.username}</td>
                             <td className="px-6 py-4 font-medium text-slate-600">{req.phone}</td>
                             <td className="px-6 py-4 font-mono text-blue-600 bg-blue-50/50 rounded">{req.newPassword}</td>
                             <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                                  req.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                                  req.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                  'bg-rose-100 text-rose-600'
                                }`}>
                                  {req.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right flex justify-end gap-2">
                                {req.status === 'Pending' && (
                                  <>
                                    <button 
                                      onClick={() => onApproveRequest(req.id)}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg shadow-sm" title="Approve"
                                    >
                                       ✔️
                                    </button>
                                    <button 
                                      onClick={() => onRejectRequest(req.id)}
                                      className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg shadow-sm" title="Reject"
                                    >
                                       ✕
                                    </button>
                                  </>
                                )}
                             </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                </table>
              </div>
           </div>
           
           <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center gap-4">
              <div className="text-3xl">🔒</div>
              <div>
                 <h4 className="font-bold text-sm uppercase tracking-widest">Security Protocol</h4>
                 <p className="text-[10px] text-slate-400 mt-1 max-w-lg">Approving a request will immediately update the user's password in the active system directory. This action cannot be undone.</p>
              </div>
           </div>
        </div>
      )}

      {/* CONTENT: Audit Log */}
      {activeTab === 'audit' && (
        <div className="animate-slide-up space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">System Event Log</h3>
                    <p className="text-slate-400 text-xs">Immutable record of system activities.</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-emerald-400">{auditLogs.length}</div>
                    <div className="text-[10px] font-bold uppercase text-slate-500">Total Events</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Actor</th>
                                <th className="px-6 py-4">Event Type</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4 text-center">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No events recorded in this session.</td>
                                </tr>
                            ) : (
                                auditLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-slate-500">
                                            {new Date(log.timestamp).toLocaleTimeString()} <br/>
                                            <span className="text-[9px] opacity-60">{new Date(log.timestamp).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700 capitalize">{log.actor}</div>
                                            <div className="text-[9px] text-slate-400 uppercase">{log.role}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                                                log.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' :
                                                log.severity === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-50 text-blue-500'
                                            }`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* CONTENT: Data Management */}
      {activeTab === 'data' && (
        <div className="animate-slide-up space-y-6">
           <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg flex justify-between items-center">
              <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-rose-400">Data Management & Wiping</h3>
                  <p className="text-slate-400 text-xs mt-1">
                     Search for customer records to perform hard deletes. This action is irreversible and removes all associated data from the system completely.
                  </p>
              </div>
              <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-white">{loans.length}</div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Total Records</div>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex gap-4">
                 <input 
                    type="text"
                    placeholder="Search by Name or ID..."
                    className="flex-1 p-3 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                    value={loanSearch}
                    onChange={(e) => setLoanSearch(e.target.value)}
                 />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLoans.map(loan => (
                    <div key={loan.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                        <div>
                            <div className="font-black text-slate-800 text-sm">{loan.borrowerName}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">ID: {loan.id} • {loan.groupName}</div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setWipeCandidate({id: loan.id, name: loan.borrowerName})}
                            className="bg-rose-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-rose-600 shadow-md transition-colors border border-rose-600 active:scale-95"
                        >
                            Permanently Delete
                        </button>
                    </div>
                ))}
                {filteredLoans.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">No matching records found.</div>
                )}
              </div>
           </div>

           {/* WIPE WARNING MODAL */}
           {wipeCandidate && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setWipeCandidate(null)}></div>
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-up">
                  <div className="bg-rose-600 p-6 text-white text-center">
                     <div className="text-4xl mb-2">⚠️</div>
                     <h3 className="font-black uppercase tracking-widest text-lg">Permanent Data Deletion</h3>
                  </div>
                  <div className="p-6 text-center space-y-4">
                     <p className="text-slate-600 text-sm font-medium">
                       You are about to permanently delete the record for:
                     </p>
                     <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-xl font-black text-slate-800">{wipeCandidate.name}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {wipeCandidate.id}</div>
                     </div>
                     <p className="text-rose-600 text-xs font-bold uppercase leading-relaxed">
                        This action cannot be undone. All transaction history, savings, and adashe records associated with this ID will be wiped immediately from the database.
                     </p>
                     <div className="pt-4 flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setWipeCandidate(null)} 
                          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button"
                          onClick={confirmWipe} 
                          className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase shadow-lg hover:bg-rose-700"
                        >
                          Yes, Delete Forever
                        </button>
                     </div>
                  </div>
               </div>
             </div>
           )}
        </div>
      )}

      {/* CONTENT: Config */}
      {activeTab === 'config' && (
         <div className="animate-slide-up grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               {maintenanceMode && (
                  <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-0 pointer-events-none"></div>
               )}
               <h3 className="font-black text-slate-800 text-sm uppercase mb-4 relative z-10">System Maintenance</h3>
               <div className="flex items-center justify-between py-4 border-b border-slate-50 relative z-10">
                  <div>
                     <div className="font-bold text-xs text-slate-700">Maintenance Mode</div>
                     <div className="text-[10px] text-slate-400">Lock all non-admin access</div>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        name="toggle" 
                        id="toggle" 
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-blue-600 transition-all duration-300"
                        checked={maintenanceMode}
                        onChange={toggleMaintenance}
                      />
                      <label 
                        htmlFor="toggle" 
                        className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer transition-colors duration-300 ${maintenanceMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                      ></label>
                  </div>
               </div>
               {maintenanceMode && (
                   <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl relative z-10 animate-fade-in">
                       <p className="text-[10px] font-bold text-amber-600 uppercase flex items-center gap-2">
                           <span>⚠️</span> System locked for general users
                       </p>
                   </div>
               )}
               <div className="flex items-center justify-between py-4 relative z-10">
                  <div>
                     <div className="font-bold text-xs text-slate-700">Debug Logging</div>
                     <div className="text-[10px] text-slate-400">Enable verbose console logs</div>
                  </div>
                  <button className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Enable</button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="font-black text-slate-800 text-sm uppercase mb-4">Database Operations</h3>
               <div className="space-y-3">
                  <button 
                    onClick={handleExportDB}
                    className="w-full py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                     <span>⬇</span> Export Full Database (JSON)
                  </button>
                  <button 
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing'}
                    className="w-full py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
                  >
                     <span>{syncStatus === 'syncing' ? '⏳' : '🔄'}</span> {syncStatus === 'syncing' ? 'Syncing to Cloud...' : 'Sync with Cloud Backup'}
                  </button>
               </div>

                <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm mt-6">
                    <h3 className="font-black text-rose-600 text-sm uppercase mb-4">Danger Zone</h3>
                    <button 
                        onClick={handleFactoryReset}
                        className="w-full py-4 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                    >
                        <span>☢️</span> Factory Reset Application
                    </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Settings;
