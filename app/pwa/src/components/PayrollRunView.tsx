import React, { useState, useEffect } from 'react';
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
  Database,
  Info,
  Users,
  DollarSign
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { AccessDenied } from './ui/AccessDenied';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface EmployeeRecord {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  basicPay?: number;
  daPercent?: number;
  hraPercent?: number;
  taxRegime?: string;
  stateCode?: string;
  departmentName?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PayrollRunView: React.FC = () => {
  const { isEmployee, canAccess, loading: authLoading } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [running, setRunning] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [runStatus, setRunStatus] = useState<'idle' | 'processing' | 'computed' | 'frozen'>('computed');
  const [runResult, setRunResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [orgInfo, setOrgInfo] = useState<{ id: string; name: string } | null>(null);
  const [employeeList, setEmployeeList] = useState<EmployeeRecord[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(false);

  // Fetch current org & employee list on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingEmps(true);
      try {
        const [orgRes, empRes] = await Promise.all([
          fetch('/api/org/current'),
          fetch('/api/employees?limit=500')
        ]);

        if (orgRes.ok) {
          const orgData = await orgRes.json();
          setOrgInfo({ id: orgData.id || 'org_demo_001', name: orgData.name || 'ABCD SCHOOL' });
        }

        if (empRes.ok) {
          const empData = await empRes.json();
          setEmployeeList(empData.employees || []);
        }
      } catch (e) {
        console.error('Error loading initial data:', e);
      } finally {
        setLoadingEmps(false);
      }
    };

    fetchInitialData();
  }, []);

  // Compute stats based on real employee list
  const staffCount = employeeList.length;
  const estimatedGross = employeeList.reduce((acc, emp) => {
    const basic = Number(emp.basicPay) || 15000;
    const da = Math.round(basic * ((Number(emp.daPercent) || 75) / 100));
    const hra = Math.round(basic * ((Number(emp.hraPercent) || 30) / 100));
    return acc + basic + da + hra;
  }, 0);

  const monthIdx = parseInt(selectedMonth, 10) - 1;
  const selectedMonthName = MONTH_NAMES[monthIdx] || 'March';

  // Format currency in Indian format
  const formatINR = (val: number) => {
    return '₹' + Math.round(val).toLocaleString('en-IN') + '.00';
  };

  const [progressInfo, setProgressInfo] = useState<{
    percent: number;
    stage: string;
    processed: number;
    total: number;
  } | null>(null);

  // Poll payroll run status & DO progress until computed
  const pollStatus = async (runId: string) => {
    let attempts = 0;
    const maxAttempts = 20;

    const interval = setInterval(async () => {
      attempts++;
      try {
        // 1. Fetch live DO progress
        const progRes = await fetch(`/api/payroll/run-progress/${runId}`);
        if (progRes.ok) {
          const progData = await progRes.json();
          if (progData.progress) {
            setProgressInfo({
              percent: progData.progress.percentComplete || 0,
              stage: progData.progress.currentStage || 'processing',
              processed: progData.progress.processedEmployees || 0,
              total: progData.progress.totalEmployees || employeeList.length,
            });
          }
        }

        // 2. Check full run status
        const res = await fetch(`/api/payroll/status/${runId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'computed') {
            setRunResult(data);
            setRunStatus('computed');
            setProgressInfo({
              percent: 100,
              stage: 'completed',
              processed: data.employeeCount || employeeList.length,
              total: data.employeeCount || employeeList.length,
            });
            setStatusMessage(`Payroll computed successfully! Processed ${data.employeeCount} employee records. Total Net Payable: ${formatINR(data.totalNetPay || 0)}.`);
            clearInterval(interval);
            setRunning(false);
            return;
          } else if (data.status === 'frozen') {
            setRunResult(data);
            setRunStatus('frozen');
            setStatusMessage(`Payroll run ${runId} is frozen.`);
            clearInterval(interval);
            setRunning(false);
            return;
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setRunning(false);
        setStatusMessage('Status polling completed.');
      }
    }, 1500);
  };

  // Handle Trigger Payroll Run
  const handleExecuteRun = async () => {
    setRunning(true);
    setRunStatus('processing');
    setStatusMessage('Acquiring distributed lock & fetching real employee master list...');

    try {
      // 1. Fetch fresh active employee records from server
      const empRes = await fetch('/api/employees?limit=500');
      let empsToProcess = employeeList;
      if (empRes.ok) {
        const empData = await empRes.json();
        empsToProcess = empData.employees || [];
        setEmployeeList(empsToProcess);
      }

      if (empsToProcess.length === 0) {
        setStatusMessage('No active employees found to execute payroll run.');
        setRunning(false);
        setRunStatus('idle');
        return;
      }

      // 2. Map real employee objects to PayrollRun engine format
      const payloadEmployees = empsToProcess.map((emp) => {
        const basic = Number(emp.basicPay) || 15000;
        const da = Math.round(basic * ((Number(emp.daPercent) || 75) / 100));
        const hra = Math.round(basic * ((Number(emp.hraPercent) || 30) / 100));
        const specialAllowance = Math.round(basic * 0.10);
        const conveyance = 1600;
        const medical = 1250;
        const otherAllowances = conveyance + medical;

        return {
          employeeId: emp.id,
          basic,
          da,
          hra,
          specialAllowance,
          otherAllowances,
          workingDays: 31,
          unpaidDays: 0,
          arrearMonths: 0,
          oldBasic: 0,
          oldDa: 0,
          bonuses: 0,
          advanceRecovery: 0,
          rentPaid: 0,
          isMetro: true,
          regime: (emp.taxRegime || 'new') as 'old' | 'new',
          state: emp.stateCode || 'MH',
        };
      });

      const orgId = orgInfo?.id || 'org_demo_001';
      const month = parseInt(selectedMonth, 10);
      const year = parseInt(selectedYear, 10);

      // 3. POST to /api/payroll/run
      const res = await fetch('/api/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          month,
          year,
          employees: payloadEmployees
        })
      });

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Payroll run blocked (409 Conflict): ${err.error || 'A payroll run is currently active or this period is locked.'}`);
        setRunning(false);
        setRunStatus('idle');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setRunResult(data);

        if (data.runId) {
          // Poll status every 2 seconds until computed
          pollStatus(data.runId);
        } else {
          setRunStatus('computed');
          setStatusMessage(`Payroll computed successfully! All ${data.employeeCount || payloadEmployees.length} employee records processed.`);
          setRunning(false);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Run execution failed: ${err.error || res.statusText}`);
        setRunning(false);
        setRunStatus('idle');
      }
    } catch (e: any) {
      setStatusMessage(`Payroll run error: ${e.message}`);
      setRunning(false);
      setRunStatus('idle');
    }
  };

  // Handle Freeze Confirmation & Execution
  const executeFreeze = async () => {
    setShowFreezeConfirm(false);
    setFreezing(true);
    setStatusMessage(`Freezing payroll month ${selectedMonth}/${selectedYear}... Setting period as immutable.`);

    try {
      const orgId = orgInfo?.id || 'org_demo_001';
      const monthId = `${orgId}:${selectedYear}:${selectedMonth}`;
      const res = await fetch(`/api/payroll/freeze/${monthId}`, {
        method: 'POST'
      });

      if (res.ok) {
        setRunStatus('frozen');
        setStatusMessage(`Month ${selectedMonthName} ${selectedYear} is now PERMANENTLY FROZEN. Statutory records are locked.`);
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Freeze error: ${err.error || 'Failed to freeze month. Ensure a computed payroll run exists.'}`);
      }
    } catch (e: any) {
      setStatusMessage(`Freeze error: ${e.message}`);
    } finally {
      setFreezing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
        <span>Authenticating console permissions...</span>
      </div>
    );
  }

  // RBAC Guard
  if (isEmployee || !canAccess(['super_admin', 'hr_lead', 'payroll_accountant'])) {
    return <AccessDenied title="Payroll Console Restricted" />;
  }

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Payroll Execution & Lifecycle Console</h1>
            <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-0.5 rounded border border-indigo-200">
              State Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic payroll calculation, statutory deductions breakdown, and immutable period freeze controls
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
              setRunResult(null);
              setStatusMessage(null);
            }}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          >
            <option value="2026-3">March 2026 (Active Run)</option>
            <option value="2026-4">April 2026 (Next Cycle)</option>
            <option value="2026-2">February 2026 (Frozen)</option>
            <option value="2026-1">January 2026 (Frozen)</option>
            <option value="2025-12">December 2025 (Frozen)</option>
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
            <div className="text-[10px] font-normal mt-0.5">Calculating Heads</div>
          </div>

          <div className={`p-3 rounded-lg border transition ${
            runStatus === 'computed' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <div className="text-sm flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Computed</span>
            </div>
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

        {/* Live DO Granular Progress Bar */}
        {(running || runStatus === 'processing' || progressInfo) && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Cpu className={`w-3.5 h-3.5 text-sky-600 ${running ? 'animate-spin' : ''}`} />
                <span>Stage: <strong className="uppercase font-mono">{progressInfo?.stage.replace('_', ' ') || (running ? 'Processing' : 'Ready')}</strong></span>
              </span>
              <span className="font-mono font-bold text-sky-800">
                {progressInfo ? `${progressInfo.processed} / ${progressInfo.total} (${progressInfo.percent}%)` : (running ? 'Calculating...' : '100%')}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressInfo?.percent || (runStatus === 'computed' || runStatus === 'frozen' ? 100 : running ? 45 : 0)}%` }}
              />
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="bg-sky-50 border border-sky-200 text-sky-900 p-3 rounded-lg text-xs flex items-start gap-2.5 animate-in fade-in">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{statusMessage}</div>
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

          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-sans font-semibold">Organization:</span>
              <span className="font-bold text-slate-900">{orgInfo?.name || 'ABCD SCHOOL'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-sans font-semibold">Active Staff (Master):</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{loadingEmps ? 'Loading...' : `${staffCount} Records`}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-sans font-semibold">Est. Gross Monthly Payout:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {loadingEmps ? 'Calculating...' : formatINR(estimatedGross)}
              </span>
            </div>
          </div>

          <button
            onClick={handleExecuteRun}
            disabled={running || runStatus === 'frozen'}
            className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs shadow transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Computing Payroll...' : `Trigger Payroll Run (${selectedMonthName} ${selectedYear})`}</span>
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

          <div className="bg-amber-50 p-3.5 rounded-md border border-amber-200 space-y-1.5 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Immutability Safeguard</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Freezing creates a permanent audit log entry and guarantees that subsequent runs for this org and month will be rejected by the DO lock.
            </p>
          </div>

          <button
            onClick={() => setShowFreezeConfirm(true)}
            disabled={freezing || runStatus === 'frozen'}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs shadow transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{runStatus === 'frozen' ? 'Month Is Frozen' : freezing ? 'Freezing Month...' : `Freeze ${selectedMonthName} ${selectedYear} Payroll`}</span>
          </button>
        </div>
      </div>

      {/* Computed Run Results Table */}
      {runResult && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payroll Computation Breakdown — Run #{runResult.runId}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {selectedMonthName} {selectedYear} • Processed {runResult.employeeCount || runResult.records?.length || 0} Staff Records
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs px-3 py-1 rounded-lg font-bold">
              Total Net Disbursal: {formatINR(runResult.totalNetPay || 0)}
            </div>
          </div>

          {/* Employee Breakdown Table */}
          {runResult.records && runResult.records.length > 0 && (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Employee ID</th>
                    <th className="p-2.5 text-right">Gross Earnings</th>
                    <th className="p-2.5 text-right">EPF / EPS</th>
                    <th className="p-2.5 text-right">ESI / PT / TDS</th>
                    <th className="p-2.5 text-right">Total Deductions</th>
                    <th className="p-2.5 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {runResult.records.slice(0, 50).map((rec: any, idx: number) => {
                    const deds = rec.deductions || {};
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-bold font-sans text-slate-800">{rec.employeeId}</td>
                        <td className="p-2.5 text-right text-slate-900">₹{Math.round(rec.grossEarnings || 0).toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right text-slate-600">
                          ₹{(deds.pfEmployee || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-right text-slate-600">
                          ₹{((deds.esiEmployee || 0) + (deds.professionalTax || 0) + (deds.tds || 0)).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-right text-rose-700 font-semibold">
                          ₹{Math.round(rec.totalDeductions || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-right text-emerald-700 font-bold">
                          ₹{Math.round(rec.netPay || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {runResult.records.length > 50 && (
                <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-100">
                  Showing first 50 of {runResult.records.length} employee records. Full report accessible in Zero-Hassle Reports.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Freeze Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showFreezeConfirm}
        title="Confirm Payroll Month Freeze"
        message={`This will permanently lock all salary records for ${selectedMonthName} ${selectedYear}. This action cannot be undone.`}
        confirmText={`Freeze ${selectedMonthName} ${selectedYear}`}
        cancelText="Cancel"
        onConfirm={executeFreeze}
        onCancel={() => setShowFreezeConfirm(false)}
        variant="danger"
        loading={freezing}
      />
    </div>
  );
};
