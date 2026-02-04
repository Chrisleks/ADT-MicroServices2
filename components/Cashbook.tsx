
import React, { useEffect } from 'react';
import { Loan, Payment } from '../types';

interface CashbookProps {
  loans: Loan[];
}

const Cashbook: React.FC<CashbookProps> = ({ loans }) => {
  const handlePrint = () => window.print();

  // Auto-print when component loads (sheet behavior)
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const allPayments = loans.flatMap(l => l.payments);
  const dates = Array.from(new Set(allPayments.map(p => p.date))).sort((a: string, b: string) => b.localeCompare(a));

  const dailySummaries = dates.map(date => {
    const dayPayments = allPayments.filter(p => p.date === date);
    const getSum = (cat: string, dir: 'In' | 'Out') => 
      dayPayments.filter(p => p.category.includes(cat) && p.direction === dir)
                 .reduce((sum, p) => sum + p.amount, 0);

    return {
      date,
      loanIn: getSum('Loan', 'In'),
      loanOut: getSum('Loan', 'Out'),
      savingsIn: getSum('Savings', 'In'),
      savingsOut: getSum('Savings', 'Out'),
      adasheIn: getSum('Adashe', 'In'),
      adasheOut: getSum('Adashe', 'Out'),
      othersIn: dayPayments.filter(p => !['Loan', 'Savings', 'Adashe'].some(k => p.category.includes(k)) && p.direction === 'In').reduce((s, p) => s + p.amount, 0),
      othersOut: dayPayments.filter(p => !['Loan', 'Savings', 'Adashe'].some(k => p.category.includes(k)) && p.direction === 'Out').reduce((s, p) => s + p.amount, 0),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Daily Summary Cashbook</h2>
          <p className="text-slate-500 text-sm">Aggregated totals per business date</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2"
        >
          <span>🖨️</span> Print Cashbook
        </button>
      </div>

      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest">TEKAN PEACE DESK Microcredit (ADT)</h1>
        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-700">DAILY SUMMARY CASHBOOK</h2>
        <p className="text-[10px] font-black uppercase mt-2">Export Date: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden print:no-shadow print:border-slate-800 print:rounded-none">
        <table className="w-full text-left text-[11px] border-collapse print:text-[9px]">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 font-black text-slate-300 uppercase tracking-tighter print:bg-slate-100 print:text-black">
              <th className="px-4 py-4 border-r border-slate-800" rowSpan={2}>Date</th>
              <th className="px-4 py-2 border-r border-slate-800 text-center bg-blue-900/40 print:bg-transparent" colSpan={2}>Loan Fund</th>
              <th className="px-4 py-2 border-r border-slate-800 text-center bg-emerald-900/40 print:bg-transparent" colSpan={2}>Savings Fund</th>
              <th className="px-4 py-2 border-r border-slate-800 text-center bg-amber-900/40 print:bg-transparent" colSpan={2}>Adashe Fund</th>
              <th className="px-4 py-2 border-r border-slate-800 text-center bg-slate-800 print:bg-transparent" colSpan={2}>Other Fees</th>
              <th className="px-4 py-4 text-right bg-indigo-900 print:bg-transparent" rowSpan={2}>Net Day Cash</th>
            </tr>
            <tr className="bg-slate-800 border-b border-slate-700 font-black text-slate-400 uppercase text-[9px] print:bg-white print:text-black">
              <th className="px-2 py-2 border-r border-slate-700 text-right">In</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">Out</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">In</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">Out</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">In</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">Out</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">In</th>
              <th className="px-2 py-2 border-r border-slate-700 text-right">Out</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 print:divide-slate-800">
            {dailySummaries.map((summary) => {
              const totalIn = summary.loanIn + summary.savingsIn + summary.adasheIn + summary.othersIn;
              const totalOut = summary.loanOut + summary.savingsOut + summary.adasheOut + summary.othersOut;
              const net = totalIn - totalOut;

              return (
                <tr key={summary.date} className="hover:bg-slate-50 transition-colors font-medium">
                  <td className="px-4 py-3 border-r font-mono font-bold text-slate-700 print:text-black">{summary.date}</td>
                  <td className="px-2 py-3 border-r text-right text-blue-700 print:text-black">₦{summary.loanIn.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-rose-500 print:text-black">₦{summary.loanOut.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-emerald-700 print:text-black">₦{summary.savingsIn.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-rose-500 print:text-black">₦{summary.savingsOut.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-amber-700 print:text-black">₦{summary.adasheIn.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-rose-500 print:text-black">₦{summary.adasheOut.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-slate-600 print:text-black">₦{summary.othersIn.toLocaleString()}</td>
                  <td className="px-2 py-3 border-r text-right text-rose-500 print:text-black">₦{summary.othersOut.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-black ${net >= 0 ? 'text-indigo-700' : 'text-rose-700'} print:text-black`}>
                    ₦{net.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="hidden print:grid grid-cols-2 gap-20 mt-20 text-center text-[11px] font-black uppercase">
        <div className="border-t-2 border-slate-900 pt-3">Finance Manager</div>
        <div className="border-t-2 border-slate-900 pt-3">Internal Control Audit</div>
      </div>
    </div>
  );
};

export default Cashbook;
