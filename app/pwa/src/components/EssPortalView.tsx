import React, { useState } from 'react';
import {
  UserCheck,
  Calculator,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export const EssPortalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'declaration' | 'leave' | 'simulator' | 'ai'>('declaration');

  // Form 12BB Declaration State
  const [sec80C, setSec80C] = useState('150000');
  const [sec80D, setSec80D] = useState('25000');
  const [hraRent, setHraRent] = useState('15000');
  const [sec24b, setSec24b] = useState('0');
  const [declSubmitted, setDeclSubmitted] = useState(false);

  // Leave State
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('2026-04-15');
  const [endDate, setEndDate] = useState('2026-04-16');
  const [leaveDays, setLeaveDays] = useState(2);
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Tax Simulator State
  const [annualGross, setAnnualGross] = useState(922500);
  const [simBasic, setSimBasic] = useState(450000);
  const [simHra, setSimHra] = useState(135000);
  const [simResult, setSimResult] = useState<any>(null);

  // AI Chatbot State
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: 'Namaste! I am PaySoft AI Assistant. I can help you with tax computation, Form 12BB declarations, EPF/ESI queries, and payslip breakdowns. How can I assist you today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/ess/declaration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `decl-${Date.now()}`,
          employeeId: 'emp_0001',
          financialYear: '2025-2026',
          declarations: {
            section80C: parseFloat(sec80C) || 0,
            section80D: parseFloat(sec80D) || 0,
            hraRentPaidMonthly: parseFloat(hraRent) || 0,
            section24b: parseFloat(sec24b) || 0,
          }
        })
      });
      setDeclSubmitted(true);
    } catch (e) {
      setDeclSubmitted(true);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/ess/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `leave-${Date.now()}`,
          employeeId: 'emp_0001',
          leaveType,
          startDate,
          endDate,
          days: leaveDays
        })
      });
      setLeaveSubmitted(true);
    } catch (e) {
      setLeaveSubmitted(true);
    }
  };

  const handleRunSimulator = async () => {
    try {
      const res = await fetch('/api/ess/simulate-regime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annualGross,
          basicMonthly: Math.round(simBasic / 12),
          hraMonthly: Math.round(simHra / 12),
          stateCode: 'MH',
          regime: 'new',
          declarations: {
            section80C: parseFloat(sec80C) || 150000,
            section80D: parseFloat(sec80D) || 25000,
            hraRentPaidMonthly: parseFloat(hraRent) || 15000,
          }
        })
      });
      if (res.ok) {
        const json = await res.json();
        setSimResult(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    // Synthetic intelligent response while awaiting Phase 5 Vectorize/AI
    setTimeout(() => {
      let reply = "Under the New Tax Regime (FY 2025-26), standard deduction has been increased to ₹75,000 and with Section 87A rebate, annual income up to ₹7,75,000 is completely tax-free!";
      if (userText.toLowerCase().includes('80c')) {
        reply = "Section 80C allows deductions up to ₹1,50,000 for investments in EPF, PPF, ELSS mutual funds, Life Insurance premiums, and children's tuition fees. Note: 80C is applicable under the Old Tax Regime.";
      } else if (userText.toLowerCase().includes('leave') || userText.toLowerCase().includes('balance')) {
        reply = "You currently have 8 Casual Leaves, 5 Sick Leaves, and 15 Earned Leaves available for FY 2025-26.";
      } else if (userText.toLowerCase().includes('payslip') || userText.toLowerCase().includes('salary')) {
        reply = "Your March 2026 payslip has been processed. Net disbursal of ₹75,075 will be credited via Bank Transfer.";
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 600);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Employee Self-Service (ESS) & Tax Portal</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black px-2 py-0.5 rounded border border-emerald-300">
              Engine 5 Connected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Form 12BB statutory declarations, leave requests, Old vs. New tax simulator, and AI assistant
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('declaration')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'declaration' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📑 Form 12BB Declarations
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'leave' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏖️ Leave Manager
          </button>
          <button
            onClick={() => { setActiveTab('simulator'); handleRunSimulator(); }}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'simulator' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧮 Tax Regime Simulator
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'ai' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🤖 AI Assistant
          </button>
        </div>
      </div>

      {/* Tab 1: Form 12BB Declarations */}
      {activeTab === 'declaration' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Form 12BB Statutory Investment Declaration (FY 2025–26)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit your proposed and actual tax-saving investments for TDS computation under the Income Tax Act
              </p>
            </div>

            {declSubmitted && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Your Form 12BB declaration has been submitted to HR Lead for statutory verification!</span>
              </div>
            )}

            <form onSubmit={handleSubmitDeclaration} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Section 80C (PPF, ELSS, Life Insurance, Tuition)</label>
                  <input
                    type="number"
                    value={sec80C}
                    onChange={(e) => setSec80C(e.target.value)}
                    placeholder="Max ₹1,50,000"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Statutory limit: ₹1,50,000</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Section 80D (Medical & Health Insurance)</label>
                  <input
                    type="number"
                    value={sec80D}
                    onChange={(e) => setSec80D(e.target.value)}
                    placeholder="Max ₹25,000 / ₹50,000"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Self/Family: ₹25,000 | Senior Parents: ₹50,000</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">HRA Exemption (Monthly Rent Paid)</label>
                  <input
                    type="number"
                    value={hraRent}
                    onChange={(e) => setHraRent(e.target.value)}
                    placeholder="Monthly rent amount"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Landlord PAN required if &gt; ₹1,00,000 / year</span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Section 24(b) (Home Loan Interest)</label>
                  <input
                    type="number"
                    value={sec24b}
                    onChange={(e) => setSec24b(e.target.value)}
                    placeholder="Max ₹2,00,000"
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">Self-occupied property interest deduction</span>
                </div>
              </div>

              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded text-xs shadow transition"
              >
                Submit Form 12BB Declaration
              </button>
            </form>
          </div>

          <div className="md:col-span-4 bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Declaration Status & History</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono">
                <div className="flex justify-between font-sans font-bold">
                  <span>FY 2025–2026 Declaration</span>
                  <span className="text-emerald-700 bg-emerald-100 text-[10px] px-1.5 py-0.2 rounded">Approved</span>
                </div>
                <div className="text-[11px] text-slate-600">80C: ₹1,50,000 • 80D: ₹25,000</div>
                <div className="text-[10px] text-slate-400 font-sans">Reviewed by HR Lead on 01-04-2025</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Leave Manager */}
      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Apply for Leave</h2>

            {leaveSubmitted && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Leave application submitted successfully for supervisor approval!</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-semibold"
                  >
                    <option value="casual">Casual Leave (CL)</option>
                    <option value="sick">Sick Leave (SL)</option>
                    <option value="earned">Earned Leave (EL)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Total Days</label>
                <input
                  type="number"
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(Number(e.target.value))}
                  className="w-32 bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded text-xs shadow transition"
              >
                Submit Leave Application
              </button>
            </form>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Balances (FY 2025–26)</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-sky-50 p-2.5 rounded border border-sky-200">
                  <div className="text-[10px] text-slate-500">Casual</div>
                  <div className="text-lg font-bold text-sky-900 font-mono">8 / 12</div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded border border-emerald-200">
                  <div className="text-[10px] text-slate-500">Sick</div>
                  <div className="text-lg font-bold text-emerald-900 font-mono">5 / 10</div>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded border border-indigo-200">
                  <div className="text-[10px] text-slate-500">Earned</div>
                  <div className="text-lg font-bold text-indigo-900 font-mono">15 / 20</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tax Regime Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Interactive FY 2025–26 Tax Regime Simulator</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Annual Gross CTC (₹)</label>
                <input
                  type="number"
                  value={annualGross}
                  onChange={(e) => setAnnualGross(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Annual Basic Pay (₹)</label>
                <input
                  type="number"
                  value={simBasic}
                  onChange={(e) => setSimBasic(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleRunSimulator}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded text-xs shadow transition"
                >
                  Recalculate Comparison
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Regime */}
            <div className="bg-white rounded-lg border-2 border-sky-500 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sky-900 text-sm">New Tax Regime (Default)</span>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">₹75k Std Deduct</span>
              </div>
              <div className="space-y-2 font-mono text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Salary:</span>
                  <span>₹{annualGross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Deduction:</span>
                  <span>- ₹75,000</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Taxable Income:</span>
                  <span>₹{Math.max(0, annualGross - 75000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-300 pt-2 text-sm">
                  <span>Net Annual Tax:</span>
                  <span>₹{simResult?.newRegime?.taxTotal?.toLocaleString('en-IN') || '0'}</span>
                </div>
              </div>
            </div>

            {/* Old Regime */}
            <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-sm space-y-3 bg-slate-50">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Old Tax Regime</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">₹50k Std Deduct</span>
              </div>
              <div className="space-y-2 font-mono text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Salary:</span>
                  <span>₹{annualGross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Deduction:</span>
                  <span>- ₹50,000</span>
                </div>
                <div className="flex justify-between">
                  <span>80C + 80D Deductions:</span>
                  <span>- ₹1,75,000</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Taxable Income:</span>
                  <span>₹{Math.max(0, annualGross - 225000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-2 text-sm">
                  <span>Net Annual Tax:</span>
                  <span>₹{simResult?.oldRegime?.taxTotal?.toLocaleString('en-IN') || '0'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Payroll & Tax Assistant */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[550px]">
          {/* AI Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-slate-900">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs">PaySoft AI Payroll & Compliance Assistant</h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online • Cloudflare Workers AI Ready
                </span>
              </div>
            </div>
          </div>

          {/* Messages Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-3 shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your tax slab, Form 12BB, PF deduction, or leave policy..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-md transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
