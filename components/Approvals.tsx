
import React from 'react';
import { Loan, UserRole, ApprovalStatus, TransactionRequest } from '../types';

interface ApprovalsProps {
  loans: Loan[];
  role: UserRole;
  onApproveLoan: (loanId: string, currentStatus: ApprovalStatus) => void;
  onRejectLoan: (loanId: string) => void;
  onApproveTransaction: (loanId: string, requestId: string, currentStatus: ApprovalStatus) => void;
  onRejectTransaction: (loanId: string, requestId: string) => void;
}

const Approvals: React.FC<ApprovalsProps> = ({ loans, role, onApproveLoan, onRejectLoan, onApproveTransaction, onRejectTransaction }) => {
  
  // Filter Logic: What can this user see?
  const getRelevantStatus = (): ApprovalStatus[] => {
    switch (role) {
      case UserRole.BDM: return [ApprovalStatus.PENDING_BDM]; // Step 1: BDM Review
      case UserRole.SFO: return [ApprovalStatus.PENDING_SFO]; // Step 2: SFO Verification
      case UserRole.HOB: return [ApprovalStatus.PENDING_HOB]; // Step 3: HOB Finalization
      case UserRole.MASTER_ADMIN: return [ApprovalStatus.PENDING_BDM, ApprovalStatus.PENDING_SFO, ApprovalStatus.PENDING_HOB];
      default: return [];
    }
  };

  const relevantStatuses = getRelevantStatus();

  // Helper for dynamic button text
  const getNextActionLabel = (currentStatus: ApprovalStatus) => {
    switch (currentStatus) {
      case ApprovalStatus.PENDING_BDM: return "Approve & Send to SFO";
      case ApprovalStatus.PENDING_SFO: return "Verify & Send to HOB";
      case ApprovalStatus.PENDING_HOB: return "Final Approval";
      default: return "Approve";
    }
  };

  // 1. Pending Loan Disbursements
  const pendingLoans = loans.filter(l => relevantStatuses.includes(l.disbursementStatus));

  // 2. Pending Transaction Requests (Flattened)
  const pendingTransactions = loans.flatMap(l => 
    (l.pendingRequests || []).filter(r => relevantStatuses.includes(r.status))
    .map(r => ({ ...r, loanGroup: l.groupName }))
  );

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Approvals Center</h2>
          <p className="text-slate-500 font-medium">Pending items requiring your authorization.</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 uppercase">
           Role: <span className="text-blue-600">{role}</span>
        </div>
      </div>

      {/* SECTION 1: LOAN DISBURSEMENTS */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
            <span className="text-xl">💼</span>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">New Loan Applications</h3>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{pendingLoans.length}</span>
        </div>

        {pendingLoans.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200 border-dashed text-slate-400 font-bold text-sm">
                No pending loan applications for your review.
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingLoans.map(loan => (
                    <div key={loan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-slate-800 text-lg">{loan.borrowerName}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase">{loan.groupName} • ID: {loan.id}</p>
                                </div>
                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200">
                                    {loan.disbursementStatus}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase">Amount</span>
                                    <span className="text-lg font-black text-blue-600">₦{loan.loanDisbursementAmount.toLocaleString()}</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase">Type</span>
                                    <span className="text-sm font-bold text-slate-700">{loan.loanType}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 font-medium">Credit Officer</span>
                                    <span className="font-bold text-slate-700">{loan.creditOfficer}</span>
                                </div>
                                <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                                    <span className="text-slate-500 font-medium">Guarantor</span>
                                    <span className="font-bold text-slate-700">{loan.guarantorName}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex gap-3">
                             <button 
                               onClick={() => onRejectLoan(loan.id)}
                               className="flex-1 bg-white border border-rose-200 text-rose-600 py-2 rounded-xl text-xs font-black uppercase hover:bg-rose-50 transition-colors"
                             >
                                Reject
                             </button>
                             <button 
                               onClick={() => onApproveLoan(loan.id, loan.disbursementStatus)}
                               className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-black uppercase shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                             >
                                <span>✓</span> {getNextActionLabel(loan.disbursementStatus)}
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* SECTION 2: TRANSACTION REQUESTS */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Withdrawal Requests</h3>
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">{pendingTransactions.length}</span>
        </div>

        {pendingTransactions.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200 border-dashed text-slate-400 font-bold text-sm">
                No pending withdrawal requests.
            </div>
        ) : (
            <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Request ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {pendingTransactions.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-slate-500">{req.id}</td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-700">{req.borrowerName}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase">{req.loanGroup}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[10px] font-bold uppercase border border-amber-100">
                                        {req.category} Withdrawal
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-rose-600">
                                    -₦{req.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{req.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                     <button 
                                       onClick={() => onRejectTransaction(req.loanId, req.id)}
                                       className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold" title="Reject"
                                     >
                                        ✕
                                     </button>
                                     <button 
                                       onClick={() => onApproveTransaction(req.loanId, req.id, req.status)}
                                       className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-[10px] uppercase flex items-center gap-1" title="Approve"
                                     >
                                        <span>✓</span> {getNextActionLabel(req.status).split(' ')[0]}
                                     </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

    </div>
  );
};

export default Approvals;
