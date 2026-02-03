
import React, { useEffect } from 'react';
import { Loan } from '../types';

interface FieldRegisterProps {
  loans: Loan[];
}

const FieldRegister: React.FC<FieldRegisterProps> = ({ loans }) => {
  const handlePrint = () => window.print();

  // Automatically trigger print dialog when the user clicks/navigates to this sheet
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 800); // Small delay to allow layout to settle
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">ADT Sheet</h2>
          <p className="text-slate-500 text-sm">Official weekly collection & audit record</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handlePrint}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
                <span>🖨️</span> Print ADT Sheet
            </button>
        </div>
      </div>

      <div className="bg-white p-6 border border-slate-300 rounded-sm shadow-sm overflow-x-auto print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-8 hidden print:block border-b-2 border-slate-800 pb-6">
          <h1 className="text-3xl font-black uppercase tracking-widest">TEKAN PEACE DESK Microcredit (ADT)</h1>
          <h2 className="text-xl font-bold uppercase tracking-widest text-slate-700 mt-2">ADT SHEET - WEEKLY REGISTER</h2>
          <div className="flex justify-between mt-6 px-10 text-[10px] font-black uppercase">
            <span>Branch: Central Office</span>
            <span>Period: Week ___ of 2024</span>
            <span>Printed: {new Date().toLocaleString()}</span>
          </div>
        </div>

        <table className="w-full text-left text-[8px] border-collapse border border-slate-800 min-w-[2000px] print:min-w-0">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-800 font-black text-slate-900 uppercase">
              <th className="p-2 border border-slate-800" rowSpan={2}>ID</th>
              <th className="p-2 border border-slate-800" rowSpan={2}>Group</th>
              <th className="p-2 border border-slate-800" rowSpan={2}>Customer Name</th>
              <th className="p-2 border border-slate-800" rowSpan={2}>CO</th>
              <th className="p-2 border border-slate-800 text-right" rowSpan={2}>Sav. Bal</th>
              <th className="p-2 border border-slate-800 text-right" rowSpan={2}>Ada. Bal</th>
              <th className="p-2 border border-slate-800 text-right" rowSpan={2}>Loan Bal</th>
              <th className="p-2 border border-slate-800 text-right" rowSpan={2}>Disb.</th>
              <th className="p-2 border border-slate-800" rowSpan={2}>Disb. Date</th>
              
              {[1, 2, 3, 4, 5].map(wk => (
                <th key={wk} className="p-1 border border-slate-800 text-center bg-blue-50 print:bg-slate-100" colSpan={3}>Week {wk}</th>
              ))}

              <th className="p-1 border border-slate-800 text-center bg-rose-50 print:bg-slate-100" colSpan={2}>Sav. Audit</th>
              <th className="p-1 border border-slate-800 text-center bg-rose-50 print:bg-slate-100" colSpan={2}>Ada. Audit</th>
            </tr>
            <tr className="bg-slate-50 border-b border-slate-800 font-bold text-[7px] uppercase">
              {[1,2,3,4,5].map(wk => (
                <React.Fragment key={wk}>
                  <th className="p-1 border border-slate-800 text-right">Sav</th>
                  <th className="p-1 border border-slate-800 text-right">Ada</th>
                  <th className="p-1 border border-slate-800 text-right">Loan</th>
                </React.Fragment>
              ))}
              <th className="p-1 border border-slate-800">WD Date</th>
              <th className="p-1 border border-slate-800">Adj.</th>
              <th className="p-1 border border-slate-800">WD Date</th>
              <th className="p-1 border border-slate-800">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loans.map(loan => {
               const paid = loan.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
               return (
                <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-1 border border-slate-800 font-mono font-black">{loan.id}</td>
                  <td className="p-1 border border-slate-800 font-bold">{loan.groupName}</td>
                  <td className="p-1 border border-slate-800 font-black">{loan.borrowerName}</td>
                  <td className="p-1 border border-slate-800 text-center font-bold text-blue-600 print:text-black">{loan.creditOfficer}</td>
                  <td className="p-1 border border-slate-800 text-right font-bold text-emerald-700 print:text-black">{loan.savingsBalance.toLocaleString()}</td>
                  <td className="p-1 border border-slate-800 text-right font-bold text-amber-700 print:text-black">{loan.adasheBalance.toLocaleString()}</td>
                  <td className="p-1 border border-slate-800 text-right font-bold text-blue-800 print:text-black">{(loan.principal - paid).toLocaleString()}</td>
                  <td className="p-1 border border-slate-800 text-right">{loan.loanDisbursementAmount.toLocaleString()}</td>
                  <td className="p-1 border border-slate-800">{loan.loanDisbursementDate}</td>
                  
                  {[1, 2, 3, 4, 5].map(wk => {
                    const wkd = (loan.weeks as any)[wk];
                    return (
                      <React.Fragment key={wk}>
                        <td className="p-1 border border-slate-800 text-right bg-blue-50/10">{wkd.savings || '-'}</td>
                        <td className="p-1 border border-slate-800 text-right bg-blue-50/10">{wkd.adashe || '-'}</td>
                        <td className="p-1 border border-slate-800 text-right bg-blue-50/10">{wkd.loan || '-'}</td>
                      </React.Fragment>
                    );
                  })}

                  <td className="p-1 border border-slate-800 text-slate-400 italic print:text-slate-300">___/___/___</td>
                  <td className="p-1 border border-slate-800 text-right font-bold text-rose-600 print:text-black">0.00</td>
                  <td className="p-1 border border-slate-800 text-slate-400 italic print:text-slate-300">___/___/___</td>
                  <td className="p-1 border border-slate-800 text-slate-400 italic print:text-slate-300">___/___/___</td>
                </tr>
               );
            })}
          </tbody>
        </table>
        
        <div className="mt-12 grid grid-cols-3 gap-12 text-center text-[10px] font-black uppercase tracking-widest hidden print:grid">
           <div className="border-t-2 border-slate-800 pt-3 flex flex-col items-center">
              <span>BDM Check & Sign</span>
              <span className="text-[8px] font-bold text-slate-500 mt-1">(Business Dev. Manager)</span>
           </div>
           <div className="border-t-2 border-slate-800 pt-3 flex flex-col items-center">
              <span>SFO Check & Sign</span>
              <span className="text-[8px] font-bold text-slate-500 mt-1">(Senior Finance Officer)</span>
           </div>
           <div className="border-t-2 border-slate-800 pt-3 flex flex-col items-center">
              <span>HOB Check & Sign</span>
              <span className="text-[8px] font-bold text-slate-500 mt-1">(Head of Business)</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FieldRegister;
