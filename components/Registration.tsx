import React, { useState, useRef, useEffect } from 'react';
import { LoanType, Loan, LoanStatus, ApprovalStatus } from '../types';
import { sanitizeInput } from '../utils/security';

interface RegistrationProps {
  loans: Loan[];
  onAddLoan: (loan: Loan) => void;
  existingGroups: string[];
  existingOfficers: string[];
}

const Registration: React.FC<RegistrationProps> = ({ loans, onAddLoan, existingGroups, existingOfficers }) => {
  const calculateNextId = () => {
    const ids = loans.map(l => parseInt(l.id)).filter(n => !isNaN(n));
    const maxId = ids.length > 0 ? Math.max(...ids) : 1000;
    return (maxId + 1).toString();
  };

  const [currentStep, setCurrentStep] = useState(0);
  
  const [formData, setFormData] = useState({
    id: calculateNextId(),
    name: '',
    phone: '',
    dob: '',
    address: '',
    group: existingGroups[0] || '',
    co: existingOfficers[0] || '',
    loanType: LoanType.BUSINESS,
    disbursement: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorAddress: '',
    // Migration Fields
    existingLoanBalance: '',
    existingSavings: '',
    existingAdashe: ''
  });

  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [isAddingOfficer, setIsAddingOfficer] = useState(false);
  const [passportBase64, setPassportBase64] = useState<string>('');
  const [loanFormBase64, setLoanFormBase64] = useState<string>('');

  // Update ID automatically if loans list changes (e.g. after adding one)
  useEffect(() => {
    setFormData(prev => ({ ...prev, id: calculateNextId() }));
  }, [loans]);

  // Camera State
  const [activeCamera, setActiveCamera] = useState<'passport' | 'loanForm' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const STEPS = [
    { title: 'Identity', icon: '👤', sub: 'Personal Details' },
    { title: 'Portfolio', icon: '💼', sub: 'Group & Loan' },
    { title: 'Relations', icon: '👥', sub: 'Kin & Guarantor' },
    { title: 'Documents', icon: '📁', sub: 'KYC Uploads' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
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
      
      // Delay slightly to ensure the video element is mounted in the DOM
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

  const capturePhoto = (setter: (val: string) => void) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setter(dataUrl);
        stopCamera();
      }
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for ID collision
    if (loans.some(l => l.id === formData.id)) {
      alert(`Error: Customer ID ${formData.id} already exists. Please verify.`);
      return;
    }

    if (formData.id.length !== 4) return alert("ID must be exactly 4 digits");

    // SECURITY: Sanitize Inputs before processing
    const finalGroup = sanitizeInput(isAddingGroup ? newGroupName : formData.group);
    const finalOfficer = sanitizeInput(isAddingOfficer ? newOfficerName : formData.co);

    if (!finalGroup || !finalOfficer) return alert("Please select or add a Group and Credit Officer");

    const disbursementAmt = parseFloat(formData.disbursement) || 0;
    const existingLoanBal = parseFloat(formData.existingLoanBalance) || 0;
    
    // Logic: If migration balance is entered, that becomes the Principal (Total Due).
    // We assume 0 payments made in THIS system, so Outstanding = Principal - 0 = Existing Balance.
    const finalPrincipal = existingLoanBal > 0 
        ? existingLoanBal 
        : disbursementAmt * (formData.loanType.includes('19%') ? 1.19 : 1.20);

    const newLoan: Loan = {
      id: sanitizeInput(formData.id),
      dateOfRegistration: new Date().toISOString().split('T')[0],
      borrowerName: sanitizeInput(formData.name),
      phoneNumber: sanitizeInput(formData.phone),
      dateOfBirth: formData.dob,
      address: sanitizeInput(formData.address),
      groupName: finalGroup,
      creditOfficer: finalOfficer,
      loanType: formData.loanType,
      loanDisbursementAmount: disbursementAmt,
      loanDisbursementDate: new Date().toISOString().split('T')[0],
      disbursementStatus: ApprovalStatus.PENDING_BDM, 
      principal: finalPrincipal,
      interestRate: formData.loanType.includes('19%') ? 19 : 20,
      dueDate: '',
      dpd: 0,
      savingsBalance: parseFloat(formData.existingSavings) || 0,
      adasheBalance: parseFloat(formData.existingAdashe) || 0,
      payments: [],
      pendingRequests: [],
      activityLog: [],
      status: LoanStatus.CURRENT,
      loanCycle: 1,
      nextOfKinName: sanitizeInput(formData.nextOfKinName),
      nextOfKinPhone: sanitizeInput(formData.nextOfKinPhone),
      guarantorName: sanitizeInput(formData.guarantorName),
      guarantorPhone: sanitizeInput(formData.guarantorPhone),
      guarantorAddress: sanitizeInput(formData.guarantorAddress),
      passportPhoto: passportBase64,
      loanFormPhoto: loanFormBase64,
      weeks: { 1: {savings:0, adashe:0, loan:0}, 2: {savings:0, adashe:0, loan:0}, 3: {savings:0, adashe:0, loan:0}, 4: {savings:0, adashe:0, loan:0}, 5: {savings:0, adashe:0, loan:0} },
      savingsAdjustment: 0
    };

    onAddLoan(newLoan);
    alert("Customer Registered & Submitted for Approval (Flow: BDM -> SFO -> HOB)");
    
    // Reset Form
    setFormData({
      id: '', // Will be updated by useEffect
      name: '', phone: '', dob: '', address: '',
      group: existingGroups[0], co: existingOfficers[0],
      loanType: LoanType.BUSINESS, disbursement: '',
      nextOfKinName: '', nextOfKinPhone: '',
      guarantorName: '', guarantorPhone: '', guarantorAddress: '',
      existingLoanBalance: '', existingSavings: '', existingAdashe: ''
    });
    setPassportBase64('');
    setLoanFormBase64('');
    setCurrentStep(0);
  };

  // Calculate principal for preview
  const previewDisbursement = parseFloat(formData.disbursement) || 0;
  const previewExistingLoan = parseFloat(formData.existingLoanBalance) || 0;
  const previewPrincipal = previewExistingLoan > 0 
      ? previewExistingLoan 
      : previewDisbursement * (formData.loanType.includes('19%') ? 1.19 : 1.20);


  // Helper to render image inputs (Camera vs Upload)
  const renderImageInput = (label: string, icon: string, value: string, setter: (val: string) => void, type: 'passport' | 'loanForm') => {
    // 1. Camera Active View
    if (activeCamera === type) {
      return (
        <div className="space-y-3">
          <InputLabel label={label} />
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-lg border border-slate-300">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            {/* Camera Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10">
              <button 
                type="button" 
                onClick={stopCamera} 
                className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase hover:bg-white/30 transition-colors border border-white/20"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => capturePhoto(setter)} 
                className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/20 transition-all active:scale-95"
              >
                <div className="w-10 h-10 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Default / Preview View
    return (
      <div className="space-y-3">
         <InputLabel label={label} />
         <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative group hover:border-blue-400 transition-colors">
            {value ? (
               <>
                 <img src={value} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    <button type="button" onClick={() => setter('')} className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-lg hover:bg-rose-600">Remove</button>
                 </div>
               </>
            ) : (
               <div className="text-center p-4 w-full">
                  <div className="text-3xl mb-3 grayscale opacity-50">{icon}</div>
                  <div className="flex flex-col gap-2 px-6">
                     <button 
                       type="button" 
                       onClick={() => startCamera(type)} 
                       className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 w-full"
                     >
                        <span>📸</span> Take Photo
                     </button>
                     <div className="text-[9px] font-bold text-slate-400 uppercase">- OR -</div>
                     <label className="cursor-pointer bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 w-full">
                        <span>📂</span> Upload File
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, setter)} />
                     </label>
                  </div>
               </div>
            )}
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 pb-20 animate-fade-in">
      
      {/* LEFT: Multi-step Form Wizard */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Progress Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <div className="flex justify-between items-center relative">
            {/* Connecting Line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-0 hidden md:block"></div>
            
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => setCurrentStep(idx)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300 ${
                    isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' : 
                    isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 
                    'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div className="mt-2 text-center hidden md:block">
                    <div className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{step.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 flex-1">
          <form id="regForm" onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 space-y-6">
              
              {/* Step 0: Identity */}
              {currentStep === 0 && (
                <div className="animate-slide-up space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-1 relative">
                      <InputLabel label="Unique ID (Auto)" />
                      <div className="relative">
                        <input 
                          type="text" 
                          maxLength={4} 
                          className="w-full p-3 bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 rounded-xl font-mono font-bold" 
                          value={formData.id} 
                          readOnly 
                        />
                        <div className="absolute right-3 top-2.5 text-xs">🔒</div>
                      </div>
                    </div>
                    <div className="col-span-3">
                       <InputLabel label="Full Legal Name" />
                       <input type="text" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Firstname Lastname" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <InputLabel label="Phone Number" />
                      <input type="tel" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" placeholder="080..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <InputLabel label="Date of Birth" />
                      <input type="date" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <InputLabel label="Residential Address" />
                    <textarea className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="Full detailed address..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>
              )}

              {/* Step 1: Portfolio */}
              {currentStep === 1 && (
                <div className="animate-slide-up space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <InputLabel label="Assign Group" />
                       {isAddingGroup ? (
                         <div className="flex gap-2">
                           <input type="text" className="flex-1 p-3 border border-blue-300 bg-blue-50 rounded-xl font-bold text-slate-700" placeholder="New Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} autoFocus />
                           <button type="button" onClick={() => setIsAddingGroup(false)} className="px-3 bg-slate-200 rounded-xl font-bold text-xs hover:bg-slate-300">✕</button>
                         </div>
                       ) : (
                         <div className="flex gap-2">
                           <select className="flex-1 p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.group} onChange={e => setFormData({...formData, group: e.target.value})}>
                             {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
                           </select>
                           <button type="button" onClick={() => setIsAddingGroup(true)} className="px-3 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-200">+</button>
                         </div>
                       )}
                    </div>
                    
                    <div className="space-y-2">
                       <InputLabel label="Credit Officer" />
                       {isAddingOfficer ? (
                         <div className="flex gap-2">
                           <input type="text" className="flex-1 p-3 border border-blue-300 bg-blue-50 rounded-xl font-bold text-slate-700" placeholder="Officer Name" value={newOfficerName} onChange={e => setNewOfficerName(e.target.value)} autoFocus />
                           <button type="button" onClick={() => setIsAddingOfficer(false)} className="px-3 bg-slate-200 rounded-xl font-bold text-xs hover:bg-slate-300">✕</button>
                         </div>
                       ) : (
                         <div className="flex gap-2">
                           <select className="flex-1 p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.co} onChange={e => setFormData({...formData, co: e.target.value})}>
                             {existingOfficers.map(o => <option key={o} value={o}>{o}</option>)}
                           </select>
                           <button type="button" onClick={() => setIsAddingOfficer(true)} className="px-3 bg-blue-100 text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-200">+</button>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <InputLabel label="Loan Product" />
                      <select className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.loanType} onChange={e => setFormData({...formData, loanType: e.target.value as any})}>
                        <option value={LoanType.BUSINESS}>{LoanType.BUSINESS}</option>
                        <option value={LoanType.AGRIC}>{LoanType.AGRIC}</option>
                      </select>
                    </div>
                    <div>
                       <InputLabel label="Disbursement Amount (₦)" />
                       <input type="number" className="w-full p-3 border border-slate-200 rounded-xl font-black text-blue-600 bg-white" placeholder="0.00" value={formData.disbursement} onChange={e => setFormData({...formData, disbursement: e.target.value})} />
                    </div>
                  </div>

                  {/* NEW SECTION FOR MIGRATION */}
                  <div className="border-t border-slate-100 pt-6 mt-2">
                     <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg bg-indigo-50 p-1.5 rounded-lg">📥</span>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Migration Data</h4>
                            <p className="text-[10px] text-slate-400 font-bold">Fill only for transferring old records (optional)</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-200 border-dashed">
                        <div>
                            <InputLabel label="Existing Loan Bal (₦)" />
                            <input type="number" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" placeholder="0.00" value={formData.existingLoanBalance} onChange={e => setFormData({...formData, existingLoanBalance: e.target.value})} />
                        </div>
                        <div>
                            <InputLabel label="Opening Savings (₦)" />
                            <input type="number" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-emerald-600 bg-white" placeholder="0.00" value={formData.existingSavings} onChange={e => setFormData({...formData, existingSavings: e.target.value})} />
                        </div>
                        <div>
                            <InputLabel label="Opening Adashe (₦)" />
                            <input type="number" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-amber-600 bg-white" placeholder="0.00" value={formData.existingAdashe} onChange={e => setFormData({...formData, existingAdashe: e.target.value})} />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Step 2: Relations */}
              {currentStep === 2 && (
                <div className="animate-slide-up space-y-8">
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="bg-slate-100 p-1 rounded">👥</span>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Next of Kin Details</h4>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <InputLabel label="Name" />
                          <input type="text" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.nextOfKinName} onChange={e => setFormData({...formData, nextOfKinName: e.target.value})} />
                        </div>
                        <div>
                          <InputLabel label="Phone" />
                          <input type="tel" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.nextOfKinPhone} onChange={e => setFormData({...formData, nextOfKinPhone: e.target.value})} />
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="bg-slate-100 p-1 rounded">🛡️</span>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Guarantor Details</h4>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <InputLabel label="Name" />
                          <input type="text" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.guarantorName} onChange={e => setFormData({...formData, guarantorName: e.target.value})} />
                        </div>
                        <div>
                          <InputLabel label="Phone" />
                          <input type="tel" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.guarantorPhone} onChange={e => setFormData({...formData, guarantorPhone: e.target.value})} />
                        </div>
                        <div className="md:col-span-2">
                          <InputLabel label="Address" />
                          <input type="text" className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white" value={formData.guarantorAddress} onChange={e => setFormData({...formData, guarantorAddress: e.target.value})} />
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <div className="animate-slide-up space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {renderImageInput('Passport Photograph', '📸', passportBase64, setPassportBase64, 'passport')}
                      {renderImageInput('Signed Loan Form', '📄', loanFormBase64, setLoanFormBase64, 'loanForm')}
                   </div>
                </div>
              )}

            </div>

            {/* Navigation Buttons */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center mt-6 rounded-b-3xl">
              {currentStep > 0 ? (
                <button type="button" onClick={prevStep} className="px-6 py-3 rounded-xl text-slate-500 font-bold uppercase text-xs hover:bg-slate-200 transition-colors">
                   ← Previous
                </button>
              ) : <div></div>}

              {currentStep < STEPS.length - 1 ? (
                <button type="button" onClick={nextStep} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg transition-colors">
                   Next Step →
                </button>
              ) : (
                <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-lg transition-colors">
                   ✓ Submit Registration
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT: Live Preview Card */}
      <div className="w-full xl:w-96 flex flex-col gap-6">
         <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 sticky top-6">
            <h3 className="font-black text-slate-800 uppercase tracking-widest mb-6 text-center">Preview ID Card</h3>
            
            <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white p-6 flex flex-col items-center text-center border border-white/10">
               {/* Background Pattern */}
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               
               <div className="relative z-10 w-24 h-24 rounded-full border-4 border-white/20 bg-slate-800 mb-4 overflow-hidden shadow-inner">
                  {passportBase64 ? <img src={passportBase64} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
               </div>
               
               <div className="relative z-10 space-y-1 w-full">
                  <div className="text-xl font-black tracking-tight truncate">{formData.name || 'Customer Name'}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">{formData.group}</div>
               </div>

               <div className="relative z-10 grid grid-cols-2 gap-2 w-full mt-6 text-left bg-white/5 p-3 rounded-xl backdrop-blur-sm">
                  <div>
                     <div className="text-[8px] font-bold text-slate-400 uppercase">Member ID</div>
                     <div className="font-mono font-bold text-sm">{formData.id}</div>
                  </div>
                  <div>
                     <div className="text-[8px] font-bold text-slate-400 uppercase">Product</div>
                     <div className="font-bold text-xs">{formData.loanType.split(' ')[0]}</div>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/10 mt-1">
                     <div className="text-[8px] font-bold text-slate-400 uppercase">Total Principal Due</div>
                     <div className="font-black text-lg text-emerald-400">₦{previewPrincipal.toLocaleString()}</div>
                  </div>
               </div>
               
               <div className="mt-auto pt-4 text-[8px] font-bold uppercase text-slate-500 tracking-widest">
                  TEKAN PEACE DESK AWAKE
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

const InputLabel = ({ label }: { label: string }) => (
  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wide">{label}</label>
);

export default Registration;