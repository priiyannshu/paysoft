import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useOrg } from './hooks/useOrg';
import { AccessDenied } from './ui/AccessDenied';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Lock,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Settings2,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface ConfigurationItem {
  key: string;
  value: string;
  description?: string;
}

interface PayrollRunItem {
  runId: string;
  month: number;
  year: number;
  dateLabel: string;
  status: 'computed' | 'frozen' | string;
  recordCount: number;
  totalGross: number;
  totalDeductions: number;
  netPay: number;
  totalTds: number;
}

interface DashboardCounts {
  departments: number;
  employees: number;
  missingPan: number;
  missingAadhaar: number;
  missingPf: number;
  missingBank: number;
  unfrozenMonths: number;
  seniorCitizenMismatches: number;
  missingTdsDeposits: number;
  birthdayReminders: number;
  anniversaryReminders: number;
  salaryIncrementReminders?: number;
}

interface AuditIssue {
  employeeId?: string;
  severity: 'Critical' | 'Warning' | 'Info';
  type: string;
  message: string;
}

interface AuditReport {
  orgId: string;
  timestamp: string;
  issues: AuditIssue[];
  summary?: {
    critical: number;
    warning: number;
    info: number;
  };
}

interface FindingGroup {
  type: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  affectedCount: number;
}

