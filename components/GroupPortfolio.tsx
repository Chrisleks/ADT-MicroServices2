
import React, { useState, useMemo } from 'react';
import { Loan, LoanStatus } from '../types';

interface GroupPortfolioProps {
  loans: Loan[];
}

const GroupPortfolio: React.FC<GroupPortfolioProps> = ({ loans }) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'members' | 'transactions' | 'risk'>('members');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Derive groups dynamically
  const groupStats = useMemo(() => {
    const uniqueGroups = Array.from(new Set((loans || []).map(l => l.groupName)));
    
    return uniqueGroups.map(groupName => {
      const members = (loans || []).filter(l => l.groupName === groupName);
      const activeMembers = members.filter(l => l.status !== LoanStatus.LOSS && l.status !== LoanStatus.DOUBTFUL).length; 
      
      const totalPrincipal = members.reduce((sum, l) => {
         // Outstanding Principal
         const paid = (l.payments || []).filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
         return sum + (l.principal - paid);
      }, 0);

      const totalSavings = members.reduce((sum, l) => sum + l.savingsBalance, 0);
      const totalAdashe = members.reduce((sum, l) => sum + l.adasheBalance, 0);

      return {
        name: groupName,
        totalMembers: members.length,
        activeCount: activeMembers,
        portfolioValue: totalPrincipal,
        savingsValue: totalSavings,
        adasheValue: totalAdashe,
        members: members
      };
    });
  }, [loans]);

  const filteredGroupStats = useMemo(() => {
    return groupStats.filter(group => {
      const statusMatch = statusFilter === 'all' || group.members.some(m => m.status === statusFilter);
      const searchMatch = searchTerm === '' || group.name.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [groupStats, statusFilter, searchTerm]);

  const selectedGroupData = useMemo(() => {
    return groupStats.find(g => g.name === selectedGroup);
  }, [groupStats, selectedGroup]);

  // Get daily transactions for the selected group
  const dailyTransactions = useMemo(() => {
    if (!selectedGroupData) return [];
    
    return selectedGroupData.members.flatMap(member => 
      (member.payments || [])
        .filter(p => p.date === transactionDate)
        .map(p => ({
          ...p,
          memberId: member.id,
          memberName: member.borrowerName
        }))
    ).sort((a, b) => b.id.localeCompare(a.id)); // sort by transaction ID
  }, [selectedGroupData, transactionDate]);
  
  const riskProfile = useMemo(() => {
    if (!selectedGroupData) return null;

    const profile = {
      [LoanStatus.CURRENT]: 0,
      [LoanStatus.WATCH]: 0,
      [LoanStatus.SUBSTANDARD]: 0,
      [LoanStatus.DOUBTFUL]: 0,
      [LoanStatus.LOSS]: 0,
    };

    selectedGroupData.members.forEach(member => {
      profile[member.status]++;
    });

    return profile;
  }, [selectedGroupData]);


  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Group Portfolio Directory</h2>
          <p className="text-slate-500 font-medium">Manage and monitor microfinance group performance</p>
        </div>
        
        {/* If in detail view, show date picker for transactions */}
        {selectedGroup && viewMode === 'transactions' && (
           <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <span className="pl-3 text-[10px] font-black uppercase text-slate-400">Date:</span>
              <input 
                type="date" 
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent outline-none p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              />
           </div>
        )}
      </div>

      {!selectedGroup ? (
        <div>
          {/* Filter and Search Controls */}
          <div className="mb-4 flex gap-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as LoanStatus | 'all')}
              className="p-2 rounded-md border"
            >
              <option value="all">All Statuses</option>
              {Object.values(LoanStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search by group name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="p-2 rounded-md border w-full"
            />
          </div>
        {/* --- DIRECTORY VIEW (TABLE) --- */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Members</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Loan Portfolio</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Savings Fund</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Adashe Fund</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredGroupStats.map((group) => (
                  <tr key={group.name} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedGroup(group.name)}>\
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                            {group.name.charAt(0)}
                         </div>
                         <div>
                            <div className="font-black text-slate-800 text-sm">{group.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">{group.activeCount} Active Accounts</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">{group.totalMembers}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="font-black text-blue-600">₦{group.portfolioValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="font-black text-emerald-600">₦{group.savingsValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="font-black text-amber-600">₦{group.adasheValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <button className="text-slate-300 group-hover:text-blue-600 transition-colors">
                          View ➔
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ) : (
        /* --- DETAIL VIEW --- */
        <div className="space-y-6 animate-slide-up">
           
           {/* Navigation Back */}
           <button 
             onClick={() => { setSelectedGroup(null); setViewMode('members'); }}
             className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-xs font-bold uppercase tracking-wider"
           >
             <span>←</span> Back to Directory
           </button>

           {/* Header Card */}
           <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl transform translate-x-10 -translate-y-10">
                 🏘️
              </div>
              <div className="relative z-10">
                 <h1 className="text-4xl font-black tracking-tight mb-2">{selectedGroupData?.name}</h1>
                 <p className="text-slate-400 font-medium text-sm">Portfolio Overview & Member Management</p>
                 
                 <div className="flex gap-8 mt-8">
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Portfolio Value</div>
                       <div className="text-2xl font-black text-blue-400">₦{selectedGroupData?.portfolioValue.toLocaleString()}</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Savings</div>
                       <div className="text-2xl font-black text-emerald-400">₦{selectedGroupData?.savingsValue.toLocaleString()}</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Adashe Volume</div>
                       <div className="text-2xl font-black text-amber-400">₦{selectedGroupData?.adasheValue.toLocaleString()}</div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tabs */}
           <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setViewMode('members')}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  viewMode === 'members' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                👥 Member Roster
              </button>
              <button 
                onClick={() => setViewMode('transactions')}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  viewMode === 'transactions' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                📅 Daily Transactions
              </button>
              <button
                onClick={() => setViewMode('risk')}
                className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                  viewMode === 'risk'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ρί Risk Analysis
              </button>
           </div>

           {/* Content Area */}
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
              {viewMode === 'members' ? (
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                         <tr>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Member Name</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Loan Bal</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Savings</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Adashe</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {selectedGroupData?.members.map(member => {
                            const paid = (member.payments || []).filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
                            const loanBal = member.principal - paid;
                            return (
                               <tr key={member.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{member.id}</td>
                                  <td className="px-6 py-4 font-bold text-slate-700">{member.borrowerName}</td>
                                  <td className="px-6 py-4 text-right font-mono font-medium text-blue-600">₦{loanBal.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600">₦{member.savingsBalance.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-mono font-medium text-amber-600">₦{member.adasheBalance.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">
                                     <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                                        member.status === LoanStatus.CURRENT ? 'bg-emerald-100 text-emerald-700' : 
                                        member.status === LoanStatus.WATCH ? 'bg-yellow-100 text-yellow-700' :
                                        member.status === LoanStatus.SUBSTANDARD ? 'bg-orange-100 text-orange-700' :
                                        member.status === LoanStatus.DOUBTFUL ? 'bg-rose-100 text-rose-700' :
                                        'bg-slate-800 text-white'
                                     }`}>
                                        {member.status}
                                     </span>
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
              ) : viewMode === 'transactions' ? (
                <div>
                   {dailyTransactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {dailyTransactions.map((txn, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700 text-xs">{txn.memberName}</div>
                                            <div className="font-mono text-[9px] text-slate-400">ID: {txn.memberId}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase border border-slate-200">
                                                {txn.category}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${txn.direction === 'In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {txn.direction === 'In' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 italic">
                                            {txn.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase text-slate-400">Net Daily Total</div>
                                <div className="text-xl font-black text-slate-800">
                                    ₦{dailyTransactions.reduce((acc, curr) => acc + (curr.direction === 'In' ? curr.amount : -curr.amount), 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                         <span className="text-4xl mb-2">📅</span>
                         <p className="font-bold text-xs uppercase tracking-widest">No transactions found for {transactionDate}</p>
                      </div>
                   )}
                </div>
              ) : (
                <div className="p-8">
                  <h3 className="text-lg font-bold mb-4">Risk Analysis</h3>
                  {riskProfile && (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(riskProfile).map(([status, count]) => (
                        <div key={status} className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-500">{status}</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>

        </div>
      )}

    </div>
  );
};

export default GroupPortfolio;
