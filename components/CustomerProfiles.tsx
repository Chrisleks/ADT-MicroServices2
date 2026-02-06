
import React, { useState, useEffect, useRef } from 'react';
import { Loan, LoanType, LoanStatus, ActivityLog } from '../types';
import { sanitizeInput } from '../utils/security';

interface CustomerProfilesProps {
  loans: Loan[];
  onUpdateLoan: (loan: Loan) => void;
  onDeleteLoan: (id: string) => void;
  onDeleteTransaction: (loanId: string, txnId: string) => void;
}

const CustomerProfiles: React.FC<CustomerProfilesProps> = ({ loans, onUpdateLoan, onDeleteLoan, onDeleteTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Loan | null>(null);

  // Activity Log State
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState<ActivityLog['type']>('Field Visit');

  // Delete Confirmation State
  const [deleteCandidate, setDeleteCandidate] = useState<Loan | null>(null);

  // Ledger State
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);

  // Camera State
  const [activeCamera, setActiveCamera] = useState<'passport' | 'loanForm' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredList = loans.filter(l => 
    l.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.id.includes(searchTerm)
  );

  const customer = loans.find(l => l.id === selectedId);

  // Reset editing mode when selection changes
  useEffect(() => {
    setIsEditing(false);
    setEditForm(null);
    stopCamera();
    setIsLedgerExpanded(false); // Reset ledger collapse state
    setNewNote('');
  }, [selectedId]);

  // Stop camera if editing is cancelled
  useEffect(() => {
    if (!isEditing) stopCamera();
  }, [isEditing]);

  const handleEdit = () => {
    if (customer) {
      setEditForm({ ...customer });
      setIsEditing(true);
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent, loan: Loan) => {
    e.stopPropagation(); // Prevent selection when clicking delete
    setDeleteCandidate(loan);
  };

  const confirmDelete = () => {
    if (deleteCandidate) {
      onDeleteLoan(deleteCandidate.id);
      if (selectedId === deleteCandidate.id) setSelectedId(null);
      setDeleteCandidate(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm) {
      // SECURITY: Sanitize all string inputs before saving to state/DB
      const sanitizedForm = {
        ...editForm,
        borrowerName: sanitizeInput(editForm.borrowerName),
        phoneNumber: sanitizeInput(editForm.phoneNumber),
        address: sanitizeInput(editForm.address),
        groupName: sanitizeInput(editForm.groupName),
        creditOfficer: sanitizeInput(editForm.creditOfficer),
        nextOfKinName: sanitizeInput(editForm.nextOfKinName),
        nextOfKinPhone: sanitizeInput(editForm.nextOfKinPhone),
        guarantorName: sanitizeInput(editForm.guarantorName),
        guarantorPhone: sanitizeInput(editForm.guarantorPhone),
        guarantorAddress: sanitizeInput(editForm.guarantorAddress),
      };

      onUpdateLoan(sanitizedForm);
      setIsEditing(false);
    }
  };

  const handleAddNote = () => {
    if (!customer || !newNote.trim()) return;
    
    // SECURITY: Sanitize notes to prevent script injection in timelines
    const cleanNote = sanitizeInput(newNote);

    const newActivity: ActivityLog = {
        id: `LOG-${Date.now()}`,
        date: new Date().toISOString(),
        officer: customer.creditOfficer,
        type: activityType,
        notes: cleanNote,
        flagged: activityType === 'Arrears Follow-up'
    };

    const updatedLoan = {
        ...customer,
        activityLog: [newActivity, ...(customer.activityLog || [])]
    };

    onUpdateLoan(updatedLoan);
    setNewNote('');
  };

  // --- LOYALTY LOGIC ---
  const getLoyaltyMetrics = (loan: Loan) => {
    let score = 100;
    score -= (loan.dpd * 2);
    score += Math.min(20, (loan.loanCycle - 1) * 5);
    score = Math.max(0, Math.min(100, score));
    
    let tier = 'Bronze';
    let gradient = 'from-orange-700 to-amber-900';
    let limitMultiplier = 1.0;
    
    if (score >= 90) {
        tier = 'Platinum';
        gradient = 'from-slate-700 to-slate-900';
        limitMultiplier = 2.0;
    } else if (score >= 75) {
        tier = 'Gold';
        gradient = 'from-yellow-500 to-amber-600';
        limitMultiplier = 1.5;
    } else if (score >= 60) {
        tier = 'Silver';
        gradient = 'from-slate-400 to-slate-500';
        limitMultiplier = 1.2;
    }
    
    return { score, tier, gradient, limitMultiplier };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'passportPhoto' | 'loanFormPhoto') => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Camera Functions ---
  const startCamera = async (type: 'passport' | 'loanForm') => {
    setActiveCamera(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      // Small delay to allow render
      setTimeout(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error("Camera Error:", err);
      alert("Could not access camera. Please ensure permissions are granted.");
      setActiveCamera(null);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setActiveCamera(null);
  };

  const capturePhoto = (field: 'passportPhoto' | 'loanFormPhoto') => {
    if (videoRef.current && canvasRef.current && editForm) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditForm({ ...editForm, [field]: dataUrl });
        stopCamera();
      }
    }
  };

  const renderImageInput = (label: string, field: 'passportPhoto' | 'loanFormPhoto', cameraType: 'passport' | 'loanForm') => {
      const value = editForm ? editForm[field] : '';
      
      if (activeCamera === cameraType) {
         return (
             <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                 <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] shadow-lg border border-slate-300">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 z-10">
                        <button type="button" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border border-white/20">Cancel</button>
                        <button type="button" onClick={() => capturePhoto(field)} className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95 transition-transform"><div className="w-10 h-10 bg-white rounded-full"></div></button>
                    </div>
                 </div>
             </div>
         );
      }

      return (
         <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</label>
            <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                    {value ? <img src={value} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>}
                </div>
                <div className="flex flex-col gap-2">
                    <button 
                       type="button" 
                       onClick={() => startCamera(cameraType)} 
                       className="bg-blue-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                       <span>📸</span> Take Photo
                    </button>
                    <label className="cursor-pointer bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <span>📂</span> Upload File
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, field)} />
                    </label>
                    {value && (
                        <button type="button" onClick={() => editForm && setEditForm({...editForm, [field]: ''})} className="text-rose-500 text-[10px] font-bold uppercase hover:underline text-left px-1">Remove</button>
                    )}
                </div>
            </div>
         </div>
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Profiles</h2>
          <p className="text-slate-500 text-sm">Customer repository and search</p>
        </div>
        <input 
          type="text"
          placeholder="Search Customer..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="space-y-2 max-h-[700px] overflow-auto pr-2">
          {filteredList.map(l => (
            <div
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`w-full p-4 rounded-xl text-left transition-all border flex items-center gap-4 group relative cursor-pointer ${
                selectedId === l.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
              }`}
            >
              {/* Delete Button in List */}
              <div className="absolute top-2 right-2 z-20">
                  <button 
                    onClick={(e) => handleDeleteRequest(e, l)}
                    className={`p-2 rounded-lg font-bold text-lg leading-none transition-all shadow-sm ${
                        selectedId === l.id 
                        ? 'bg-white/20 text-white hover:bg-white hover:text-rose-600' 
                        : 'bg-white text-rose-500 border border-slate-200 hover:bg-rose-500 hover:text-white hover:border-rose-500'
                    }`}
                    title="Permanently Delete"
                  >
                    🗑️
                  </button>
              </div>

              <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/20">
                {l.passportPhoto ? <img src={l.passportPhoto} className="w-full h-full object-cover" /> : <span className="text-xs">👤</span>}
              </div>
              <div className="flex-1 pr-10">
                <div className="text-[9px] font-bold uppercase opacity-60 leading-none mb-1">ID: {l.id}</div>
                <div className="font-black text-sm leading-tight truncate">{l.borrowerName}</div>
                <div className="text-[9px] font-bold opacity-80 uppercase tracking-widest">{l.groupName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {customer ? (
          isEditing && editForm ? (
            // Edit Mode
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="font-black uppercase tracking-widest">Edit Profile: {customer.borrowerName}</h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white text-xs font-bold uppercase">Cancel</button>
                </div>
                <form onSubmit={handleSave} className="p-8 space-y-6">
                    {/* ... (Existing form fields remain unchanged) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Full Legal Name</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.borrowerName} onChange={e => setEditForm({...editForm, borrowerName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Phone Number</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date of Birth</label>
                            <input type="date" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.dateOfBirth} onChange={e => setEditForm({...editForm, dateOfBirth: e.target.value})} />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Address</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                         </div>
                         
                         <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                            <label className="text-xs font-black text-blue-600 uppercase tracking-widest">Documents</label>
                         </div>
                         <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                             {renderImageInput('Passport Photograph', 'passportPhoto', 'passport')}
                             {renderImageInput('Signed Loan Form', 'loanFormPhoto', 'loanForm')}
                         </div>

                         <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                            <label className="text-xs font-black text-blue-600 uppercase tracking-widest">Operational Details</label>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Group Name</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.groupName} onChange={e => setEditForm({...editForm, groupName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Credit Officer</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.creditOfficer} onChange={e => setEditForm({...editForm, creditOfficer: e.target.value})} />
                         </div>

                         {/* Financial Details Section */}
                         <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2 bg-slate-50/50 p-4 rounded-xl border-dashed border-2 border-slate-200">
                             <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">💰</span>
                                <label className="text-xs font-black text-emerald-600 uppercase tracking-widest">Financial Balances & Product</label>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Loan Product</label>
                                    <select 
                                        className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white"
                                        value={editForm.loanType}
                                        onChange={e => setEditForm({...editForm, loanType: e.target.value as LoanType})}
                                    >
                                        {Object.values(LoanType).map(t => (
                                            <option key={t as string} value={t as string}>{t as string}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Disbursement Date</label>
                                    <input type="date" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white" value={editForm.loanDisbursementDate} onChange={e => setEditForm({...editForm, loanDisbursementDate: e.target.value})} />
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Disbursement Amt (₦)</label>
                                    <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white" value={editForm.loanDisbursementAmount} onChange={e => setEditForm({...editForm, loanDisbursementAmount: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Principal Due (₦)</label>
                                    <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white" value={editForm.principal} onChange={e => setEditForm({...editForm, principal: parseFloat(e.target.value) || 0})} />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Loan Due Date</label>
                                    <input type="date" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white" value={editForm.dueDate} onChange={e => setEditForm({...editForm, dueDate: e.target.value})} />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Savings Balance (₦)</label>
                                    <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-emerald-700 bg-emerald-50" value={editForm.savingsBalance} onChange={e => setEditForm({...editForm, savingsBalance: parseFloat(e.target.value) || 0})} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Adashe Balance (₦)</label>
                                    <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-amber-700 bg-amber-50" value={editForm.adasheBalance} onChange={e => setEditForm({...editForm, adasheBalance: parseFloat(e.target.value) || 0})} />
                                </div>
                             </div>
                         </div>

                         <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                            <label className="text-xs font-black text-blue-600 uppercase tracking-widest">Next of Kin</label>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kin Name</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.nextOfKinName} onChange={e => setEditForm({...editForm, nextOfKinName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kin Phone</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.nextOfKinPhone} onChange={e => setEditForm({...editForm, nextOfKinPhone: e.target.value})} />
                         </div>

                         <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                            <label className="text-xs font-black text-blue-600 uppercase tracking-widest">Guarantor</label>
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Guarantor Name</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.guarantorName} onChange={e => setEditForm({...editForm, guarantorName: e.target.value})} />
                         </div>
                         <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Guarantor Phone</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.guarantorPhone} onChange={e => setEditForm({...editForm, guarantorPhone: e.target.value})} />
                         </div>
                         <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Guarantor Address</label>
                            <input type="text" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-700 bg-slate-50" value={editForm.guarantorAddress} onChange={e => setEditForm({...editForm, guarantorAddress: e.target.value})} />
                         </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 text-xs uppercase tracking-widest">Cancel</button>
                        <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-700">Save Changes</button>
                    </div>
                </form>
            </div>
          ) : (
            // View Details
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    {/* Background Noise */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-white/10 overflow-hidden shadow-2xl">
                                {customer.passportPhoto ? (
                                <img src={customer.passportPhoto} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-4xl font-black tracking-tighter leading-tight">{customer.borrowerName}</h3>
                                <div className="flex gap-4 mt-2 items-center">
                                    <span className="text-[10px] bg-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">ID: {customer.id}</span>
                                    <span className="text-[10px] bg-slate-700 px-3 py-1 rounded-full font-black uppercase tracking-widest">{customer.groupName}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* LOYALTY CARD VISUALIZATION */}
                        <div className={`w-64 h-36 rounded-xl shadow-2xl relative overflow-hidden p-4 flex flex-col justify-between border border-white/10 bg-gradient-to-br ${getLoyaltyMetrics(customer).gradient}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            
                            <div className="flex justify-between items-start">
                                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">Loyalty Status</span>
                                <span className="text-2xl">👑</span>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-xl font-black uppercase tracking-widest text-white shadow-sm">{getLoyaltyMetrics(customer).tier} MEMBER</div>
                                <div className="text-[9px] font-bold text-white/80 mt-1">Score: {getLoyaltyMetrics(customer).score} / 100</div>
                            </div>

                            <div className="flex justify-between items-end border-t border-white/20 pt-2">
                                <div className="text-[8px] text-white/70 font-bold uppercase">Next Limit: {getLoyaltyMetrics(customer).limitMultiplier}x</div>
                                <div className="text-[8px] text-white/70 font-bold uppercase">TEKAN PRIVILEGE</div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Actions */}
                    <div className="flex justify-between items-center mt-8 border-t border-white/10 pt-4 relative z-10">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Reg Date: <span className="text-white">{customer.dateOfRegistration ? new Date(customer.dateOfRegistration).toLocaleDateString() : 'N/A'}</span> • Officer: <span className="text-blue-400">{customer.creditOfficer}</span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleEdit} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors border border-white/10">
                                <span>✏️</span> Edit Profile
                            </button>
                            <button 
                                onClick={(e) => handleDeleteRequest(e, customer)} 
                                className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
                            >
                                <span>🗑️</span> Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BalanceCard label="Outstanding Loan" value={customer.principal - customer.payments.filter(p => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s, p) => s + p.amount, 0)} color="text-blue-600" />
                    <BalanceCard label="Total Savings" value={customer.savingsBalance} color="text-emerald-600" />
                    <BalanceCard label="Adashe Balance" value={customer.adasheBalance} color="text-amber-600" />
                </div>

                {/* CRM SECTION */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🗂️</span>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Activity Log & CRM</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{customer.activityLog?.length || 0} Entries</span>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* New Entry Form */}
                        <div className="md:col-span-1 border-r border-slate-200 pr-0 md:pr-8">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Log New Activity</h5>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Interaction Type</label>
                                    <select 
                                        className="w-full p-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                                        value={activityType}
                                        onChange={(e) => setActivityType(e.target.value as any)}
                                    >
                                        <option>Field Visit</option>
                                        <option>Phone Call</option>
                                        <option>Office Meeting</option>
                                        <option>Arrears Follow-up</option>
                                        <option>Note</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Observation / Note</label>
                                    <textarea 
                                        rows={4}
                                        className="w-full p-3 text-xs border border-slate-300 rounded-lg bg-white resize-none"
                                        placeholder="Enter details about the interaction..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                    ></textarea>
                                </div>
                                <button 
                                    onClick={handleAddNote}
                                    disabled={!newNote}
                                    className="w-full bg-slate-900 text-white py-2 rounded-lg text-[10px] font-black uppercase hover:bg-slate-800 disabled:opacity-50"
                                >
                                    Add Entry
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="md:col-span-2 max-h-64 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                {(!customer.activityLog || customer.activityLog.length === 0) ? (
                                    <div className="text-center py-10 text-slate-400 text-xs italic">No activity recorded yet.</div>
                                ) : (
                                    customer.activityLog.map((log) => (
                                        <div key={log.id} className={`relative pl-4 border-l-2 ${log.flagged ? 'border-rose-400' : 'border-slate-200'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                    log.type === 'Arrears Follow-up' ? 'bg-rose-100 text-rose-700' : 
                                                    log.type === 'Field Visit' ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {log.type}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                                {log.notes}
                                            </p>
                                            <div className="mt-1 text-[9px] text-slate-400 font-bold uppercase">Officer: {log.officer}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <span className="text-base">📍</span> Personal Information
                    </h4>
                    <div className="space-y-3 text-xs">
                        <ProfileRow label="Phone Number" value={customer.phoneNumber} />
                        <ProfileRow label="Date of Birth" value={customer.dateOfBirth} />
                        <ProfileRow label="Home Address" value={customer.address} />
                        <ProfileRow label="Loan Product" value={customer.loanType} />
                        <ProfileRow label="Disbursement" value={`₦${customer.loanDisbursementAmount.toLocaleString()}`} />
                        <ProfileRow label="Loan Due Date" value={customer.dueDate ? new Date(customer.dueDate).toLocaleDateString() : 'N/A'} />
                    </div>
                    </div>

                    <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                        <span className="text-base">🤝</span> Kin & Guarantor
                    </h4>
                    <div className="space-y-3 text-xs">
                        <ProfileRow label="Next of Kin" value={customer.nextOfKinName} />
                        <ProfileRow label="Kin Phone" value={customer.nextOfKinPhone} />
                        <div className="pt-2 border-t border-slate-50"></div>
                        <ProfileRow label="Guarantor" value={customer.guarantorName} />
                        <ProfileRow label="Guarantor Phone" value={customer.guarantorPhone} />
                        <ProfileRow label="Guarantor Addr" value={customer.guarantorAddress} />
                    </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                    <span className="text-base">📂</span> Document Vault
                    </h4>
                    <div className="flex gap-8">
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Passport</p>
                        <div className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                        {customer.passportPhoto ? <img src={customer.passportPhoto} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-slate-300">N/A</div>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Loan Form</p>
                        <div className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
                        {customer.loanFormPhoto ? <img src={customer.loanFormPhoto} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-slate-300">N/A</div>}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
                        className="w-full flex items-center justify-between group py-4 px-6 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${isLedgerExpanded ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}`}>
                                💳
                            </div>
                            <div className="text-left">
                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-blue-700 transition-colors">
                                    Transaction History
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                    {customer.payments.length} Records • Total Volume: ₦{customer.payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <span className={`text-slate-400 transition-transform duration-300 ${isLedgerExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {isLedgerExpanded && (
                        <div className="max-h-80 overflow-auto rounded-2xl border border-slate-200 shadow-inner bg-white animate-slide-up">
                            {customer.payments.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs italic">No transactions found for this profile.</div>
                            ) : (
                                <table className="w-full text-left text-[10px]">
                                <thead className="bg-slate-50 font-black text-slate-500 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                                    <tr>
                                    <th className="p-4 border-b border-slate-200">Date</th>
                                    <th className="p-4 border-b border-slate-200">Type & Ref</th>
                                    <th className="p-4 border-b border-slate-200">Direction</th>
                                    <th className="p-4 border-b border-slate-200 text-right">Amount</th>
                                    <th className="p-4 border-b border-slate-200 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...customer.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p, i) => (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group/row">
                                        <td className="p-4 align-top">
                                            <div className="font-mono font-bold text-slate-600">{p.date}</div>
                                            <div className="text-[8px] text-slate-400 mt-1">{new Date(p.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="font-black text-slate-700">{p.category}</div>
                                            {p.notes && <div className="text-[9px] text-slate-500 mt-1 italic max-w-[150px] truncate">{p.notes}</div>}
                                            <div className="text-[8px] font-mono text-slate-300 mt-1 uppercase">ID: {p.id.split('-')[1] || p.id}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
                                                p.direction === 'In' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {p.direction === 'In' ? 'Deposit' : 'Withdraw'}
                                            </span>
                                        </td>
                                        <td className={`p-4 align-top text-right font-black text-xs ${p.direction === 'In' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {p.direction === 'In' ? '+' : '-'}₦{p.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 align-top text-center">
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm("Are you sure you want to delete this transaction? This will reverse any balance changes.")) {
                                                        onDeleteTransaction(customer.id, p.id);
                                                    }
                                                }} 
                                                className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all opacity-0 group-hover/row:opacity-100 focus:opacity-100"
                                                title="Delete Transaction"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
                </div>
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-slate-400">
            <span className="text-5xl mb-4">🏛️</span>
            <p className="font-black uppercase tracking-widest text-xs">Vault Secure. Select account to unlock details.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
         <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm rounded-3xl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
               <div className="bg-rose-600 p-6 text-center text-white">
                  <div className="text-4xl mb-2">⚠️</div>
                  <h3 className="text-lg font-black uppercase tracking-wide">Permanent Deletion</h3>
               </div>
               <div className="p-6 text-center space-y-4">
                  <p className="text-slate-600 font-medium text-sm">
                     You are about to permanently remove the record for <br/>
                     <span className="text-slate-900 font-black text-lg block mt-1">{deleteCandidate.borrowerName}</span>
                  </p>
                  <p className="text-[10px] text-rose-500 font-bold uppercase leading-relaxed bg-rose-50 p-2 rounded-lg border border-rose-100">
                     This action is irreversible. All data including transaction history and ledger entries will be completely removed from the system.
                  </p>
                  <div className="flex gap-3 pt-2">
                     <button onClick={() => setDeleteCandidate(null)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs uppercase hover:bg-slate-200">Cancel</button>
                     <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-black text-xs uppercase shadow-lg hover:bg-rose-700">Yes, Delete Forever</button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

const ProfileRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-start">
    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{label}:</span>
    <span className="font-black text-slate-800 text-right max-w-[200px]">{value}</span>
  </div>
);

const BalanceCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
    <div className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">{label}</div>
    <div className={`text-2xl font-black ${color}`}>₦{value.toLocaleString()}</div>
  </div>
);

export default CustomerProfiles;