export const DashboardView: React.FC = () => {
  const { isEmployee } = useAuth();
  const { org } = useOrg();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedConfigKey, setSelectedConfigKey] = useState<string | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');

  const formatTimestamp = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    setLiveTimestamp(formatTimestamp(new Date()));
    const timer = setInterval(() => {
      setLiveTimestamp(formatTimestamp(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAudit = async () => {
    try {
      const targetOrgId = org.id || 'org_demo_001';
      const res = await fetch(`/api/audit/status/${targetOrgId}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.issues) {
          setAuditReport(json);
        }
      }
    } catch (e) {
      // ignore silently if no audit cached yet
    }
  };

  useEffect(() => {
    fetchStats();
    fetchExistingAudit();
  }, [org.id]);

  const triggerLiveAudit = async () => {
    setAuditRunning(true);
    try {
      const targetOrgId = org.id || 'org_demo_001';
      const res = await fetch(`/api/audit/run?orgId=${targetOrgId}`);
      if (res.ok) {
        const json = await res.json();
        setAuditReport(json);
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to run live compliance scan:', e);
    } finally {
      setAuditRunning(false);
    }
  };

  // RBAC Guard - Employees cannot view Executive Overview / Compliance Dashboard
  if (isEmployee) {
    return <AccessDenied />;
  }

  const counts: DashboardCounts | null = data?.counts || null;
  const configurations: ConfigurationItem[] = data?.configurations || [];
  const payrollRuns: PayrollRunItem[] = data?.payrollRuns || [];
  const softwareVersion: string = data?.organization?.softwareVersion || '2.5.0.0 Pro';

  const selectedConfig = configurations.find((c) => c.key === selectedConfigKey);

  // Group audit findings by type & message to calculate affected counts
  const getGroupedFindings = () => {
    if (!auditReport || !auditReport.issues) return { critical: [], warning: [], info: [] };

    const grouped: Record<string, FindingGroup> = {};

    auditReport.issues.forEach((issue) => {
      const key = `${issue.severity}:${issue.type}:${issue.message}`;
      if (!grouped[key]) {
        grouped[key] = {
          type: issue.type,
          severity: issue.severity,
          message: issue.message,
          affectedCount: 0
        };
      }
      grouped[key].affectedCount += 1;
    });

    const list = Object.values(grouped);
    return {
      critical: list.filter((f) => f.severity === 'Critical'),
      warning: list.filter((f) => f.severity === 'Warning'),
      info: list.filter((f) => f.severity === 'Info')
    };
  };

  const findings = getGroupedFindings();
  const summaryCritical = auditReport?.summary?.critical ?? (auditReport?.issues?.filter(i => i.severity === 'Critical').length || 0);
  const summaryWarning = auditReport?.summary?.warning ?? (auditReport?.issues?.filter(i => i.severity === 'Warning').length || 0);
  const summaryInfo = auditReport?.summary?.info ?? (auditReport?.issues?.filter(i => i.severity === 'Info').length || 0);

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
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-70 text-white px-3 py-2 rounded-md text-xs font-semibold shadow transition cursor-pointer"
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
            <div className="text-[11px] text-slate-400 mt-1">
              Software Version: {softwareVersion}
            </div>

            <div className="my-3 py-2 px-3 bg-slate-50 border border-slate-200 rounded-md">
              <div className="text-sm font-bold text-rose-700 uppercase tracking-wide">
                {org.name}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                Welcome {org.code ? `[${org.code}]` : 'Enterprise User'}!
              </div>
            </div>

            <div className="bg-sky-50/70 border border-sky-100 rounded-md p-2.5 text-xs text-left space-y-1">
              <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider text-center">
                &lt;&lt; Selected Year of Operation &gt;&gt;
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Financial Year:</span>
                <span className="font-mono font-bold text-slate-900">{org.financialYear}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Assessment Year:</span>
                <span className="font-mono font-bold text-slate-900">{org.assessmentYear}</span>
              </div>
            </div>
          </div>

          {/* System Configuration Box */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Settings2 className="w-3.5 h-3.5 text-sky-600" />
                <span>System Configuration</span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Rules & Slabs ({configurations.length})
              </span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse space-y-1">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : configurations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No system configurations returned.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto text-xs">
                {configurations.map((cfg, idx) => {
                  const isSelected = selectedConfigKey === cfg.key;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedConfigKey(cfg.key)}
                      className={`p-2.5 hover:bg-sky-50/50 cursor-pointer transition flex items-center justify-between ${
                        isSelected ? 'bg-sky-50 border-l-4 border-sky-600' : ''
                      }`}
                    >
                      <div className="pr-2">
                        <div className="text-sky-800 hover:text-sky-900 font-medium hover:underline text-[11px]">
                          {cfg.key}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cfg.value}</div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-600' : 'text-slate-300'}`} />
                    </div>
                  );
                })}
              </div>
            )}

            {selectedConfig && (
              <div className="bg-sky-50/80 border-t border-sky-200 p-2.5 text-xs">
                <div className="font-bold text-sky-900 text-[11px]">{selectedConfig.key}</div>
                <div className="text-[11px] text-slate-700 font-mono mt-0.5">{selectedConfig.value}</div>
                {selectedConfig.description && (
                  <div className="text-[10px] text-slate-500 italic mt-1">{selectedConfig.description}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (8 cols): Reminders / Verification Checklist + Monthly Runs Table + Audit Report */}
        <div className="lg:col-span-8 space-y-4">
          {/* Reminders / Updates / Audit Verification Box */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-sky-100/70 border-b border-sky-200 px-3 py-2 flex items-center justify-between">
              <div className="text-xs font-bold text-sky-950 flex items-center space-x-2">
                <span>&lt;&lt; Reminder(s) / Update(s) / Information &gt;&gt;</span>
                <span className="text-[11px] text-sky-700 font-normal">
                  as of: {liveTimestamp || 'loading...'}
                </span>
              </div>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="bg-white hover:bg-slate-50 text-sky-700 px-2.5 py-1 rounded text-[11px] font-semibold border border-sky-300 shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Dashboard</span>
              </button>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto">
              {loading && !counts ? (
                <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                  Loading compliance checklist...
                </div>
              ) : (
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
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 tabular-nums">
                        {counts?.departments ?? 0}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <a href="/employees?view=departments" className="text-[11px] text-sky-600 hover:underline">
                          {counts?.departments ?? 0} Depts
                        </a>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        No of Employees [{counts?.employees ?? 0}]
                      </td>
                      <td className="py-2 px-3 text-sky-700">
                        <a href="/employees" className="hover:underline font-medium">
                          <span className="tabular-nums font-bold font-mono">{counts?.employees ?? 0}</span> - Click here for breakup statistics
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
                        <span className="tabular-nums font-mono font-bold">{counts?.seniorCitizenMismatches ?? 0}</span> - Click here to see detail of mismatches [if any] below
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(counts?.seniorCitizenMismatches ?? 0) === 0 ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">Verified</span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">Review</span>
                        )}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>PAN Missing</span>
                      </td>
                      <td className="py-2 px-3 text-rose-700">
                        <a href="/employees?q=missing-pan" className="hover:underline font-semibold">
                          <span className="tabular-nums font-bold font-mono">{counts?.missingPan ?? 0}</span> - Click here to view details & resolve
                        </a>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(counts?.missingPan ?? 0) > 0 ? (
                          <a href="/employees" className="text-[10px] text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded font-bold">
                            Fix {counts?.missingPan}
                          </a>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">Complete</span>
                        )}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">Missing TDS Deposit data</td>
                      <td className="py-2 px-3 text-slate-600">
                        <span className="tabular-nums font-mono font-bold">{counts?.missingTdsDeposits ?? 0}</span> - Click here to view missing TDS Deposit detail months [if any below]
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] text-slate-500 font-mono tabular-nums">{counts?.missingTdsDeposits ?? 0}</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-amber-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Salary month not frozen</span>
                      </td>
                      <td className="py-2 px-3 text-amber-700">
                        <a href="/payroll" className="hover:underline font-semibold">
                          <span className="tabular-nums font-bold font-mono">{counts?.unfrozenMonths ?? 0}</span> month pending freeze - Click to review
                        </a>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(counts?.unfrozenMonths ?? 0) > 0 ? (
                          <a href="/payroll" className="text-[10px] text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded font-bold">
                            Freeze
                          </a>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">All Frozen</span>
                        )}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">Missing Provident Fund A/c No</td>
                      <td className="py-2 px-3 text-sky-700">
                        <a href="/employees" className="hover:underline">
                          <span className="tabular-nums font-bold font-mono">{counts?.missingPf ?? 0}</span> - Click here to view details
                        </a>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono tabular-nums">{counts?.missingPf ?? 0}</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">Employees with missing Bank Info</td>
                      <td className="py-2 px-3 text-emerald-700 font-medium">
                        <span className="tabular-nums font-bold font-mono">{counts?.missingBank ?? 0}</span> - Click here to view details
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(counts?.missingBank ?? 0) === 0 ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">0 Pending</span>
                        ) : (
                          <span className="text-[10px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">{counts?.missingBank} Missing</span>
                        )}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">Employees with missing Aadhaar No</td>
                      <td className="py-2 px-3 text-sky-700">
                        <a href="/employees" className="hover:underline">
                          <span className="tabular-nums font-bold font-mono">{counts?.missingAadhaar ?? 0}</span> - Click here to view details
                        </a>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono tabular-nums">{counts?.missingAadhaar ?? 0}</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 bg-sky-50/30">
                      <td className="py-2 px-3 font-semibold text-sky-900">Birthday Reminder</td>
                      <td className="py-2 px-3 text-sky-700">
                        <span className="tabular-nums font-bold font-mono">{counts?.birthdayReminders ?? 0}</span> - Click here to view detail
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-medium">🎉 {counts?.birthdayReminders ?? 0}</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 bg-sky-50/30">
                      <td className="py-2 px-3 font-semibold text-sky-900">Joining Anniversary Reminder</td>
                      <td className="py-2 px-3 text-sky-700">
                        <span className="tabular-nums font-bold font-mono">{counts?.anniversaryReminders ?? 0}</span> - Click here to view detail
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-[10px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-medium">🎖️ {counts?.anniversaryReminders ?? 0}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Audit Report Findings Matrix (Rendered when auditReport is available) */}
          {auditReport && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 text-white px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold tracking-wide">Live Compliance Audit & Statutory Findings Matrix</span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Scan Time: {new Date(auditReport.timestamp).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Summary Bar */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center space-x-3 text-xs font-semibold">
                  <span className="text-slate-700">Audit Status Summary:</span>
                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full border border-rose-200 font-bold">
                    <ShieldAlert className="w-3 h-3 text-rose-600" /> {summaryCritical} Critical
                  </span>
                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full border border-amber-200 font-bold">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> {summaryWarning} Warnings
                  </span>
                  <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full border border-sky-200 font-bold">
                    <Info className="w-3 h-3 text-sky-600" /> {summaryInfo} Information
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Org ID: <span className="font-mono text-slate-700">{auditReport.orgId}</span>
                </div>
              </div>

              {/* Findings Lists Grouped by Severity */}
              <div className="p-4 space-y-3 text-xs">
                {/* Critical Findings */}
                {findings.critical.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Critical Compliance Blockers ({findings.critical.length})</span>
                    </div>
                    <div className="divide-y divide-rose-100 border border-rose-200 bg-rose-50/40 rounded-md overflow-hidden">
                      {findings.critical.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-rose-50 transition">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-rose-200 text-rose-900 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                                {item.type}
                              </span>
                              <span className="font-semibold text-rose-950 text-xs">{item.message}</span>
                            </div>
                          </div>
                          <span className="bg-rose-100 text-rose-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-rose-200 shrink-0">
                            {item.affectedCount} {item.affectedCount === 1 ? 'Record' : 'Records'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warning Findings */}
                {findings.warning.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Warnings & Statutory Incompletes ({findings.warning.length})</span>
                    </div>
                    <div className="divide-y divide-amber-100 border border-amber-200 bg-amber-50/40 rounded-md overflow-hidden">
                      {findings.warning.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-amber-50 transition">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-amber-200 text-amber-900 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                                {item.type}
                              </span>
                              <span className="font-medium text-amber-950 text-xs">{item.message}</span>
                            </div>
                          </div>
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-amber-200 shrink-0">
                            {item.affectedCount} {item.affectedCount === 1 ? 'Record' : 'Records'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info Findings */}
                {findings.info.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                      <span>Informational & Advisory Notes ({findings.info.length})</span>
                    </div>
                    <div className="divide-y divide-sky-100 border border-sky-200 bg-sky-50/40 rounded-md overflow-hidden">
                      {findings.info.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-sky-50 transition">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="bg-sky-200 text-sky-900 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                                {item.type}
                              </span>
                              <span className="text-slate-800 text-xs">{item.message}</span>
                            </div>
                          </div>
                          <span className="bg-sky-100 text-sky-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-sky-200 shrink-0">
                            {item.affectedCount} {item.affectedCount === 1 ? 'Record' : 'Records'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {findings.critical.length === 0 && findings.warning.length === 0 && findings.info.length === 0 && (
                  <div className="p-4 text-center text-slate-500 bg-slate-50 rounded border border-slate-200">
                    🎉 No audit issues detected. System compliance is 100%.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monthly Payroll History Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-xs">
              <div className="font-bold flex items-center space-x-2">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Monthly Payroll Runs & Disbursal Summary ({org.financialYear ? `FY ${org.financialYear}` : 'Current FY'})</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[11px] font-mono">{payrollRuns.length} Months Recorded</span>
                <a
                  href="/salary-stats"
                  className="bg-sky-600 hover:bg-sky-500 text-white px-2 py-0.5 rounded text-[11px] font-semibold"
                >
                  Full Trends
                </a>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                  Loading monthly payroll runs...
                </div>
              ) : payrollRuns.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No payroll runs recorded for this organization.
                </div>
              ) : (
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
                    {payrollRuns.map((run: PayrollRunItem, idx: number) => {
                      const isFrozen = run.status === 'frozen';
                      return (
                        <tr key={run.runId || idx} className={`hover:bg-sky-50/60 transition ${idx === 0 ? 'bg-sky-50/40 font-semibold' : ''}`}>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-bold">
                            {run.dateLabel}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-sans">
                            <div className="flex flex-wrap items-center gap-x-2 text-[11px]">
                              <span className="text-slate-500 font-medium">Total Gross:</span>
                              <span className="font-bold text-slate-900 font-mono tabular-nums">
                                ₹{run.totalGross.toLocaleString('en-IN')}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="text-slate-500 font-medium">Total Deduction:</span>
                              <span className="font-bold text-rose-700 font-mono tabular-nums">
                                ₹{run.totalDeductions.toLocaleString('en-IN')}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="text-slate-500 font-medium">Net Pay:</span>
                              <span className="font-bold text-emerald-700 font-mono tabular-nums">
                                ₹{run.netPay.toLocaleString('en-IN')}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="text-slate-500 font-medium">TDS:</span>
                              <span className="font-mono text-slate-800 tabular-nums">
                                ₹{run.totalTds.toLocaleString('en-IN')}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded font-bold font-mono tabular-nums">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
