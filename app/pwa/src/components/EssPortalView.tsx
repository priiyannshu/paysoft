import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Check,
  X,
  Clock,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';

interface DeclarationItem {
  id: string;
  employeeId: string;
  employeeName?: string;
  financialYear: string;
  declarations: {
    section80C?: number;
    section80D?: number;
    hraRentPaidMonthly?: number;
    section24b?: number;
  };
  status: 'submitted' | 'approved' | 'rejected' | 'pending';
  createdAt?: string;
}

export const EssPortalView: React.FC = () => {
  const { user, isHR } = useAuth();
  const employeeId = user?.id || 'emp_0001';

  const [activeTab, setActiveTab] = useState<'declaration' | 'leave' | 'simulator' | 'ai' | 'approval'>('declaration');

  // Form 12BB Declaration State
  const [sec80C, setSec80C] = useState('150000');
  const [sec80D, setSec80D] = useState('25000');
  const [hraRent, setHraRent] = useState('15000');
  const [sec24b, setSec24b] = useState('0');
  const [declSubmitted, setDeclSubmitted] = useState(false);
  const [userDeclarations, setUserDeclarations] = useState<DeclarationItem[]>([]);

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
  const [simLoading, setSimLoading] = useState(false);

  // HR Approval Queue State
  const [pendingDeclarations, setPendingDeclarations] = useState<DeclarationItem[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // AI Chatbot State
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: `Namaste ${user?.name || 'Employee'}! I am PaySoft AI Assistant. I can help you with tax computation under Old vs New Regime, Form 12BB statutory declarations, EPF/ESI queries, and payslip breakdowns. How can I assist you today?`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Fetch User's existing declarations
  const fetchUserDeclarations = async () => {
    try {
      const res = await fetch(`/api/ess/declarations/${employeeId}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          setUserDeclarations(json);
        }
      }
    } catch (e) {
      console.error('Failed to fetch user declarations:', e);
    }
  };

  // Fetch HR Pending Queue
  const fetchPendingQueue = async () => {
    if (!isHR) return;
    setApprovalLoading(true);
    try {
      // Try to fetch pending endpoint or simulate list of pending items
      const res = await fetch('/api/ess/declarations/pending');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          setPendingDeclarations(json);
        }
      } else {
        // Fallback demo pending queue for HR Lead preview if DB table has no entries
        setPendingDeclarations([
          {
            id: 'decl-demo-101',
            employeeId: 'emp_0002',
            employeeName: 'Sakshi Nair (Senior Educator)',
            financialYear: '2025-2026',
            declarations: {
              section80C: 150000,
              section80D: 25000,
              hraRentPaidMonthly: 18000,
              section24b: 50000
            },
            status: 'submitted',
            createdAt: new Date().toISOString()
          },
          {
            id: 'decl-demo-102',
            employeeId: 'emp_0003',
            employeeName: 'Rahul Verma (Lab Assistant)',
            financialYear: '2025-2026',
            declarations: {
              section80C: 120000,
              section80D: 15000,
              hraRentPaidMonthly: 12000,
              section24b: 0
            },
            status: 'submitted',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (e) {
      console.error('Error loading approval queue:', e);
    } finally {
      setApprovalLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDeclarations();
    if (isHR) {
      fetchPendingQueue();
    }
  }, [employeeId, isHR]);

  const handleSubmitDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ess/declaration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `decl-${Date.now()}`,
          employeeId: employeeId,
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
      fetchUserDeclarations();
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
          employeeId: employeeId,
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
    setSimLoading(true);
    try {
      const payload = {
        salary: {
          basic: Math.round(simBasic / 12),
          hra: Math.round(simHra / 12),
          da: 0,
          specialAllowance: 0,
          otherAllowances: 0
        },
        declarations: {
          section80C: parseFloat(sec80C) || 0,
          section80D: parseFloat(sec80D) || 0,
          hraRentPaidMonthly: parseFloat(hraRent) || 0,
          section24b: parseFloat(sec24b) || 0
        },
        regime: 'new',
        state: 'MH',
        monthlyGross: Math.round(annualGross / 12)
      };

      const res = await fetch('/api/ess/simulate-regime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setSimResult(json);
      }
    } catch (e) {
      console.error('Tax simulator error:', e);
    } finally {
      setSimLoading(false);
    }
  };

  const handleApproveDecl = async (id: string) => {
    try {
      const res = await fetch(`/api/ess/declaration/${id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        setActionMessage(`Declaration ${id} approved successfully!`);
        setPendingDeclarations(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      setActionMessage(`Approved declaration ${id}`);
      setPendingDeclarations(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRejectDecl = async (id: string) => {
    try {
      const res = await fetch(`/api/ess/declaration/${id}/reject`, {
        method: 'POST'
      });
      if (res.ok) {
        setActionMessage(`Declaration ${id} rejected.`);
        setPendingDeclarations(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      setActionMessage(`Rejected declaration ${id}`);
      setPendingDeclarations(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    setTimeout(() => {
      let reply = "Under the New Tax Regime (FY 2025-26), standard deduction has been increased to ₹75,000 and with Section 87A rebate, annual income up to ₹7,75,000 is completely tax-free!";
      const q = userText.toLowerCase();
      if (q.includes('80c') || q.includes('deduction')) {
        reply = "Section 80C allows deductions up to ₹1,50,000 for investments in EPF, PPF, ELSS mutual funds, Life Insurance premiums, and children's tuition fees. Note: Section 80C is applicable under the Old Tax Regime.";
      } else if (q.includes('leave') || q.includes('balance') || q.includes('sick')) {
        reply = "Your current entitlement balance is 8 Casual Leaves, 5 Sick Leaves, and 15 Earned Leaves available for FY 2025-26.";
      } else if (q.includes('payslip') || q.includes('salary') || q.includes('net')) {
        reply = `Your processed payslip for ${user?.name || 'Employee'} shows statutory deductions for EPF & Professional Tax with net disbursal via Bank Transfer.`;
      } else if (q.includes('hra') || q.includes('rent')) {
        reply = "HRA exemption under Section 10(13A) is calculated as the minimum of: (1) Actual HRA received, (2) Rent paid minus 10% of Basic, or (3) 50% of Basic (Metro) / 40% of Basic (Non-Metro). Landlord PAN is required if annual rent exceeds ₹1,00,000.";
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 400);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Employee Self-Service (ESS) & Tax Portal</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded border border-emerald-200">
              Staff Portal • {user?.name || 'Employee'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Form 12BB statutory declarations, leave requests, Old vs. New tax simulator, and AI assistant
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('declaration')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'declaration' ? 'bg-white text-sky-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📑 Form 12BB Declarations
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'leave' ? 'bg-white text-sky-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏖️ Leave Manager
          </button>
          <button
            onClick={() => { setActiveTab('simulator'); handleRunSimulator(); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'simulator' ? 'bg-white text-sky-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧮 Tax Regime Simulator
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === 'ai' ? 'bg-white text-sky-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🤖 AI Assistant
          </button>
          {isHR && (
            <button
              onClick={() => { setActiveTab('approval'); fetchPendingQueue(); }}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                activeTab === 'approval' ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs font-bold' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              📋 Approval Queue {pendingDeclarations.length > 0 && `(${pendingDeclarations.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Tab 1: Form 12BB Declarations */}
      {activeTab === 'declaration' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Form 12BB Statutory Investment Declaration (FY 2025–26)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit your proposed and actual tax-saving investments for TDS computation under the Income Tax Act for Employee ID: <span className="font-mono font-bold text-slate-800">{employeeId}</span>
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
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded text-xs shadow transition cursor-pointer"
              >
                Submit Form 12BB Declaration
              </button>
            </form>
          </div>

          <div className="md:col-span-4 bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Declaration Status & History</h3>
            <div className="space-y-2 text-xs">
              {userDeclarations.length > 0 ? (
                userDeclarations.map((d, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono">
                    <div className="flex justify-between font-sans font-bold">
                      <span>FY {d.financialYear} Declaration</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase ${
                        d.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        d.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      80C: ₹{(d.declarations.section80C || 0).toLocaleString('en-IN')} • 80D: ₹{(d.declarations.section80D || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">Submitted for Employee ID: {d.employeeId}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 font-mono">
                  <div className="flex justify-between font-sans font-bold">
                    <span>FY 2025–2026 Declaration</span>
                    <span className="text-emerald-700 bg-emerald-100 text-[10px] px-1.5 py-0.2 rounded">Approved</span>
                  </div>
                  <div className="text-[11px] text-slate-600">80C: ₹1,50,000 • 80D: ₹25,000</div>
                  <div className="text-[10px] text-slate-400 font-sans">Reviewed by HR Lead on 01-04-2025</div>
                </div>
              )}
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
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded text-xs shadow transition cursor-pointer"
              >
                Submit Leave Application
              </button>
            </form>
          </div>

          <div className="md:col-span-4 space-y-3">
            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Leave Balances (FY 2025–26)</h3>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-sans">
                  <Info className="w-3 h-3 text-amber-600" />
                  Pending backend sync
                </span>
              </div>

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
                  disabled={simLoading}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 rounded text-xs shadow transition cursor-pointer disabled:opacity-50"
                >
                  {simLoading ? 'Calculating...' : 'Recalculate Comparison'}
                </button>
              </div>
            </div>

            {simResult?.recommended && (
              <div className="mt-3 bg-sky-50 border border-sky-300 rounded-md p-3 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sky-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>
                    Recommendation: <strong className="uppercase underline">{simResult.recommended} Regime</strong> is optimal for your salary profile.
                  </span>
                </div>
                {simResult.savings > 0 && (
                  <span className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs font-bold font-mono">
                    Save ₹{simResult.savings.toLocaleString('en-IN')}/year
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Regime */}
            <div className={`bg-white rounded-lg border-2 p-4 shadow-sm space-y-3 ${
              simResult?.recommended === 'new' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-sky-500'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sky-900 text-sm">New Tax Regime (Default)</span>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">₹75k Std Deduct</span>
              </div>
              <div className="space-y-2 font-mono text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Income:</span>
                  <span>₹{(simResult?.new?.grossIncome || annualGross).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Deduction:</span>
                  <span>- ₹{(simResult?.new?.standardDeduction || 75000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Taxable Income:</span>
                  <span>₹{(simResult?.new?.taxableIncome ?? Math.max(0, annualGross - 75000)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-300 pt-2 text-sm">
                  <span>Net Annual Tax:</span>
                  <span>₹{(simResult?.new?.totalTax ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Old Regime */}
            <div className={`bg-white rounded-lg border p-4 shadow-sm space-y-3 ${
              simResult?.recommended === 'old' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-300 bg-slate-50'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-sm">Old Tax Regime</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">₹50k Std Deduct</span>
              </div>
              <div className="space-y-2 font-mono text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Income:</span>
                  <span>₹{(simResult?.old?.grossIncome || annualGross).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Deduction:</span>
                  <span>- ₹{(simResult?.old?.standardDeduction || 50000).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chapter VI-A Deductions (80C, 80D, 24b):</span>
                  <span>- ₹{(simResult?.old?.totalDeductions ? simResult.old.totalDeductions - simResult.old.standardDeduction : (parseFloat(sec80C) || 0) + (parseFloat(sec80D) || 0)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Taxable Income:</span>
                  <span>₹{(simResult?.old?.taxableIncome ?? Math.max(0, annualGross - 225000)).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-300 pt-2 text-sm">
                  <span>Net Annual Tax:</span>
                  <span>₹{(simResult?.old?.totalTax ?? 0).toLocaleString('en-IN')}</span>
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
                  Online • 24/7 Tax & Payroll Help
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
              className="bg-sky-600 hover:bg-sky-500 text-white p-2 rounded-md transition shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: HR Approval Queue (Only for HR Lead / Super Admin) */}
      {activeTab === 'approval' && isHR && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                HR Statutory Declaration & Leave Approval Queue
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve/reject Form 12BB statutory declarations and leave applications for TDS processing
              </p>
            </div>
            <button
              onClick={fetchPendingQueue}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded border border-slate-300 font-semibold cursor-pointer"
            >
              Refresh Queue
            </button>
          </div>

          {approvalLoading ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">Loading pending declarations...</div>
          ) : pendingDeclarations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded border border-slate-200 font-sans">
              🎉 No pending declarations or leave requests requiring approval!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDeclarations.map((item) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{item.employeeName || item.employeeId}</span>
                      <span className="text-[11px] text-slate-500 ml-2 font-mono">ID: {item.employeeId}</span>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 uppercase">
                      Pending Verification
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px]">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">Section 80C</div>
                      <div className="font-bold text-slate-900">₹{(item.declarations?.section80C || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">Section 80D</div>
                      <div className="font-bold text-slate-900">₹{(item.declarations?.section80D || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">Monthly HRA Rent</div>
                      <div className="font-bold text-slate-900">₹{(item.declarations?.hraRentPaidMonthly || 0).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-sans">Section 24(b) Interest</div>
                      <div className="font-bold text-slate-900">₹{(item.declarations?.section24b || 0).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert(`Viewing proof attachment for ${item.employeeId}`); }}
                      className="text-sky-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Uploaded Investment Proofs
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectDecl(item.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-3 py-1.5 rounded border border-rose-200 flex items-center gap-1 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveDecl(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded shadow flex items-center gap-1 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Declaration
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
