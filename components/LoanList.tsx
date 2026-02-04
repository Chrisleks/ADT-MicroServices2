
import React, { useState, useMemo } from 'react';
import { Loan, LoanStatus, LoanType, CreditOfficer } from '../types';
import { analyzeRisk } from '../services/geminiService';
import { generateAmortizationSchedule } from '../utils/amortization';

interface LoanListProps {
  loans: Loan[];
  onDelete?: (id: string) => void;
}

const LoanList: React.FC<LoanListProps> = ({ loans, onDelete }) => {
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [filterOfficer, setFilterOfficer] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [scheduleLoan, setScheduleLoan] = useState<Loan | null>(null); // For Repayment Schedule
  
  const [riskData, setRiskData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Derive unique values for filters
  const groups = useMemo(() => Array.from(new Set(loans.map(l => l.groupName))), [loans]);
  const officers = Object.values(CreditOfficer);
  const loanTypes = Object.values(LoanType);

  // Filter Logic
  const filteredLoans = loans.filter(l => {
    const matchesGroup = filterGroup === 'All' || l.groupName === filterGroup;
    const matchesOfficer = filterOfficer === 'All' || l.creditOfficer === filterOfficer;
    const matchesType = filterType === 'All' || l.loanType === filterType;
    const matchesSearch = l.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) || l.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesOfficer && matchesType && matchesSearch;
  });

  // Aggregate Metrics for Filtered View
  const metrics = useMemo(() => {
    const totalPrincipal = filteredLoans.reduce((sum, l) => sum + l.principal, 0);
    const totalRepaid = filteredLoans.reduce((sum, l) => {
        return sum + l.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0);
    }, 0);
    const outstanding = totalPrincipal - totalRepaid;
    const savings = filteredLoans.reduce((sum, l) => sum + l.savingsBalance, 0);
    const atRisk = filteredLoans.filter(l => l.status !== LoanStatus.CURRENT).length;
    
    return { totalPrincipal, totalRepaid, outstanding, savings, atRisk };
  }, [filteredLoans]);

  const handleAnalyze = async (loan: Loan) => {
    setIsAnalyzing(true);
    setSelectedLoan(loan);
    const result = await analyzeRisk(loan);
    setRiskData(result);
    setIsAnalyzing(false);
  };

  const handleDelete = (loan: Loan) => {
    if (onDelete && window.confirm(`Are you sure you want to permanently delete the loan record for ${loan.borrowerName}? This action cannot be undone.`)) {
        onDelete(loan.id);
    }
  };

  const getStatusBadge = (status: LoanStatus) => {
    const styles = {
      [LoanStatus.CURRENT]: "bg-emerald-500 text-white border-emerald-600",
      [LoanStatus.WATCH]: "bg-yellow-400 text-yellow-900 border-yellow-500", // Standard/Watch - Yellow
      [LoanStatus.SUBSTANDARD]: "bg-orange-500 text-white border-orange-600", // Non-standard - Orange
      [LoanStatus.DOUBTFUL]: "bg-red-600 text-white border-red-700", // Doubtful - Red
      [LoanStatus.LOSS]: "bg-black text-white border-black" // Loss - Pure Black
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {status}
      </span>
    );
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Portfolio Manager</h2>
          <p className="text-slate-500 font-medium">Advanced filtering and risk analysis monitoring.</p>
        </div>
        
        {/* Advanced Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full xl:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
             <div className="absolute left-3 top-2.5 text-slate-400">🔍</div>
             <input 
              type="text"
              placeholder="Search ID or Name..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All Products</option>
            {loanTypes.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
          </select>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
            <option value="All">All Groups</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" value={filterOfficer} onChange={e => setFilterOfficer(e.target.value)}>
            <option value="All">All Officers</option>
            {officers.map(o => <option key={o as string} value={o as string}>{o as string}</option>)}
          </select>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryMetric label="Filtered Outstanding" value={metrics.outstanding} color="text-blue-600" bg="bg-blue-50" />
        <SummaryMetric label="Collection Progress" value={metrics.totalRepaid} color="text-emerald-600" bg="bg-emerald-50" sub={`Total: ₦${metrics.totalPrincipal.toLocaleString()}`} />
        <SummaryMetric label="Total Savings" value={metrics.savings} color="text-indigo-600" bg="bg-indigo-50" />
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col justify-center">
             <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest Risk Accounts">Risk Accounts</div>
             <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-rose-600">{metrics.atRisk}</span>
                <span className="text-xs font-bold text-rose-400 mb-1">of {filteredLoans.length}</span>
             </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/5">Repayment Progress</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Financials</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Health</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.map((loan) => {
                const totalPaid = loan.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((sum, p) => sum + p.amount, 0);
                const outstanding = loan.principal - totalPaid;
                const progress = loan.principal > 0 ? Math.min((totalPaid / loan.principal) * 100, 100) : 0;
                
                return (
                  <tr key={loan.id} className="group hover:bg-slate-50 transition-all duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-lg shadow-inner border border-white">
                           {loan.passportPhoto ? <img src={loan.passportPhoto} className="w-full h-full object-cover rounded-full" /> : "👤"}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800">{loan.borrowerName}</div>
                          <div className="flex gap-2 text-[10px] font-bold uppercase text-slate-400 mt-0.5">
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">#{loan.id}</span>
                             <span>{loan.groupName}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-700">{loan.loanType}</div>
                      <div className="text-[10px] font-medium text-slate-400 mt-1">
                        Disbursed: <span className="text-slate-600">{loan.loanDisbursementDate ? new Date(loan.loanDisbursementDate).toLocaleDateString() : 'Pending'}</span>
                      </div>
                      <div className="text-[10px] font-medium text-slate-400">
                        Officer: <span className="text-blue-500 font-bold">{loan.creditOfficer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-bold text-slate-500">Paid: ₦{totalPaid.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-500">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    progress >= 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-400'
                                }`} 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="mt-1 text-right text-[9px] font-bold text-rose-500">
                             Bal: ₦{outstanding.toLocaleString()}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="space-y-1">
                          <div className="flex justify-end gap-2 text-xs">
                             <span className="text-slate-400 font-medium text-[10px] uppercase pt-0.5">Sav</span>
                             <span className="font-bold text-emerald-600">₦{loan.savingsBalance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-end gap-2 text-xs">
                             <span className="text-slate-400 font-medium text-[10px] uppercase pt-0.5">Ada</span>
                             <span className="font-bold text-amber-600">₦{loan.adasheBalance.toLocaleString()}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {getStatusBadge(loan.status)}
                        {loan.dpd > 0 && (
                            <div className="text-[9px] font-bold text-rose-500 mt-1">{loan.dpd} Days Past Due</div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => setScheduleLoan(loan)}
                            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-blue-600 transition-colors"
                            title="View Amortization Schedule"
                          >
                            📅
                          </button>
                          <button 
                            onClick={() => handleAnalyze(loan)}
                            className="group/btn relative inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-all border border-indigo-100"
                            title="AI Risk Audit"
                          >
                            <span className="text-base">⚡</span>
                          </button>
                          {onDelete && (
                              <button 
                                onClick={() => handleDelete(loan)}
                                className="p-2 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-400 hover:text-rose-600 transition-colors"
                                title="Delete Record"
                              >
                                🗑️
                              </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredLoans.length === 0 && (
            <div className="p-12 text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-slate-800 font-bold">No loans found</h3>
                <p className="text-slate-500 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: AI Analysis */}
      {selectedLoan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLoan(null)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-slide-up">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-start">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">⚡</span>
                    <h3 className="text-xl font-black text-white tracking-tight">AI Risk Audit</h3>
                 </div>
                 <p className="text-slate-400 text-sm font-medium">Real-time analysis for <span className="text-white">{selectedLoan.borrowerName}</span></p>
              </div>
              <button onClick={() => setSelectedLoan(null)} className="text-white/50 hover:text-white transition-colors text-2xl">×</button>
            </div>

            <div className="p-8">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                   <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                   </div>
                   <p className="text-slate-500 font-bold animate-pulse">Analyzing credit patterns...</p>
                </div>
              ) : riskData ? (
                <div className="space-y-6">
                   {/* Score Display */}
                   <div className="flex items-center justify-center mb-4">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                         <svg className="w-full h-full transform -rotate-90">
                            <circle cx="64" cy="64" r="60" className="text-slate-100" strokeWidth="8" fill="none" stroke="currentColor" />
                            <circle 
                                cx="64" cy="64" r="60" 
                                className={`${riskData.riskScore > 7 ? 'text-rose-500' : riskData.riskScore > 4 ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                                strokeWidth="8" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeDasharray={377} 
                                strokeDashoffset={377 - (377 * riskData.riskScore) / 10} 
                            />
                         </svg>
                         <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-black text-slate-800">{riskData.riskScore}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Score</span>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Driver</div>
                         <div className="font-bold text-slate-800 leading-tight">{riskData.riskDriver}</div>
                      </div>
                      
                      <div className={`p-4 rounded-2xl border ${
                        selectedLoan.status === LoanStatus.CURRENT ? 'bg-emerald-50 border-emerald-100' :
                        selectedLoan.status === LoanStatus.WATCH ? 'bg-yellow-50 border-yellow-100' :
                        selectedLoan.status === LoanStatus.SUBSTANDARD ? 'bg-orange-50 border-orange-100' :
                        selectedLoan.status === LoanStatus.DOUBTFUL ? 'bg-red-50 border-red-100' :
                        'bg-black border-slate-900'
                      }`}>
                         <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                            selectedLoan.status === LoanStatus.LOSS ? 'text-slate-400' : 'opacity-60'
                         }`}>Status</div>
                         <div className={`font-bold leading-tight ${
                            selectedLoan.status === LoanStatus.LOSS ? 'text-white' : ''
                         }`}>{selectedLoan.status}</div>
                      </div>
                   </div>

                   <div className="bg-white border-l-4 border-indigo-500 pl-4 py-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommended Strategy</div>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{riskData.strategy}</p>
                   </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">Analysis failed. Please try again.</div>
              )}
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                <button onClick={() => setSelectedLoan(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Repayment Schedule */}
      {scheduleLoan && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setScheduleLoan(null)}></div>
             <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-slide-up flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-blue-600 p-6 flex justify-between items-start text-white">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Repayment Schedule</h3>
                        <p className="text-blue-200 text-xs mt-1">
                             {scheduleLoan.borrowerName} • {scheduleLoan.loanType}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="text-white/80 hover:text-white px-3 py-1 rounded bg-white/10 text-xs font-bold uppercase transition-colors">🖨️ Print</button>
                        <button onClick={() => setScheduleLoan(null)} className="text-blue-200 hover:text-white text-2xl">×</button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-0 overflow-auto flex-1">
                    {scheduleLoan.loanDisbursementDate ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Installment</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Expected</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {generateAmortizationSchedule(scheduleLoan).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-bold text-slate-700">{row.period}</td>
                                    <td className="px-6 py-3 font-mono text-slate-500 text-xs">{new Date(row.dueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 text-right font-black text-slate-700">₦{row.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                                            row.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                                            row.status === 'Partial' ? 'bg-blue-100 text-blue-600' :
                                            row.status === 'Overdue' ? 'bg-rose-100 text-rose-600' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    ) : (
                        <div className="p-8 text-center text-slate-400 font-bold text-sm">
                            Schedule unavailable. Loan has not been disbursed.
                        </div>
                    )}
                </div>

                {/* Footer Summary */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-xs">
                     <div className="text-slate-500 font-bold">
                         Total Due: <span className="text-slate-800">₦{scheduleLoan.principal.toLocaleString()}</span>
                     </div>
                     <div className="flex gap-4">
                         <div className="flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Paid
                         </div>
                         <div className="flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-rose-500"></div> Overdue
                         </div>
                     </div>
                </div>
             </div>
         </div>
      )}

    </div>
  );
};

const SummaryMetric = ({ label, value, color, bg, sub }: any) => (
  <div className={`${bg} p-4 rounded-2xl border border-opacity-50 flex flex-col justify-center`}>
    <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">{label}</div>
    <div className={`text-2xl font-black ${color}`}>₦{value.toLocaleString()}</div>
    {sub && <div className="text-[9px] font-bold opacity-50 mt-1">{sub}</div>}
  </div>
);

export default LoanList;
