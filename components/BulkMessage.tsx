
import React, { useState, useMemo } from 'react';
import { Loan, LoanStatus } from '../types';
import { sendBulkSMS } from '../services/notificationService';

interface BulkMessageProps {
  loans: Loan[];
}

const BulkMessage: React.FC<BulkMessageProps> = ({ loans }) => {
  const [targetGroup, setTargetGroup] = useState('All');
  const [targetStatus, setTargetStatus] = useState('All');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const groups = Array.from(new Set(loans.map(l => l.groupName)));
  const statuses = Object.values(LoanStatus);

  // Filter Recipients
  const recipients = useMemo(() => {
    return loans.filter(l => {
        const matchesGroup = targetGroup === 'All' || l.groupName === targetGroup;
        const matchesStatus = targetStatus === 'All' || l.status === targetStatus;
        // Ensure valid phone number length (basic check)
        const hasPhone = l.phoneNumber && l.phoneNumber.length >= 10;
        return matchesGroup && matchesStatus && hasPhone;
    }).map(l => ({
        id: l.id,
        name: l.borrowerName,
        phone: l.phoneNumber,
        group: l.groupName
    }));
  }, [loans, targetGroup, targetStatus]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || recipients.length === 0) return;

    setIsSending(true);
    
    try {
        const result = await sendBulkSMS(recipients, message);
        if (result.success) {
            alert(`✅ Message broadcast successfully to ${result.count} customers.`);
            setMessage('');
        }
    } catch (error) {
        alert("Failed to send messages.");
    } finally {
        setIsSending(false);
    }
  };

  const templates = [
    "Dear Customer, your loan repayment is due this week. Please pay promptly to avoid penalties.",
    "TEKAN PEACE DESK: We will be visiting your group meeting this week. Please be present.",
    "Notice: Your savings balance has been updated. Check with your officer for details.",
    "Holiday Notice: The office will be closed on Friday. Operations resume Monday."
  ];

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
        <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Communication Hub</h2>
            <p className="text-slate-500 font-medium">Broadcast SMS alerts and notifications to customers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Configuration */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest mb-4">Target Audience</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Group</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={targetGroup}
                                onChange={e => setTargetGroup(e.target.value)}
                            >
                                <option value="All">All Groups</option>
                                {groups.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Status</label>
                            <select 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={targetStatus}
                                onChange={e => setTargetStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                {statuses.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📱</span>
                            <span className="text-xs font-bold text-blue-700">Recipients Selected:</span>
                        </div>
                        <span className="text-2xl font-black text-blue-800">{recipients.length}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest mb-4">Compose Message</h3>
                    <form onSubmit={handleSend} className="space-y-4">
                        <textarea 
                            rows={4} 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="Type your SMS message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={160}
                        ></textarea>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                            <span>{message.length} / 160 Characters</span>
                            <span>Cost Estimate: ₦{(recipients.length * 4).toLocaleString()}</span>
                        </div>
                        
                        <div className="pt-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Quick Templates</h4>
                            <div className="flex flex-wrap gap-2">
                                {templates.map((temp, i) => (
                                    <button 
                                        key={i}
                                        type="button"
                                        onClick={() => setMessage(temp)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors text-left"
                                    >
                                        {temp.substring(0, 30)}...
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSending || recipients.length === 0 || !message}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                <><span>⏳</span> Sending...</>
                            ) : (
                                <><span>🚀</span> Send Broadcast</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: Recipient Preview */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 max-h-[600px] flex flex-col">
                <h3 className="font-black text-slate-500 text-xs uppercase tracking-widest mb-4">Recipient List</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {recipients.length === 0 ? (
                        <div className="text-center text-slate-400 text-xs italic mt-10">No recipients match your filters.</div>
                    ) : (
                        recipients.map(r => (
                            <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-700 text-xs">{r.name}</div>
                                    <div className="text-[9px] text-slate-400 uppercase">{r.group}</div>
                                </div>
                                <div className="font-mono text-xs font-black text-slate-500">{r.phone}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default BulkMessage;
