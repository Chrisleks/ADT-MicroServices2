
import React, { useState } from 'react';

const Support = () => {
  const [activeSection, setActiveSection] = useState<'help' | 'contact' | 'feedback'>('help');
  const [feedback, setFeedback] = useState('');

  const faqs = [
    { q: "How do I register a new loan?", a: "Navigate to the 'Registration' tab. Ensure you have the borrower's personal details, a passport photo, and the signed loan form ready. Follow the 4-step wizard." },
    { q: "How do I post a repayment?", a: "Go to 'Field Collection'. You can use the search bar to find the borrower. Click 'Post', select 'Loan Instalment', enter the amount, and save." },
    { q: "What happens if I make a mistake?", a: "If you are an Admin or Manager, you can reverse transactions in the 'Profiles' ledger. Field Officers must contact their supervisor to request a correction." },
    { q: "How does the Offline Mode work?", a: "If you lose internet connection, the system automatically switches to Offline Mode. You can continue posting collections. These are saved locally and must be synced once you are back online." },
    { q: "What is the approval process for withdrawals?", a: "Withdrawals from Savings or Adashe require approval. The flow is: BDM Review -> SFO Verification -> HOB Final Approval." },
  ];

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your comments! Your feedback has been logged for the management team.");
    setFeedback('');
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Help & Support Center</h2>
                <p className="text-slate-500 font-medium">Resources, contact channels, and system feedback.</p>
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveSection('help')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeSection === 'help' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>FAQ & Guides</button>
                <button onClick={() => setActiveSection('contact')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeSection === 'contact' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>Contact Us</button>
                <button onClick={() => setActiveSection('feedback')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeSection === 'feedback' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}>Comments</button>
            </div>
        </div>

        {activeSection === 'help' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-black text-slate-800 text-sm mb-2 flex items-start gap-2">
                            <span className="text-blue-500">Q.</span> {faq.q}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed pl-5">{faq.a}</p>
                    </div>
                ))}
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 md:col-span-2 flex items-center gap-4">
                    <span className="text-2xl">📘</span>
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">Need the full manual?</h4>
                        <button className="text-xs text-blue-600 underline font-bold mt-1 hover:text-blue-800">Download User Guide PDF</button>
                    </div>
                </div>
            </div>
        )}

        {activeSection === 'contact' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                <div className="lg:col-span-1 space-y-6">
                    <ContactCard icon="📍" title="Headquarters" content="No. 6 Noad Avenue, TEKAN Headquarters, Jos, Nigeria" />
                    <ContactCard icon="📞" title="Support Line" content="+234 706 788 8721" />
                    <ContactCard icon="📧" title="Email" content="awake@tekanpeacedesk.org" />
                </div>
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest mb-6">Send a Message</h3>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent to support!'); }}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Name</label>
                                <input type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-colors" required />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
                                <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-blue-500 transition-colors">
                                    <option>Technical Issue</option>
                                    <option>Account Access</option>
                                    <option>General Inquiry</option>
                                    <option>Urgent Assistance</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Message</label>
                            <textarea rows={5} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 transition-colors" required></textarea>
                        </div>
                        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors shadow-lg">Send Message</button>
                    </form>
                </div>
            </div>
        )}

        {activeSection === 'feedback' && (
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-slide-up">
                <div>
                    <h3 className="text-2xl font-black text-slate-800">We Value Your Feedback</h3>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Help us improve the ADT System by sharing your thoughts, feature requests, or general comments.</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-left">
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comment / Suggestion</label>
                            <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 h-40 resize-none transition-colors"
                                placeholder="Type your comments here..."
                                required
                            ></textarea>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">* Anonymous submission available</span>
                            <button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                                Submit Feedback
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

const ContactCard = ({ icon, title, content }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-300 transition-colors">
        <div className="text-2xl bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center">{icon}</div>
        <div>
            <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">{title}</h4>
            <p className="font-black text-slate-800 text-sm mt-1">{content}</p>
        </div>
    </div>
);

export default Support;
