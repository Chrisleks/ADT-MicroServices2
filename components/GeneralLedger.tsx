
import React, { useState, useMemo } from 'react';
import { Loan, TransactionCategory } from '../types';

interface GeneralLedgerProps {
  loans: Loan[];
}

const GeneralLedger: React.FC<GeneralLedgerProps> = ({ loans }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten and process all transactions
  const ledgerData = useMemo(() => {
    let allTransactions = loans.flatMap(loan => 
      loan.payments.map(p => ({
        ...p,
        loanId: loan.id,
        borrowerName: loan.borrowerName,
        groupName: loan.groupName
      }))
    );

    // Apply Filters
    return allTransactions.filter(txn => {
      const matchesDate = txn.date >= dateRange.start && txn.date <= dateRange.end;
      const matchesCategory = filterCategory === 'All' || txn.category === filterCategory;
      const matchesSearch = 
        txn.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        txn.loanId.includes(searchTerm) ||
        txn.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesDate && matchesCategory && matchesSearch;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Sort Descending (Newest First)
  }, [loans, dateRange, filterCategory, searchTerm]);

  // Calculate Totals
  const totals = useMemo(() => {
    return ledgerData.reduce((acc, txn) => {
      if (txn.direction === 'In') {
        acc.credit += txn.amount;
      } else {
        acc.debit += txn.amount;
      }
      return acc;
    }, { debit: 0, credit: 0 });
  }, [ledgerData]);

  const netFlow = totals.credit - totals.debit;

  const handlePrint = () => window.print();

  const categories: string[] = [
    'Loan Instalment', 'Savings', 'Adashe', 'Risk Premium', 
    'Admission Fee', 'Membership fee', 'Form/card', 
    'Withdrawal from bank', 'Bank Deposit', 'Adjustment/Refund', 
    'Salary & benefit', 'Other Fees'
  ];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">General Ledger</h2>
          <p className="text-slate-500 font-medium">Master record of all financial transactions.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
           {/* Date Range */}
           <div className="flex items-center bg-slate-50 rounded-xl px-2 border border-slate-200">
              <input 
                type="date" 
                className="bg-transparent border-none text-xs font-bold text-slate-600 p-2 outline-none"
                value={dateRange.start}
                onChange={e => setDateRange({...dateRange, start: e.target.value})}
              />
              <span className="text-slate-300">➜</span>
              <input 
                type="date" 
                className="bg-transparent border-none text-xs font-bold text-slate-600 p-2 outline-none"
                value={dateRange.end}
                onChange={e => setDateRange({...dateRange, end: e.target.value})}
              />
           </div>

           {/* Category Filter */}
           <select 
             className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
             value={filterCategory}
             onChange={e => setFilterCategory(e.target.value)}
           >
             <option value="All">All Categories</option>
             {categories.map(c => <option key={c} value={c}>{c}</option>)}
           </select>

           {/* Search */}
           <input 
             type="text" 
             placeholder="Search Ref, Name..." 
             className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 w-40"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />

           <button 
             onClick={handlePrint}
             className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-colors"
           >
             🖨️ Print
           </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
         <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total Credit (In)</div>
               <div className="text-3xl font-black text-emerald-700">₦{totals.credit.toLocaleString()}</div>
            </div>
            <div className="h-10 w-10 bg-emerald-200 rounded-full flex items-center justify-center text-xl">↙️</div>
         </div>
         
         <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black uppercase text-rose-600 tracking-widest mb-1">Total Debit (Out)</div>
               <div className="text-3xl font-black text-rose-700">₦{totals.debit.toLocaleString()}</div>
            </div>
            <div className="h-10 w-10 bg-rose-200 rounded-full flex items-center justify-center text-xl">↗️</div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Net Cash Flow</div>
               <div className={`text-3xl font-black ${netFlow >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {netFlow >= 0 ? '+' : ''}₦{netFlow.toLocaleString()}
               </div>
            </div>
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">⚖️</div>
         </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
         <h1 className="text-2xl font-black uppercase">General Ledger Account</h1>
         <p className="text-sm font-bold text-slate-500 uppercase">TEKAN PEACE DESK Microcredit</p>
         <div className="flex justify-between mt-4 text-[10px] font-bold uppercase">
            <span>Period: {dateRange.start} to {dateRange.end}</span>
            <span>Printed: {new Date().toLocaleDateString()}</span>
         </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-slate-800 print:rounded-none">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest print:bg-slate-100 print:text-black print:border-black">
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4">Ref ID</th>
                     <th className="px-6 py-4">Particulars</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4 text-right text-emerald-600 print:text-black">Credit (In)</th>
                     <th className="px-6 py-4 text-right text-rose-600 print:text-black">Debit (Out)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                  {ledgerData.length === 0 ? (
                     <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs italic">No transactions found for the selected criteria.</td></tr>
                  ) : (
                     ledgerData.map((txn, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors print:hover:bg-transparent">
                           <td className="px-6 py-3 font-mono text-xs text-slate-500 font-bold print:text-black">{txn.date}</td>
                           <td className="px-6 py-3 font-mono text-[10px] text-slate-400 print:text-black">{txn.id}</td>
                           <td className="px-6 py-3">
                              <div className="font-bold text-slate-700 text-xs print:text-black">{txn.borrowerName}</div>
                              <div className="text-[9px] text-slate-400 uppercase print:text-black">{txn.groupName} • {txn.notes || '-'}</div>
                           </td>
                           <td className="px-6 py-3">
                              <span className="px-2 py-1 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200 print:border-none print:bg-transparent print:p-0 print:text-black">
                                 {txn.category}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-right font-mono text-sm font-bold text-emerald-600 bg-emerald-50/10 print:bg-transparent print:text-black">
                              {txn.direction === 'In' ? `₦${txn.amount.toLocaleString()}` : '-'}
                           </td>
                           <td className="px-6 py-3 text-right font-mono text-sm font-bold text-rose-600 bg-rose-50/10 print:bg-transparent print:text-black">
                              {txn.direction === 'Out' ? `₦${txn.amount.toLocaleString()}` : '-'}
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
               <tfoot className="bg-slate-50 border-t-2 border-slate-200 print:bg-white print:border-black">
                  <tr>
                     <td colSpan={4} className="px-6 py-4 text-right font-black uppercase text-xs text-slate-600 tracking-widest print:text-black">Period Totals</td>
                     <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 print:text-black">₦{totals.credit.toLocaleString()}</td>
                     <td className="px-6 py-4 text-right font-mono font-black text-rose-700 print:text-black">₦{totals.debit.toLocaleString()}</td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>

      <div className="hidden print:flex justify-between mt-12 px-8 text-[10px] font-bold uppercase text-slate-900">
         <div className="text-center pt-8 border-t border-black w-40">Prepared By</div>
         <div className="text-center pt-8 border-t border-black w-40">Checked By</div>
         <div className="text-center pt-8 border-t border-black w-40">Approved By</div>
      </div>

    </div>
  );
};

export default GeneralLedger;
