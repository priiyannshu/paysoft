import React, { useState } from 'react';
import {
  Play,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
  Download,
  Database
} from 'lucide-react';

export const PayrollRunView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [running, setRunning] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [runStatus, setRunStatus] = useState<'idle' | 'processing' | 'computed' | 'frozen'>('computed');
  const [runResult, setRunResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExecuteRun = async () => {
    setRunning(true);
    setStatusMessage('Acquiring Cloudflare Durable Object Lock (PayrollRunLock)...');
    try {
      // Build 100 sample employees for run
      const employees = Array.from({ length: 107 }, (_, i) => {
        const id = `emp_${String(i + 1).padStart(4, '0')}`;
        const basic = 15000 + ((i * 7) % 65000);
        return {
          employeeId: id,
          basicPay: basic,
          daPercent: 75,
          hraPercent: 30,
          allowances: { conveyance: 1600, medical: 1250, special: round(basic * 0.10) },
          lopDays: 0,
          stateCode: 'MH',
          taxRegime: 'new' as const,
        };
      });

      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: 'org_demo_001',
          month: parseInt(selectedMonth, 10),
          year: parseInt(selectedYear, 10),
          workingDays: 31,
          employees
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRunResult(data);
        setRunStatus('computed');
        setStatusMessage('Payroll computed successfully! All 107 employee records saved to D1.');
      } else {
        const err = await res.json();
        setStatusMessage(`Run blocked: ${err.error || 'Concurrent lock active or error'}`);
      }
    } catch (e: any) {
      setStatusMessage(`Payroll run error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleFreezeMonth = async () => {
    setFreezing(true);
    setStatusMessage('Freezing payroll month... Making records immutable in D1.');
    try {
      const monthId = `org_demo_001:${selectedYear}:${selectedMonth}`;
      const res = await fetch(`/api/payroll/freeze/${monthId}`, {
        method: 'POST'
      });

      if (res.ok) {
        setRunStatus('frozen');
        setStatusMessage(`Month ${selectedMonth}/${selectedYear} is now PERMANENTLY FROZEN. Edits are locked.`);
      } else {
        const err = await res.json();
        setStatusMessage(`Freeze error: ${err.error}`);
      }
    } catch (e: any) {
      setStatusMessage(`Freeze error: ${e.message}`);
    } finally {
      setFreezing(false);
    }
  };

  function round(val: number) {
    return Math.round(val);
  }

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Payroll Execution & Lifecycle Console</h1>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] uppercase font-black px-2 py-0.5 rounded border border-indigo-300">
              Engine 4 + Durable Object Lock
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Atomic payroll calculation, distributed locking, statutory deductions math, and immutable month freezing
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
          <Calendar className="w-4 h-4 text-slate-500 ml-1" />
          <label className="text-xs font-semibold text-slate-700">Target Run:</label>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          >
            <option value="2026-3">March 2026 (Active Run)</option>
            <option value="2026-4">April 2026 (Next Cycle)</option>
            <option value="2026-2">February 2026 (Frozen)</option>
          </select>
        </div>
      </div>

      {/* State Machine Visualizer Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Payroll Run Lifecycle State Machine
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
          <div className={`p-3 rounded-lg border transition ${
            runStatus === 'idle' ? 'bg-sky-50 border-sky-500 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="text-sm">1. Draft</div>
            <div className="text-[10px] font-normal mt-0.5">Parameters Prepared</div>
          </div>

          <div className={`p-3 rounded-lg border transition ${
            running || runStatus === 'processing' ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="text-sm flex items-center justify-center gap-1">
              <Cpu className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>2. Processing</span>
            </div>
            <div className="text-[10px] font-normal mt-0.5">DO Lock Acquired</div>
          </div>

          <div className={`p-3 rounded-lg border transition ${
            runStatus === 'computed' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="text-sm">3. Computed</div>
            <div className="text-[10px] font-normal mt-0.5">Disbursal Ready</div>
          </div>

          <div className={`p-3 rounded-lg border transition ${
            runStatus === 'frozen' ? 'bg-slate-900 border-slate-950 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="text-sm flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>4. Frozen</span>
            </div>
            <div className="text-[10px] font-normal mt-0.5">Immutable Audit Lock</div>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-sky-50 border border-sky-200 text-sky-900 p-2.5 rounded text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Main Console Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Run Execution Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-sky-600 fill-current" />
              Execute Monthly Payroll Calculation
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Acquires the Distributed Lock, processes gross wages, EPF, EPS, ESI, Professional Tax, and Income Tax TDS for all active employees.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-600">Organization:</span>
              <span className="font-bold text-slate-900">ABCD SCHOOL (DEMO)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Active Staff:</span>
              <span className="font-bold text-slate-900">107 Records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Estimated Gross Payout:</span>
              <span className="font-bold text-emerald-700">₹63,30,684.00</span>
            </div>
          </div>

          <button
            onClick={handleExecuteRun}
            disabled={running || runStatus === 'frozen'}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs shadow transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Computing Payroll...' : 'Trigger Payroll Run (March 2026)'}</span>
          </button>
        </div>

        {/* Freeze Month Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              Freeze Payroll Month (Immutable Finalization)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Locks the salary register permanently. Once frozen, statutory numbers cannot be modified and banks can safely disburse payments.
            </p>
          </div>

          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 space-y-1 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Immutability Safeguard</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Freezing creates a permanent audit log entry and guarantees that subsequent runs for this org and month will be rejected by the DO lock.
            </p>
          </div>

          <button
            onClick={handleFreezeMonth}
            disabled={freezing || runStatus === 'frozen'}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs shadow transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{runStatus === 'frozen' ? 'Month Is Frozen' : freezing ? 'Freezing Month...' : 'Freeze March 2026 Payroll'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
