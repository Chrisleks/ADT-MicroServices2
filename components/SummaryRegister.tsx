
import React, { useEffect } from 'react';
import { Loan } from '../types';

interface SummaryRegisterProps {
  loans: Loan[];
}

const SummaryRegister: React.FC<SummaryRegisterProps> = ({ loans }) => {
  const today = new Date().toISOString().split('T')[0];

  const handlePrint = () => window.print();

  useEffect(() => {
    // Optional: Only enable if user specifically wants "print on click" everywhere
    // handlePrint(); 
  }, []);
  
  const getDailyTotals = (type: 'Loan Instalment' | 'Savings' | 'Adashe') => {
    return loans.flatMap(l => l.payments)
      .filter(p => p.date === today && p.category === type)
      .reduce((sum, p) => sum + (p.direction === 'In' ? p.amount : -p.amount), 0);
  };

  const getPreviousBalances = (type: 'Loan' | 'Savings' | 'Adashe') => {
    if (type === 'Savings') return loans.reduce((sum, l) => sum + l.savingsBalance, 0) - getDailyTotals('Savings');
    if (type === 'Adashe') return loans.reduce((sum, l) => sum + l.adasheBalance, 0) - getDailyTotals('Adashe');
    
    const totalCurrentOutstanding = loans.reduce((sum, l) => {
      const paid = l.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((pSum, p) => pSum + p.amount, 0);
      return sum + (l.principal - paid);
    }, 0);
    return totalCurrentOutstanding + getDailyTotals('Loan Instalment');
  };

  const metrics = [
    { label: 'Loan Portfolio', today: getDailyTotals('Loan Instalment'), prev: getPreviousBalances('Loan'), color: 'text-blue-600' },
    { label: 'Savings Fund', today: getDailyTotals('Savings'), prev: getPreviousBalances('Savings'), color: 'text-emerald-600' },
    { label: 'Adashe Fund', today: getDailyTotals('Adashe'), prev: getPreviousBalances('Adashe'), color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Summary Register</h2>
          <p className="text-slate-500 text-sm">Daily collection reconciliation ({today})</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg"
        >
          Print Daily Summary
        </button>
      </div>

      <div className="text-center mb-8 hidden print:block border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-black uppercase">Daily Summary Register</h1>
        <p className="text-sm font-bold uppercase text-slate-500">TEKAN PEACE DESK - {today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:border-slate-800 print:rounded-none">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black">{m.label}</h3>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase print:text-black">Today's Collection</div>
                <div className={`text-2xl font-black ${m.color} print:text-black`}>₦{m.today.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold text-slate-400 uppercase print:text-black">Previous Balance</div>
                <div className="text-sm font-black text-slate-700 print:text-black">₦{m.prev.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 print:border-slate-800 print:rounded-none">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 print:text-black">Categorized Collections (Today)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
          {['Risk Premium', 'Admission Fee', 'Membership fee', 'Form/card', 'Bank Deposit'].map(cat => {
            const amount = loans.flatMap(l => l.payments).filter(p => p.date === today && p.category === cat).reduce((sum, p) => sum + p.amount, 0);
            return (
              <div key={cat} className="p-3 bg-slate-50 rounded-lg border border-slate-100 print:bg-white print:border-slate-800">
                <div className="text-[9px] font-bold text-slate-500 uppercase print:text-black">{cat}</div>
                <div className="text-lg font-black text-slate-800 print:text-black">₦{amount.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="hidden print:grid grid-cols-2 gap-10 mt-12 text-center text-[10px] font-black uppercase">
        <div className="border-t border-slate-800 pt-2">Cashier Signature</div>
        <div className="border-t border-slate-800 pt-2">Accountant Verified</div>
      </div>
    </div>
  );
};

export default SummaryRegister;
