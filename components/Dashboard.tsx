
import React, { useState, useMemo } from 'react';
import { Loan, LoanStatus, Payment } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';

interface DashboardProps {
  loans: Loan[];
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ loans, onNavigate }) => {
  // Date State
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });

  const [selectedOfficer, setSelectedOfficer] = useState<string>('All');

  // --- Calculations ---

  // 1. Financial Aggregates (Snapshot - Always Current Total)
  const totalPrincipal = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalSavings = loans.reduce((sum, l) => sum + l.savingsBalance, 0);
  const totalAdashe = loans.reduce((sum, l) => sum + l.adasheBalance, 0);
  
  // Calculate total repaid (All time)
  const totalRepaidAllTime = loans.reduce((sum, l) => {
    const paid = l.payments
      .filter(p => p.category === 'Loan Instalment' && p.direction === 'In')
      .reduce((pSum, p) => pSum + p.amount, 0);
    return sum + paid;
  }, 0);

  const outstandingBalance = totalPrincipal - totalRepaidAllTime;
  const repaymentRate = totalPrincipal > 0 ? (totalRepaidAllTime / totalPrincipal) * 100 : 0;

  // 2. Portfolio Health
  const activeLoans = loans.filter(l => l.status !== LoanStatus.LOSS);
  const nplLoans = loans.filter(l => [LoanStatus.SUBSTANDARD, LoanStatus.DOUBTFUL, LoanStatus.LOSS].includes(l.status));
  const nplRatio = (nplLoans.length / (loans.length || 1)) * 100;

  // 3. Recent Activity (Filtered by Date Range)
  const filteredTransactions = useMemo(() => {
    return loans
      .flatMap(l => l.payments.map(p => ({ ...p, borrowerName: l.borrowerName, group: l.groupName, loanId: l.id })))
      .filter(p => p.date >= dateRange.start && p.date <= dateRange.end)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort Descending by date
  }, [loans, dateRange]);

  const recentTransactionsDisplay = filteredTransactions.slice(0, 5);

  // 4. Chart Data: Status Distribution (Snapshot)
  const statusOrder = [LoanStatus.CURRENT, LoanStatus.WATCH, LoanStatus.SUBSTANDARD, LoanStatus.DOUBTFUL, LoanStatus.LOSS];
  
  const statusData = statusOrder.map(status => ({
    name: status,
    value: loans.filter(l => l.status === status).length
  })).filter(item => item.value > 0);

  // 5. Chart Data: Group Performance (Filtered by Date Range AND Officer)
  const officers = useMemo(() => ['All', ...Array.from(new Set(loans.map(l => l.creditOfficer))).sort()], [loans]);

  const groupPerformance = useMemo(() => {
    let relevantLoans = loans;
    
    // Filter by Officer if selected
    if (selectedOfficer !== 'All') {
        relevantLoans = loans.filter(l => l.creditOfficer === selectedOfficer);
    }

    return Array.from(new Set(relevantLoans.map(l => l.groupName))).map(group => {
      const groupLoans = relevantLoans.filter(l => l.groupName === group);
      
      // Disbursed: Sum of principal for loans disbursed in this period
      const disbursedInPeriod = groupLoans
        .filter(l => l.loanDisbursementDate >= dateRange.start && l.loanDisbursementDate <= dateRange.end)
        .reduce((s, l) => s + l.principal, 0);

      // Repaid: Sum of payments made in this period
      const repaidInPeriod = groupLoans.reduce((s, l) => {
        return s + l.payments
          .filter(p => p.category === 'Loan Instalment' && p.direction === 'In' && p.date >= dateRange.start && p.date <= dateRange.end)
          .reduce((ps, p) => ps + p.amount, 0);
      }, 0);

      return {
        name: group,
        Disbursed: disbursedInPeriod,
        Repaid: repaidInPeriod
      };
    });
  }, [loans, dateRange, selectedOfficer]);

  // Colors: Current (Green), Watch (Yellow), Substandard (Orange), Doubtful (Red), Loss (Black/Dark)
  const COLORS = {
    [LoanStatus.CURRENT]: '#10b981',
    [LoanStatus.WATCH]: '#facc15',
    [LoanStatus.SUBSTANDARD]: '#f97316',
    [LoanStatus.DOUBTFUL]: '#ef4444',
    [LoanStatus.LOSS]: '#1e293b',
  };

  const handleExportReport = () => {
    // Generate CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Transaction Date,Loan ID,Borrower Name,Group,Category,Direction,Amount,Notes\n";

    filteredTransactions.forEach(p => {
        const row = [
            p.date,
            p.loanId,
            `"${p.borrowerName}"`, // Quote name to handle commas
            p.group,
            p.category,
            p.direction,
            p.amount,
            `"${p.notes || ''}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ADT_Transaction_Report_${dateRange.start}_to_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Custom Tooltip Components ---
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-50 min-w-[180px]">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
            <p className="font-black text-slate-700 text-xs uppercase tracking-wide">{label}</p>
          </div>
          <div className="p-3 space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.fill }}></div>
                  <span className="text-slate-500 font-bold">{entry.name}</span>
                </div>
                <span className="font-mono font-black text-slate-700">
                  ₦{entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      // Calculate percentage based on total loans in the system
      const total = loans.length || 1;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      // Determine color
      const color = data.payload.fill || COLORS[data.name as LoanStatus] || '#000';

      return (
        <div className="bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden z-50 min-w-[160px]">
           <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
              <span className="font-black text-slate-700 text-xs uppercase tracking-wide">{data.name}</span>
           </div>
           <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <span className="text-slate-500 font-medium">Count</span>
              <span className="font-mono font-black text-slate-800 text-right">{data.value}</span>
              
              <span className="text-slate-500 font-medium">Share</span>
              <span className="font-mono font-black text-slate-800 text-right">{percentage}%</span>
           </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1">Overview of Financial Performance & Operations</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <input 
              type="date" 
              className="px-3 py-2 text-xs font-bold text-slate-600 outline-none border-r border-slate-100 bg-transparent hover:bg-slate-50 cursor-pointer"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              title="Start Date"
            />
            <div className="px-2 text-slate-300 text-[10px]">➜</div>
            <input 
              type="date" 
              className="px-3 py-2 text-xs font-bold text-slate-600 outline-none bg-transparent hover:bg-slate-50 cursor-pointer"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              title="End Date"
            />
          </div>
          <button 
            onClick={handleExportReport}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
          >
            <span>⬇</span> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Portfolio Value" 
          value={`₦${outstandingBalance.toLocaleString()}`} 
          subValue={`Total Principal: ₦${totalPrincipal.toLocaleString()}`}
          icon="💼" 
          trend="+2.5%" 
          trendUp={true}
          color="blue"
        />
        <StatCard 
          title="Total Savings" 
          value={`₦${totalSavings.toLocaleString()}`} 
          subValue="Security Funds"
          icon="🛡️" 
          trend="+12%" 
          trendUp={true}
          color="emerald"
        />
        <StatCard 
          title="Adashe Liquidity" 
          value={`₦${totalAdashe.toLocaleString()}`} 
          subValue="Daily Contributions"
          icon="🤝" 
          trend="+5%" 
          trendUp={true}
          color="amber"
        />
        <StatCard 
          title="Portfolio At Risk" 
          value={`${nplRatio.toFixed(1)}%`} 
          subValue={`${nplLoans.length} accounts at risk`}
          icon="⚠️" 
          trend="-1.2%" 
          trendUp={true} 
          color="rose"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Charts (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Group Performance</h3>
                 <p className="text-[10px] text-slate-400 font-bold mt-1">Activity from {dateRange.start} to {dateRange.end}</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 px-2 border border-slate-200">
                    <span className="text-[9px] font-black uppercase text-slate-400">Officer:</span>
                    <select 
                      className="text-[10px] font-bold uppercase outline-none bg-transparent focus:text-blue-600 text-slate-600 cursor-pointer"
                      value={selectedOfficer}
                      onChange={(e) => setSelectedOfficer(e.target.value)}
                    >
                      {officers.map(o => <option key={o} value={o}>{o === 'All' ? 'All' : o}</option>)}
                    </select>
                </div>
                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Disbursed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Repaid</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupPerformance} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="Disbursed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Repaid" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction Log</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1">Showing 5 most recent in selected range</p>
              </div>
              <button onClick={handleExportReport} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Download All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Time/ID</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTransactionsDisplay.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-slate-500">{txn.date}</div>
                        <div className="text-[9px] font-mono text-slate-300">{txn.id.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-700">{txn.borrowerName}</div>
                        <div className="text-[9px] text-slate-400">{txn.group}</div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase border ${
                           txn.direction === 'In' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                         }`}>
                           {txn.category}
                         </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold text-xs ${txn.direction === 'In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {txn.direction === 'In' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {recentTransactionsDisplay.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 italic">No transactions found in this date range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Summaries (1/3 width) */}
        <div className="space-y-8">
          
          {/* Loan Status Pie */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest w-full mb-4">Portfolio Health</h3>
            <div className="h-[250px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%" // Moved up slightly to make room for legend
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as LoanStatus]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }}
                    />
                  </PieChart>
               </ResponsiveContainer>
               {/* Center Text */}
               <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-700">{loans.length}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Total Loans</span>
               </div>
            </div>
            
            {/* Detailed List */}
            <div className="w-full mt-2 space-y-3 pt-4 border-t border-slate-50">
               {statusData.map((item, i) => {
                 const percentage = ((item.value / (loans.length || 1)) * 100).toFixed(1);
                 return (
                   <div key={item.name} className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[item.name as LoanStatus]}}></div>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</span>
                     </div>
                     <div className="text-right">
                        <span className="text-xs font-black text-slate-700">{item.value}</span>
                        <span className="text-[9px] font-bold text-slate-400 ml-1">({percentage}%)</span>
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-300">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <ActionButton icon="📝" label="New Loan" onClick={() => onNavigate('registration')} />
              <ActionButton icon="💰" label="Post Pymt" onClick={() => onNavigate('collections')} />
              <ActionButton icon="👥" label="Add Group" onClick={() => onNavigate('groups')} />
              <ActionButton icon="📊" label="Reports" onClick={() => onNavigate('reports')} />
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Repayment Rate</span>
                <span className="font-bold text-emerald-400">{repaymentRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${repaymentRate}%` }}></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const StatCard = ({ title, value, subValue, icon, trend, trendUp, color }: any) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 mt-1 mb-1">{value}</h3>
        <p className="text-[10px] font-medium text-slate-500">{subValue}</p>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) => (
  <button onClick={onClick} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group w-full">
    <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
    <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default Dashboard;
