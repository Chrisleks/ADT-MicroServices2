
import React, { useState, useMemo } from 'react';
import { Loan, LoanType } from '../types';
import { generateAmortizationSchedule } from '../utils/amortization';

interface LoanScheduleProps {
  loans: Loan[];
}

const LoanSchedule: React.FC<LoanScheduleProps> = ({ loans }) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'search' | 'calendar'>('search');
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const filteredLoans = loans.filter(l => 
    l.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
    l.id.includes(search)
  );

  const handlePrint = () => window.print();

  // --- CALENDAR DATA GENERATION ---
  const calendarData = useMemo(() => {
      // Flatten all schedules for all active loans using the utility
      const allSchedules = loans.flatMap(l => generateAmortizationSchedule(l));
      
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
      
      const grid = [];
      let day = 1;
      
      // Fill Grid
      // Rows (up to 6)
      for (let i = 0; i < 6; i++) {
          const row = [];
          for (let j = 0; j < 7; j++) {
              if (i === 0 && j < firstDay) {
                  row.push(null);
              } else if (day > daysInMonth) {
                  row.push(null);
              } else {
                  const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const events = allSchedules.filter(s => s.dueDate === dateStr);
                  row.push({ day, dateStr, events });
                  day++;
              }
          }
          if (row.some(d => d !== null)) grid.push(row);
      }
      return grid;
  }, [loans, currentMonth]);

  const changeMonth = (offset: number) => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentMonth(newDate);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Amortization Schedules</h2>
          <p className="text-slate-500 font-medium">Repayment planning and timeline.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setViewMode('search')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'search' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
                Search List
            </button>
            <button 
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >
                Calendar View
            </button>
        </div>
      </div>

      {viewMode === 'search' && (
        <>
            <div className="relative print:hidden">
                <input 
                type="text" 
                placeholder="Search Customer by Name or ID..." 
                className="w-full md:w-96 px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                value={search}
                onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <div className="absolute top-full left-0 w-full md:w-96 bg-white shadow-xl rounded-xl mt-2 border border-slate-100 max-h-60 overflow-auto z-50">
                    {filteredLoans.map(l => (
                        <button 
                            key={l.id}
                            onClick={() => { setSelectedLoan(l); setSearch(''); }}
                            className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                            <div className="font-bold text-sm text-slate-800">{l.borrowerName}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">{l.id} • {l.groupName}</div>
                        </button>
                    ))}
                    </div>
                )}
            </div>

            {selectedLoan ? (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none animate-slide-up">
                
                {/* Schedule Header */}
                <div className="bg-slate-900 p-8 text-white print:bg-white print:text-black print:border-b-2 print:border-slate-900">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-widest mb-1">Repayment Schedule</h1>
                            <div className="text-[10px] font-bold text-slate-400 uppercase print:text-slate-600">TEKAN PEACE DESK AWAKE MICROCREDIT SERVICES</div>
                        </div>
                        <div className="text-right print:hidden">
                            <button onClick={handlePrint} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
                                🖨️ Print Schedule
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Borrower</div>
                            <div className="text-xl font-black print:text-black">{selectedLoan.borrowerName}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Loan ID</div>
                            <div className="text-xl font-black font-mono print:text-black">{selectedLoan.id}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Principal Due</div>
                            <div className="text-xl font-black text-blue-400 print:text-black">₦{selectedLoan.principal.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Product</div>
                            <div className="text-xl font-black print:text-black">{selectedLoan.loanType.split(' ')[0]}</div>
                        </div>
                    </div>
                </div>

                {/* Schedule Table */}
                <div className="p-0">
                    {selectedLoan.loanDisbursementDate ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 print:bg-slate-100 print:text-black">
                            <tr>
                                <th className="px-8 py-4">Installment Period</th>
                                <th className="px-8 py-4">Due Date</th>
                                <th className="px-8 py-4 text-right">Amount Expected</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                            {generateAmortizationSchedule(selectedLoan).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 print:hover:bg-transparent">
                                    <td className="px-8 py-4 font-bold text-slate-700 print:text-black">{row.period}</td>
                                    <td className="px-8 py-4 font-mono text-sm text-slate-500 print:text-black">{new Date(row.dueDate).toLocaleDateString()}</td>
                                    <td className="px-8 py-4 text-right font-black text-slate-700 print:text-black">₦{row.amount.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase print:border print:border-black print:text-black ${
                                            row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                            row.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                            row.status === 'Overdue' ? 'bg-rose-100 text-rose-700' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right print:hidden">
                                        <span className="text-slate-300">___</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    ) : (
                        <div className="p-12 text-center text-slate-400 font-bold">
                            Loan not yet disbursed. Schedule unavailable.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-8 border-t border-slate-200 mt-0 print:bg-white print:border-t-2 print:border-black">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="text-center border-t-2 border-slate-300 pt-2 w-48 mx-auto">
                            <p className="text-[10px] font-black uppercase text-slate-400">Credit Officer Signature</p>
                        </div>
                        <div className="text-center border-t-2 border-slate-300 pt-2 w-48 mx-auto">
                            <p className="text-[10px] font-black uppercase text-slate-400">Customer Signature</p>
                        </div>
                    </div>
                    <div className="text-center mt-8 text-[9px] text-slate-400 font-bold uppercase">
                        Printed on {new Date().toLocaleString()} • ADTv2.0 System
                    </div>
                </div>

                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400">
                    <span className="text-6xl mb-4">🗓️</span>
                    <h3 className="text-lg font-bold uppercase tracking-widest">No Loan Selected</h3>
                    <p className="text-xs">Use the search bar above to find a borrower and view their schedule.</p>
                </div>
            )}
        </>
      )}

      {viewMode === 'calendar' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
              {/* Calendar Header */}
              <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-200">
                  <div className="flex items-center gap-4">
                      <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">◀</button>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest w-40 text-center">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">▶</button>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-400">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Overdue</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Due Today/Future</div>
                  </div>
              </div>

              {/* Calendar Grid */}
              <div className="w-full">
                  {/* Days Header */}
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="py-2 text-center text-[10px] font-black uppercase text-slate-400">{d}</div>
                      ))}
                  </div>
                  
                  {/* Days Cells */}
                  <div className="bg-slate-200 gap-px border-l border-slate-200">
                      {calendarData.map((row, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-7 gap-px">
                              {row.map((cell, cIdx) => (
                                  <div key={cIdx} className="bg-white min-h-[100px] p-2 relative group hover:bg-blue-50/20 transition-colors">
                                      {cell && (
                                          <>
                                              <span className={`text-xs font-bold ${
                                                  new Date().getDate() === cell.day && new Date().getMonth() === currentMonth.getMonth() ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-400'
                                              }`}>{cell.day}</span>
                                              
                                              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                                                  {cell.events.map((evt: any, i: number) => (
                                                      <div 
                                                        key={i} 
                                                        className={`text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${
                                                            evt.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            evt.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 opacity-50' :
                                                            'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}
                                                        title={`${evt.borrowerName} - ₦${evt.amount.toLocaleString()}`}
                                                      >
                                                          {evt.borrowerName.split(' ')[0]}
                                                      </div>
                                                  ))}
                                              </div>
                                              {cell.events.length > 3 && (
                                                  <div className="absolute bottom-1 right-1 text-[9px] font-black text-slate-300">+{cell.events.length - 3}</div>
                                              )}
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default LoanSchedule;
