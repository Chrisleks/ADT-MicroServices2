
import React from 'react';
import { Loan, LoanStatus, GroupSummary } from '../types';

interface ReportsProps {
  loans: Loan[];
}

const Reports: React.FC<ReportsProps> = ({ loans }) => {
  const handlePrint = () => window.print();

  const groupData = loans.reduce((acc: Record<string, GroupSummary>, loan) => {
    if (!acc[loan.groupName]) {
      acc[loan.groupName] = {
        groupName: loan.groupName,
        memberCount: 0,
        totalLoanBalance: 0,
        totalSavingsBalance: 0,
        totalAdasheBalance: 0
      };
    }
    const paid = loan.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((sum, p) => sum + p.amount, 0);
    acc[loan.groupName].memberCount++;
    acc[loan.groupName].totalLoanBalance += (loan.principal - paid);
    acc[loan.groupName].totalSavingsBalance += loan.savingsBalance;
    acc[loan.groupName].totalAdasheBalance += loan.adasheBalance;
    return acc;
  }, {} as Record<string, GroupSummary>);

  const groups = Object.values(groupData) as GroupSummary[];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Reports</h2>
          <p className="text-slate-500">Aggregate metrics for Groups and Collections</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2"
        >
          <span>🖨️</span> Print Performance Reports
        </button>
      </div>

      <div className="hidden print:block text-center border-b-4 border-slate-900 pb-6 mb-8">
        <h1 className="text-4xl font-black uppercase">Operational Performance Report</h1>
        <p className="text-lg font-bold text-slate-600 mt-2">TEKAN PEACE DESK Microcredit (ADT)</p>
        <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Date: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center print:bg-white print:border-b-2 print:border-slate-800">
            <h3 className="font-bold text-slate-800 text-sm uppercase">Group Portfolio Summary</h3>
            <span className="text-[10px] font-bold text-slate-400 tracking-widest print:text-black">{groups.length} GROUPS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm print:text-xs">
              <thead>
                <tr className="border-b border-slate-100 print:border-b-2 print:border-slate-800">
                  <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase print:text-black">Group Name</th>
                  <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase text-right print:text-black">Loan Bal</th>
                  <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase text-right print:text-black">Savings</th>
                  <th className="px-6 py-4 font-bold text-slate-400 text-[10px] uppercase text-right print:text-black">Adashe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-800">
                {groups.map(g => (
                  <tr key={g.groupName} className="hover:bg-slate-50 print:hover:bg-transparent">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700 print:text-black">{g.groupName}</div>
                      <div className="text-[10px] text-slate-400 print:text-black">{g.memberCount} Members</div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 font-medium print:text-black">₦{g.totalLoanBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-600 font-medium print:text-black">₦{g.totalSavingsBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-amber-600 font-medium print:text-black">₦{g.totalAdasheBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 print:mt-12">
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl print:bg-white print:text-black print:border-2 print:border-slate-800 print:rounded-none">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 print:text-black">Portfolio At Risk (PAR)</h3>
            <div className="space-y-4">
               {[LoanStatus.WATCH, LoanStatus.SUBSTANDARD, LoanStatus.DOUBTFUL, LoanStatus.LOSS].map(status => {
                 const amount = loans.filter(l => l.status === status).reduce((sum, l) => {
                    const paid = l.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
                    return sum + (l.principal - paid);
                 }, 0);
                 const count = loans.filter(l => l.status === status).length;
                 
                 const statusColors = {
                    [LoanStatus.WATCH]: "text-yellow-400",
                    [LoanStatus.SUBSTANDARD]: "text-orange-400",
                    [LoanStatus.DOUBTFUL]: "text-rose-400",
                    [LoanStatus.LOSS]: "text-slate-500"
                 };

                 return (
                   <div key={status} className="flex justify-between items-end border-b border-slate-800 pb-3 print:border-slate-300">
                     <div>
                       <div className={`text-xs font-bold uppercase print:text-black ${statusColors[status]}`}>{status}</div>
                       <div className="text-lg font-black">{count} <span className="text-[10px] text-slate-600">accts</span></div>
                     </div>
                     <div className="text-right">
                        <div className="text-lg font-mono text-blue-400 print:text-black">₦{amount.toLocaleString()}</div>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm print:border-2 print:border-slate-800 print:rounded-none">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 print:text-black">Officer Performance</h3>
             <div className="space-y-3">
               {['CD', 'CL', 'GPK'].map(off => {
                 const count = loans.filter(l => l.creditOfficer === off).length;
                 return (
                   <div key={off} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg print:bg-white print:border print:border-slate-200">
                     <span className="font-black text-slate-700 print:text-black">{off}</span>
                     <span className="text-xs text-slate-500 print:text-black">{count} Active Accounts</span>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
      
      <div className="hidden print:grid grid-cols-3 gap-12 text-center text-[10px] font-black uppercase tracking-widest mt-24">
         <div className="border-t-2 border-slate-800 pt-3">Head of Business</div>
         <div className="border-t-2 border-slate-800 pt-3">Branch Manager</div>
         <div className="border-t-2 border-slate-800 pt-3">Compliance Officer</div>
      </div>
    </div>
  );
};

export default Reports;
