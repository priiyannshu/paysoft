import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Calendar,
  Settings2,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditReport, setAuditReport] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const triggerLiveAudit = async () => {
    setAuditRunning(true);
    try {
      const res = await fetch('/api/audit/run?orgId=org_demo_001');
      if (res.ok) {
        const json = await res.json();
        setAuditReport(json);
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditRunning(false);
    }
  };

  const defaultConfigurations = [
    { key: 'Basic or Dearness Pay Setup', value: 'Unified DA Structure (75% of Basic)' },
    { key: 'Dearness Pay Separate', value: 'No (Integrated with Basic Pay)' },
    { key: 'Dearness Allowance Percentage', value: '75.00 %' },
    { key: 'Dearness Allowance Percent on Transport Allowance', value: '75.00 %' },
    { key: 'HRA Percentage', value: '30.00 % (Metro/Tier-1)' },
    { key: 'Calculate DA', value: 'Yes (Standard Central Index)' },
    { key: 'Alw Calculation', value: 'Pro-Rata Calendar Days' },
    { key: 'PF PERCENTAGE 1 (EPS)', value: '8.33 %' },
    { key: 'PF MAX AMOUNT FOR PF_PERC_1', value: '₹ 1,250.00 / month' },
    { key: 'PF PERCENTAGE 2 (EPF)', value: '3.67 %' },
    { key: 'PF MAX AMOUNT FOR PF_PERC_2', value: '₹ 550.00 / month' },
    { key: 'MAXIMUM BASIC FOR PF', value: '₹ 15,000.00' },
    { key: 'PF SIGNING PERSON NAME', value: 'Priya Sharma (HR Lead)' },
  ];

  const counts = data?.counts || {
    departments: 19,
    employees: 385,
    missingPan: 14,
    missingAadhaar: 97,
    missingPf: 63,
    missingBank: 0,
    unfrozenMonths: 1,
    seniorCitizenMismatches: 0,
    missingTdsDeposits: 0,
    birthdayReminders: 6,
    anniversaryReminders: 41,
    salaryIncrementReminders: 0,
  };

  const payrollRuns = data?.payrollRuns || [
    { runId: 'PR-DEMO-2026-03', month: 3, year: 2026, dateLabel: '31/03/2026', status: 'computed', recordCount: 107, totalGross: 6330684, totalDeductions: 223040, netPay: 6107644, totalTds: 25000 },
    { runId: 'PR-DEMO-2026-02', month: 2, year: 2026, dateLabel: '28/02/2026', status: 'frozen', recordCount: 106, totalGross: 6202809, totalDeductions: 221240, netPay: 5981569, totalTds: 25000 },
    { runId: 'PR-DEMO-2026-01', month: 1, year: 2026, dateLabel: '31/01/2026', status: 'frozen', recordCount: 106, totalGross: 6202809, totalDeductions: 221240, netPay: 5981569, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-12', month: 12, year: 2025, dateLabel: '31/12/2025', status: 'frozen', recordCount: 106, totalGross: 6202809, totalDeductions: 221240, netPay: 5981569, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-11', month: 11, year: 2025, dateLabel: '30/11/2025', status: 'frozen', recordCount: 106, totalGross: 6049233, totalDeductions: 215840, netPay: 5833393, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-10', month: 10, year: 2025, dateLabel: '31/10/2025', status: 'frozen', recordCount: 106, totalGross: 6085342, totalDeductions: 218832, netPay: 5866510, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-09', month: 9, year: 2025, dateLabel: '30/09/2025', status: 'frozen', recordCount: 107, totalGross: 6103305, totalDeductions: 217764, netPay: 5885541, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-08', month: 8, year: 2025, dateLabel: '31/08/2025', status: 'frozen', recordCount: 104, totalGross: 5982167, totalDeductions: 212972, netPay: 5769195, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-07', month: 7, year: 2025, dateLabel: '31/07/2025', status: 'frozen', recordCount: 103, totalGross: 6084900, totalDeductions: 214040, netPay: 5870860, totalTds: 25000 },
    { runId: 'PR-DEMO-2025-06', month: 6, year: 2025, dateLabel: '30/06/2025', status: 'frozen', recordCount: 94, totalGross: 5352852, totalDeductions: 192430, netPay: 5160422, totalTds: 23000 },
    { runId: 'PR-DEMO-2025-05', month: 5, year: 2025, dateLabel: '31/05/2025', status: 'frozen', recordCount: 99, totalGross: 5442361, totalDeductions: 203816, netPay: 5238545, totalTds: 23000 },
    { runId: 'PR-DEMO-2025-04', month: 4, year: 2025, dateLabel: '30/04/2025', status: 'frozen', recordCount: 100, totalGross: 5640205, totalDeductions: 204141, netPay: 5436064, totalTds: 23000 },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow">
            PS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-800">Executive Overview & Compliance Dashboard</h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> System Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Enterprise Indian payroll, compliance verification, and statutory records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerLiveAudit}
            disabled={auditRunning}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-md text-xs font-semibold shadow transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditRunning ? 'animate-spin text-sky-400' : ''}`} />
            <span>{auditRunning ? 'Scanning Audit Rules...' : 'Run Live Compliance Scan'}</span>
          </button>

          <a
            href="/payroll"
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-2 rounded-md text-xs font-semibold shadow transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Open Payroll Run Wizard</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Left Panel (Org & Config) + Right Panel (Audit Checklist & Runs) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (4 cols): Brand, Org Identity & System Configurations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Organization & Year Identity Box */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm text-center">
            <div className="text-3xl font-black tracking-tight text-sky-700 font-serif">
              paysoft<span className="text-amber-500 font-sans text-lg">®</span>
            </div>
            <a
              href="http://www.psrcomputers.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-600 hover:underline block mt-1"
            >
              http://www.psrcomputers.com
            </a>
            <div className="text-[11px] text-slate-400 mt-1">Software Version: 2.5.0.0 Pro</div>

            <div className="my-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-sm font-bold text-rose-700 uppercase tracking-wide">
                ABCD SCHOOL
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                Welcome Psr Computers [PSR]!
              </div>
            </div>

            <div className="bg-sky-50/70 border border-sky-100 rounded-md p-2.5 text-xs text-left space-y-1">
              <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider text-center">
                &lt;&lt; Selected Year of Operation &gt;&gt;
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Financial Year:</span>
                <span className="font-mono font-bold text-slate-900">2025-2026</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Assessment Year:</span>
                <span className="font-mono font-bold text-slate-900">2026-2027</span>
              </div>
            </div>
          </div>

          {/* System Configuration Box matching v1 screenshot */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Settings2 className="w-3.5 h-3.5 text-sky-600" />
                <span>System Configuration</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Rules & Slabs</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto text-xs">
              {defaultConfigurations.map((cfg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedConfig(cfg.key)}
                  className={`p-2.5 hover:bg-sky-50/50 cursor-pointer transition flex items-center justify-between ${
                    selectedConfig === cfg.key ? 'bg-sky-50 border-l-4 border-sky-600' : ''
                  }`}
                >
                  <div className="pr-2">
                    <div className="text-sky-800 hover:text-sky-900 font-medium hover:underline text-[11px]">
                      {cfg.key}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cfg.value}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Reminders / Verification Checklist + Monthly Runs Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Reminders / Updates / Audit Verification Box (Matches v1 screenshot) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-100/70 border-b border-sky-200 px-3 py-2 flex items-center justify-between">
              <div className="text-xs font-bold text-sky-950 flex items-center space-x-2">
                <span>&lt;&lt; Reminder(s) / Update(s) / Information &gt;&gt;</span>
                <span className="text-[11px] text-sky-700 font-normal">as of: 06-04-2026 11:23:51</span>
              </div>
              <button
                onClick={fetchStats}
                className="bg-white hover:bg-slate-50 text-sky-700 px-2.5 py-1 rounded text-[11px] font-semibold border border-sky-300 shadow-xs flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Dashboard</span>
              </button>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3 w-1/3">Category</th>
                    <th className="py-2 px-3">Information & Audit Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Salary stats below</td>
                    <td className="py-2 px-3 text-sky-600">
                      <a href="/salary-stats" className="hover:underline flex items-center gap-1 font-medium">
                        Click here to view details <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <a href="/salary-stats" className="text-[11px] text-slate-500 hover:text-sky-600">View</a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">No of Departments</td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{counts.departments}</td>
                    <td className="py-2 px-3 text-right">
                      <a href="/employees?view=departments" className="text-[11px] text-sky-600 hover:underline">19 Depts</a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">No of Employees [{counts.employees}]</td>
                    <td className="py-2 px-3 text-sky-700">
                      <a href="/employees" className="hover:underline font-medium">
                        {counts.employees} - Click here for breakup statistics
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <a href="/employees" className="text-[11px] text-sky-600 hover:underline font-medium">Browse All</a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Senior Citizen mismatches</span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      <span>0 - Click here to see detail of mismatches [if any] below</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">Verified</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>PAN Missing</span>
                    </td>
                    <td className="py-2 px-3 text-rose-700">
                      <a href="/employees?q=missing-pan" className="hover:underline font-semibold">
                        {counts.missingPan} - Click here to view details & resolve
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <a href="/employees" className="text-[10px] text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded font-bold">
                        Fix {counts.missingPan}
                      </a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Missing TDS Deposit data</td>
                    <td className="py-2 px-3 text-slate-600">
                      0 - Click here to view missing TDS Deposit detail months [if any below]
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-slate-500 font-mono">0</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-amber-800 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Salary month not frozen</span>
                    </td>
                    <td className="py-2 px-3 text-amber-700">
                      <a href="/payroll" className="hover:underline font-semibold">
                        {counts.unfrozenMonths} month pending freeze (March 2026) - Click to review
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <a href="/payroll" className="text-[10px] text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded font-bold">
                        Freeze
                      </a>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Missing Provident Fund A/c No</td>
                    <td className="py-2 px-3 text-sky-700">
                      <a href="/employees" className="hover:underline">
                        {counts.missingPf} - Click here to view details
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{counts.missingPf}</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Employees with missing Bank Info</td>
                    <td className="py-2 px-3 text-emerald-700 font-medium">
                      0 - Click here to view details
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">0 Pending</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">Employees with missing Aadhaar No</td>
                    <td className="py-2 px-3 text-sky-700">
                      <a href="/employees" className="hover:underline">
                        {counts.missingAadhaar} - Click here to view details
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{counts.missingAadhaar}</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 bg-sky-50/30">
                    <td className="py-2 px-3 font-semibold text-sky-900">Birthday Reminder [April]</td>
                    <td className="py-2 px-3 text-sky-700">
                      {counts.birthdayReminders} - Click here to view detail
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-medium">🎉 6</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 bg-sky-50/30">
                    <td className="py-2 px-3 font-semibold text-sky-900">Joining Anniversary Reminder [April]</td>
                    <td className="py-2 px-3 text-sky-700">
                      {counts.anniversaryReminders} - Click here to view detail
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className="text-[10px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-medium">🎖️ 41</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Payroll History Table (Matches v1 screenshot blue matrix) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-xs">
              <div className="font-bold flex items-center space-x-2">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Monthly Payroll Runs & Disbursal Summary (FY 2025–2026)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[11px]">12 Months Recorded</span>
                <a
                  href="/salary-stats"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-2 py-0.5 rounded text-[11px] font-semibold"
                >
                  Full Trends
                </a>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-slate-800 text-slate-200 text-[11px] uppercase tracking-wider font-semibold z-10">
                  <tr>
                    <th className="py-2 px-3">Date / Category</th>
                    <th className="py-2 px-3">Monthly Financials & Records Breakdown</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {payrollRuns.map((run: any, idx: number) => {
                    const isFrozen = run.status === 'frozen';
                    return (
                      <tr key={idx} className={`hover:bg-sky-50/60 transition ${idx === 0 ? 'bg-sky-50/40 font-semibold' : ''}`}>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-bold">
                          {run.dateLabel}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-sans">
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px]">
                            <span className="text-slate-500 font-medium">Total Gross:</span>
                            <span className="font-bold text-slate-900 font-mono">₹{run.totalGross.toLocaleString('en-IN')}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500 font-medium">Total Deduction:</span>
                            <span className="font-bold text-rose-700 font-mono">₹{run.totalDeductions.toLocaleString('en-IN')}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500 font-medium">Net Pay:</span>
                            <span className="font-bold text-emerald-700 font-mono">₹{run.netPay.toLocaleString('en-IN')}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-500 font-medium">TDS:</span>
                            <span className="font-mono text-slate-800">₹{run.totalTds.toLocaleString('en-IN')}</span>
                            <span className="text-slate-300">/</span>
                            <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                              #{run.recordCount} Records
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isFrozen ? (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                              <Lock className="w-2.5 h-2.5" /> Frozen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              <RefreshCw className="w-2.5 h-2.5" /> Computed
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <a
                            href={`/reports?month=${run.month}&year=${run.year}`}
                            className="text-sky-600 hover:text-sky-800 font-sans text-xs font-semibold hover:underline mr-2"
                          >
                            Reports
                          </a>
                          <a
                            href={`/salary-stats?month=${run.month}&year=${run.year}`}
                            className="text-slate-600 hover:text-slate-900 font-sans text-xs hover:underline"
                          >
                            Stats
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
