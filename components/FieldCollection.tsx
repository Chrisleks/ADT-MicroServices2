
import React, { useState, useEffect } from 'react';
import { Loan, TransactionCategory, UserRole, OfflineTransaction, LoanType } from '../types';
import { sanitizeInput } from '../utils/security';

interface FieldCollectionProps {
  loans: Loan[];
  onTransaction: (loanId: string, category: TransactionCategory, direction: 'In' | 'Out', amount: number, notes: string) => void;
  currentUser?: { username: string; role: UserRole };
  offlineQueue?: OfflineTransaction[];
  isOnline?: boolean;
  onManualSync?: () => void;
}

const FieldCollection: React.FC<FieldCollectionProps> = ({ loans, onTransaction, currentUser, offlineQueue = [], isOnline = true, onManualSync }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // New States for Field Mode
  const [viewMode, setViewMode] = useState<'sheet' | 'field_cards'>('sheet');
  const [officerFilter, setOfficerFilter] = useState('All');
  
  const [txnCategory, setTxnCategory] = useState<TransactionCategory>('Loan Instalment');
  const [txnDir, setTxnDir] = useState<'In' | 'Out'>('In');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnNotes, setTxnNotes] = useState('');

  const groups = Array.from(new Set(loans.map(l => l.groupName)));
  const officers = Array.from(new Set(loans.map(l => l.creditOfficer))).sort();
  const today = new Date().toISOString().split('T')[0];

  // Set default view based on role
  useEffect(() => {
    if (currentUser?.role === UserRole.FIELD_OFFICER) {
      setViewMode('field_cards');
    }
  }, [currentUser]);

  const filteredLoans = loans.filter(l => {
    const matchesSearch = l.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.includes(searchTerm);
    const matchesGroup = filterGroup === 'All' || l.groupName === filterGroup;
    const matchesOfficer = officerFilter === 'All' || l.creditOfficer === officerFilter;
    
    return matchesSearch && matchesGroup && matchesOfficer;
  });

  const categories: TransactionCategory[] = [
    'Loan Instalment', 'Savings', 'Adashe', 'Risk Premium', 
    'Admission Fee', 'Membership fee', 'Form/card', 
    'Withdrawal from bank', 'Bank Deposit', 'Adjustment/Refund', 
    'Risk premium claim', 'Salary & benefit', 'Field Transport', 
    'Funds transfer', 'Other Fees'
  ];

  // --- LOAN CALCULATOR LOGIC INTEGRATION ---
  const getRepaymentMetrics = (loan: Loan) => {
      // Note: loan.principal already includes interest based on Registration logic
      const totalPrincipalDue = loan.principal; 
      
      let installments = 16;
      let periodName = 'Week';
      let periodFactor = 7; // days

      if (loan.loanType.includes('Agric')) {
          installments = 3; // Agric pays in 3 installments
          periodName = 'Month';
          periodFactor = 30; // days
      }

      const expectedPeriodicPayment = totalPrincipalDue / installments;

      // Calculate Underpayment / Arrears
      let arrears = 0;
      let status = 'Pending';
      let expectedTotalToDate = 0;

      if (loan.loanDisbursementDate) {
          const start = new Date(loan.loanDisbursementDate);
          const now = new Date();
          const diffTime = Math.max(0, now.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Calculate how many periods have passed
          let periodsPassed = Math.floor(diffDays / periodFactor);
          
          // Logic Adjustment for Agric (Grace Period handling - simplistic)
          if (loan.loanType.includes('Agric')) {
             // Assuming first 4 months are grace, payments start Month 5
             periodsPassed = Math.max(0, periodsPassed - 4); 
          }

          // Cap at max installments
          if (periodsPassed > installments) periodsPassed = installments;

          expectedTotalToDate = expectedPeriodicPayment * periodsPassed;

          const totalPaid = loan.payments
            .filter(p => p.category === 'Loan Instalment' && p.direction === 'In')
            .reduce((s, p) => s + p.amount, 0);

          arrears = expectedTotalToDate - totalPaid;
          
          if (arrears > 100) status = 'Underpaid'; // Tolerance of 100
          else status = 'On Track';
      }

      return {
          expectedPayment: expectedPeriodicPayment,
          periodName,
          arrears,
          status
      };
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !txnAmount) return;
    
    const amount = parseFloat(txnAmount);
    const sanitizedNotes = sanitizeInput(txnNotes);
    
    // Allow withdrawals only in Online mode or handle as special request if needed
    // Current offline logic in App.tsx supports queueing updatedLoan state, so withdrawals are technically possible to draft
    if (txnDir === 'Out' && (txnCategory === 'Savings' || txnCategory === 'Adashe')) {
        onTransaction(selectedLoanId, txnCategory, txnDir, amount, sanitizedNotes);
        setSelectedLoanId(null);
        setTxnAmount('');
        setTxnNotes('');

        if (isOnline) {
            setTimeout(() => {
              alert("✅ Withdrawal request submitted.\n\nApproval Flow: BDM -> SFO -> HOB");
            }, 100);
        } else {
            setTimeout(() => {
              alert("⚠️ Offline Mode: Withdrawal request drafted. Will submit for approval when online.");
            }, 100);
        }
        return;
    }

    onTransaction(selectedLoanId, txnCategory, txnDir, amount, sanitizedNotes);
    
    if (!isOnline) {
       alert("⚠️ Transaction saved to Offline Drafts. It will automatically post when connection is restored.");
    }

    setSelectedLoanId(null);
    setTxnAmount('');
    setTxnNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleRow = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedRows(newSelection);
  };

  const selectAll = () => {
    if (selectedRows.size === filteredLoans.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredLoans.map(l => l.id)));
  };

  // Get metrics for the currently selected loan (for the modal)
  const selectedLoanMetrics = selectedLoanId 
    ? getRepaymentMetrics(loans.find(l => l.id === selectedLoanId)!) 
    : null;

  return (
    <div className="space-y-6">
      
      {/* Offline Alert Banner */}
      {!isOnline && (
         <div className="bg-amber-100 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm animate-pulse-slow">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <span className="text-2xl">📡</span>
                  <div>
                     <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest">Offline Mode Active</h3>
                     <p className="text-xs text-amber-700 font-medium">Transactions will be stored locally and synced automatically.</p>
                  </div>
               </div>
               {offlineQueue.length > 0 && (
                  <div className="text-right">
                     <span className="text-2xl font-black text-amber-900">{offlineQueue.length}</span>
                     <span className="text-[10px] font-bold text-amber-700 uppercase block">Pending Sync</span>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* Sync Status Banner */}
      {isOnline && offlineQueue.length > 0 && (
         <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center animate-fade-in">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-bold text-blue-700">Syncing {offlineQueue.length} offline transactions...</span>
             </div>
             {onManualSync && (
                 <button onClick={onManualSync} className="text-[10px] font-black uppercase text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700">
                    Force Sync Now
                 </button>
             )}
         </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Field Collection</h2>
          <p className="text-slate-500 text-sm italic font-medium">Daily Posting & Reconciliation</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-lg flex mr-2">
             <button 
                onClick={() => setViewMode('sheet')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${viewMode === 'sheet' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
             >
                Sheet View
             </button>
             <button 
                onClick={() => setViewMode('field_cards')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all flex items-center gap-1 ${viewMode === 'field_cards' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
             >
                <span>📱</span> Field Mode
             </button>
          </div>

          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
          >
            <span>🖨️</span> Print
          </button>
        </div>
      </div>

      {/* Filters (Shared) */}
      <div className="flex flex-wrap gap-2 print:hidden">
          <select 
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={officerFilter}
            onChange={(e) => setOfficerFilter(e.target.value)}
          >
            <option value="All">All Officers</option>
            {officers.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="All">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          
          <input 
            type="text"
            placeholder="Search Name or ID..."
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs w-full md:w-64 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {viewMode === 'sheet' ? (
        // --- CLASSIC TABLE VIEW ---
        <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden print:no-shadow print:border-none">
            <div className="bg-slate-50 px-6 py-4 border-b print:block hidden text-center">
                <h1 className="text-xl font-black uppercase">TEKAN PEACE DESK Microcredit</h1>
                <p className="text-[10px] font-bold uppercase text-slate-500">Field Collection Sheet - Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] border-collapse min-w-[1200px] print:min-w-0">
                <thead>
                <tr className="bg-slate-900 border-b border-slate-800 font-black text-slate-300 uppercase tracking-tighter print:bg-slate-100 print:text-black">
                    <th className="px-3 py-3 border-r border-slate-800 print:hidden">
                        <input type="checkbox" checked={selectedRows.size === filteredLoans.length && filteredLoans.length > 0} onChange={selectAll} />
                    </th>
                    <th className="px-3 py-3 border-r border-slate-800">Cust ID</th>
                    <th className="px-3 py-3 border-r border-slate-800">Group</th>
                    <th className="px-3 py-3 border-r border-slate-800">Customer Name</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right bg-blue-900/20 print:bg-transparent">Loan Bal</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right bg-emerald-900/20 print:bg-transparent">Savings Bal</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right bg-amber-900/20 print:bg-transparent">Adashe Bal</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right">Disbursement</th>
                    <th className="px-3 py-3 border-r border-slate-800">Loan Type</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right">Pymt. Loan</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right">Pymt. Ada</th>
                    <th className="px-3 py-3 border-r border-slate-800 text-right">Pymt. Sav</th>
                    <th className="px-3 py-3 text-center sticky right-0 bg-slate-900 print:hidden">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredLoans.map(loan => {
                    const isSelected = selectedRows.has(loan.id);
                    const pymtLoan = loan.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
                    const pymtAdashe = loan.payments.filter(p => p.category === 'Adashe' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
                    const pymtSavings = loan.payments.filter(p => p.category === 'Savings' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
                    const currentLoanBal = loan.principal - pymtLoan;
                    
                    const pendingCount = (loan.pendingRequests || []).length;

                    return (
                    <tr 
                        key={loan.id} 
                        className={`hover:bg-blue-50/50 transition-colors ${isSelected ? 'bg-blue-50' : ''} print:bg-transparent`}
                    >
                        <td className="px-3 py-2 border-r text-center print:hidden">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleRow(loan.id)} />
                        </td>
                        <td className="px-3 py-2 border-r font-mono font-black text-blue-700 print:text-black">{loan.id}</td>
                        <td className="px-3 py-2 border-r font-black text-slate-700">{loan.groupName}</td>
                        <td className="px-3 py-2 border-r font-black text-slate-800 flex items-center justify-between gap-2">
                            {loan.borrowerName}
                            {pendingCount > 0 && (
                                <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase border border-amber-200" title={`${pendingCount} pending request(s)`}>
                                    ⏳ {pendingCount}
                                </span>
                            )}
                        </td>
                        <td className="px-3 py-2 border-r text-right font-black text-blue-700 bg-blue-50/30 print:bg-transparent print:text-black">₦{currentLoanBal.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right font-black text-emerald-700 bg-emerald-50/30 print:bg-transparent print:text-black">₦{loan.savingsBalance.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right font-black text-amber-700 bg-amber-50/30 print:bg-transparent print:text-black">₦{loan.adasheBalance.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right font-bold">₦{loan.loanDisbursementAmount.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r font-medium text-slate-500">{loan.loanType}</td>
                        <td className="px-3 py-2 border-r text-right font-bold text-blue-600/80 print:text-black">₦{pymtLoan.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right font-bold text-amber-600/80 print:text-black">₦{pymtAdashe.toLocaleString()}</td>
                        <td className="px-3 py-2 border-r text-right font-bold text-emerald-600/80 print:text-black">₦{pymtSavings.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center sticky right-0 bg-white print:hidden">
                        <button 
                            onClick={() => setSelectedLoanId(loan.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-[9px] font-black uppercase shadow-sm hover:bg-blue-700"
                        >
                            POST
                        </button>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
            <div className="p-8 hidden print:grid grid-cols-3 gap-12 text-center text-[10px] font-black uppercase tracking-widest mt-10">
            <div className="border-t border-slate-800 pt-2">Field Officer</div>
            <div className="border-t border-slate-800 pt-2">Audit Check</div>
            <div className="border-t border-slate-800 pt-2">Branch Manager</div>
            </div>
        </div>
      ) : (
        // --- FIELD MODE CARD VIEW ---
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {filteredLoans.map(loan => {
               const pymtLoan = loan.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
               const currentLoanBal = loan.principal - pymtLoan;
               const paidToday = loan.payments.some(p => p.date === today && p.category === 'Loan Instalment' && p.direction === 'In');
               
               // Calculate Metrics using LoanCalculator Logic
               const metrics = getRepaymentMetrics(loan);

               return (
                   <div key={loan.id} className={`bg-white rounded-2xl border ${paidToday ? 'border-emerald-300 shadow-emerald-50' : 'border-slate-200 shadow-sm'} overflow-hidden relative group`}>
                       {paidToday && (
                           <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase z-10">
                               PAID TODAY ✓
                           </div>
                       )}
                       
                       <div className={`p-4 ${paidToday ? 'bg-emerald-50/30' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                             <div className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">{loan.groupName}</div>
                             <div className="text-[10px] font-mono text-slate-400">#{loan.id}</div>
                          </div>
                          
                          <h3 className="font-black text-slate-800 text-lg mb-1 truncate">{loan.borrowerName}</h3>
                          
                          <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 rounded-xl p-2 border border-slate-100">
                             <div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expected/{metrics.periodName}</div>
                                <div className="text-sm font-black text-blue-600">₦{metrics.expectedPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                             </div>
                             <div className="text-right">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</div>
                                <div className="text-sm font-black text-slate-700">₦{currentLoanBal.toLocaleString()}</div>
                             </div>
                          </div>

                          {/* Underpayment Indicator */}
                          <div className="mt-2">
                             {metrics.status === 'Underpaid' ? (
                                 <div className="bg-rose-100 text-rose-700 px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between animate-pulse-slow">
                                     <span>⚠️ Underpaid by:</span>
                                     <span className="font-black">₦{metrics.arrears.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                 </div>
                             ) : (
                                 <div className="bg-emerald-50 text-emerald-600 px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center">
                                     <span>✅ Account On Track</span>
                                 </div>
                             )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                              {paidToday ? (
                                  <button 
                                    disabled 
                                    className="flex-1 bg-emerald-100 text-emerald-600 py-3 rounded-xl text-xs font-black uppercase cursor-not-allowed opacity-80"
                                  >
                                    Paid
                                  </button>
                              ) : (
                                  <button 
                                    onClick={() => setSelectedLoanId(loan.id)}
                                    className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase shadow-md hover:bg-slate-800 active:scale-95 transition-transform"
                                  >
                                    Quick Pay
                                  </button>
                              )}
                              <button 
                                onClick={() => setSelectedLoanId(loan.id)}
                                className="w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg hover:bg-slate-50"
                                title="Other Transactions"
                              >
                                 +
                              </button>
                          </div>
                       </div>
                   </div>
               );
            })}
        </div>
      )}

      {selectedLoanId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className={`p-6 text-white flex justify-between items-center ${isOnline ? 'bg-slate-900' : 'bg-amber-600'}`}>
              <div>
                <h3 className="text-lg font-black tracking-tight">{isOnline ? 'Post Transaction' : 'Offline Mode Draft'}</h3>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? 'text-slate-400' : 'text-amber-200'}`}>
                  {loans.find(l => l.id === selectedLoanId)?.borrowerName} (#{selectedLoanId})
                </p>
              </div>
              <button onClick={() => setSelectedLoanId(null)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            
            <form onSubmit={handlePost} className="p-6 space-y-4">
              
              {/* Payment Hint from Calculator */}
              {selectedLoanMetrics && txnCategory === 'Loan Instalment' && txnDir === 'In' && (
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex justify-between items-center text-blue-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Recommended {selectedLoanMetrics.periodName}ly Pay:</span>
                      <span className="text-sm font-black cursor-pointer underline decoration-dotted" onClick={() => setTxnAmount(selectedLoanMetrics.expectedPayment.toFixed(0))} title="Click to autofill">
                          ₦{selectedLoanMetrics.expectedPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Category</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold"
                    value={txnCategory}
                    onChange={(e) => setTxnCategory(e.target.value as TransactionCategory)}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Direction</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold"
                    value={txnDir}
                    onChange={(e) => setTxnDir(e.target.value as 'In' | 'Out')}
                  >
                    <option value="In">Deposit/Payment (IN)</option>
                    <option value="Out">Withdrawal (OUT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-black text-slate-800"
                    placeholder="0.00"
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                  rows={2}
                  placeholder="Enter notes or fee details..."
                  value={txnNotes}
                  onChange={(e) => setTxnNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                className={`w-full py-4 rounded-xl font-black text-sm uppercase shadow-lg active:scale-95 transition-all ${
                    isOnline 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                {isOnline ? 'Save Transaction' : 'Queue to Drafts'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldCollection;
