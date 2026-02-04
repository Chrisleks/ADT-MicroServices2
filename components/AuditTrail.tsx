
import React, { useState } from 'react';
import { AuditLog } from '../types';

interface AuditTrailProps {
  logs: AuditLog[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(log => 
    log.actor.toLowerCase().includes(filter.toLowerCase()) ||
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.details.toLowerCase().includes(filter.toLowerCase())
  );

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex justify-between items-end print:hidden">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">System Audit Trail</h2>
                <p className="text-slate-500 font-medium">Complete record of system activities, changes, and security events.</p>
            </div>
            <div className="flex gap-4">
                 <input 
                   type="text" 
                   placeholder="Filter logs..." 
                   className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                   value={filter}
                   onChange={(e) => setFilter(e.target.value)}
                 />
                 <button 
                    onClick={handlePrint}
                    className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800"
                 >
                    🖨️ Print Log
                 </button>
            </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-black uppercase">Official System Audit Log</h1>
            <p className="text-sm font-bold text-slate-500 uppercase">TEKAN PEACE DESK AWAKE MICROCREDIT</p>
            <p className="text-xs mt-2">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
                <div className="text-[10px] font-bold uppercase opacity-60">Total Events</div>
                <div className="text-3xl font-black text-emerald-400">{logs.length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase text-slate-400">Critical Alerts</div>
                <div className="text-3xl font-black text-rose-500">{logs.filter(l => l.severity === 'CRITICAL').length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase text-slate-400">Warnings</div>
                <div className="text-3xl font-black text-amber-500">{logs.filter(l => l.severity === 'WARNING').length}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold uppercase text-slate-400">Information</div>
                <div className="text-3xl font-black text-blue-500">{logs.filter(l => l.severity === 'INFO').length}</div>
            </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-slate-800 print:rounded-none">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 print:bg-white print:text-black print:border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Actor</th>
                            <th className="px-6 py-4">Event Type</th>
                            <th className="px-6 py-4">Details</th>
                            <th className="px-6 py-4 text-center">Severity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No logs found matching your criteria.</td>
                            </tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-500 print:text-black">
                                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'} <br/>
                                        <span className="text-[9px] opacity-60 print:opacity-100">{log.timestamp ? new Date(log.timestamp).toLocaleDateString() : '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 print:text-black">
                                        <div className="font-bold text-slate-700 capitalize">{log.actor}</div>
                                        <div className="text-[9px] text-slate-400 uppercase print:text-black">{log.role}</div>
                                    </td>
                                    <td className="px-6 py-4 print:text-black">
                                        <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 print:border-none print:bg-transparent print:p-0">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 max-w-md break-words print:text-black">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 text-center print:text-black">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase print:border print:border-black print:text-black ${
                                            log.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' :
                                            log.severity === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                            'bg-blue-50 text-blue-500'
                                        }`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AuditTrail;
