
import React, { useState, useEffect } from 'react';
import { LoanType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const LoanCalculator: React.FC = () => {
  const [product, setProduct] = useState<LoanType>(LoanType.BUSINESS);
  const [amount, setAmount] = useState<number>(50000);
  const [duration, setDuration] = useState<number>(16); // Weeks for Business, Months for Agric
  const [customRate, setCustomRate] = useState<number>(19); // Default Business Rate

  const [results, setResults] = useState<any>(null);

  // Auto-set defaults when product changes
  useEffect(() => {
    if (product === LoanType.BUSINESS) {
      setDuration(16);
      setCustomRate(19);
    } else {
      setDuration(7);
      setCustomRate(20);
    }
  }, [product]);

  useEffect(() => {
    calculate();
  }, [amount, duration, customRate, product]);

  const calculate = () => {
    const principal = amount;
    const interest = principal * (customRate / 100);
    const totalDue = principal + interest;
    
    let installments = 0;
    let periodType = '';
    let periodicPayment = 0;

    if (product === LoanType.BUSINESS) {
        installments = duration; // Weekly
        periodType = 'Weeks';
        periodicPayment = totalDue / installments;
    } else {
        // Agric logic: Repayment usually in last 3 months
        installments = 3; 
        periodType = 'Months (Last 3)';
        periodicPayment = totalDue / 3;
    }

    setResults({
        principal,
        interest,
        totalDue,
        installments,
        periodType,
        periodicPayment,
        roi: customRate
    });
  };

  const chartData = results ? [
    { name: 'Principal', value: results.principal, color: '#3b82f6' },
    { name: 'Interest', value: results.interest, color: '#10b981' },
  ] : [];

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Loan Simulator</h2>
          <p className="text-slate-500 font-medium">Plan and structure loans before registration.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Controls */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
                <h3 className="font-black text-slate-800 uppercase tracking-widest mb-6">Configuration</h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Loan Product</label>
                        <div className="flex gap-2">
                            {Object.values(LoanType).map(type => (
                                <button
                                    key={type as string}
                                    onClick={() => setProduct(type as LoanType)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase transition-all ${
                                        product === type 
                                        ? 'bg-slate-900 text-white shadow-lg transform scale-105' 
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {(type as string).split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase mb-2">Disbursement Amount (₦)</label>
                        <input 
                            type="number" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            step={5000}
                        />
                        <input 
                            type="range" 
                            min="10000" 
                            max="500000" 
                            step="5000"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="w-full mt-3 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Interest Rate (%)</label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                                value={customRate}
                                onChange={e => setCustomRate(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Duration ({product === LoanType.BUSINESS ? 'Weeks' : 'Months'})</label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                                value={duration}
                                onChange={e => setDuration(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            {results && (
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-12 opacity-5 text-9xl pointer-events-none">🧮</div>

                    <div>
                        <h3 className="font-black text-slate-400 uppercase tracking-widest mb-1">Projected Repayment</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tight text-white">₦{results.periodicPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase">/ {product === LoanType.BUSINESS ? 'Week' : 'Month'}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-500/30">
                                {results.installments} Installments
                            </span>
                            <span className="bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-emerald-500/30">
                                {results.roi}% ROI
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-8">
                        <div className="h-32 w-32 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        innerRadius={25}
                                        outerRadius={40}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-slate-500">breakdown</span>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                <span className="text-slate-400 font-medium">Principal</span>
                                <span className="font-bold">₦{results.principal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                <span className="text-slate-400 font-medium">Total Interest</span>
                                <span className="font-bold text-emerald-400">+₦{results.interest.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-lg pt-1">
                                <span className="text-slate-300 font-black uppercase text-xs tracking-widest">Total Payback</span>
                                <span className="font-black text-blue-400">₦{results.totalDue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default LoanCalculator;
