import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Building,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownToLine,
  ExternalLink,
  Printer,
  Eye,
  UserCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { AccessDenied } from './ui/AccessDenied';
import { DocumentPreview } from './ui/DocumentPreview';

interface EmployeeOption {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
}

export const ReportsCenterView: React.FC = () => {
  const { isEmployee, canAccess, loading: authLoading } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('emp_0001');

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmps, setLoadingEmps] = useState(false);

  const [generating, setGenerating] = useState<string | null>(null);
  const [downloadLog, setDownloadLog] = useState<any[]>([]);

  // State for DocumentPreview modal
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    htmlContent: string;
    filename: string;
  }>({
    isOpen: false,
    title: '',
    htmlContent: '',
    filename: ''
  });

  // Fetch real employee list for payslip / Form 16 selector
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmps(true);
      try {
        const res = await fetch('/api/employees?limit=500');
        if (res.ok) {
          const data = await res.json();
          const list = data.employees || [];
          setEmployees(list);
          if (list.length > 0 && !list.some((e: EmployeeOption) => e.id === selectedEmployeeId)) {
            setSelectedEmployeeId(list[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load employee list:', e);
      } finally {
        setLoadingEmps(false);
      }
    };

    fetchEmployees();
  }, []);

  const triggerDownload = (blob: Blob, filename: string) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleGenerate = async (endpoint: string, typeName: string, format: string) => {
    setGenerating(typeName);
    try {
      const res = await fetch(`/api/docs/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(selectedMonth, 10),
          year: parseInt(selectedYear, 10),
          financialYear: `${selectedYear}-${parseInt(selectedYear, 10) + 1}`,
          orgId: 'org_demo_001',
          employeeId: selectedEmployeeId
        })
      });

      if (res.ok) {
        const json = await res.json();
        const filename = json.filename || `${endpoint}-${selectedYear}-${selectedMonth}.${format.toLowerCase()}`;

        const newLog = {
          id: json.fileId || filename,
          name: `${typeName} (${selectedMonth}/${selectedYear})`,
          format,
          timestamp: new Date().toLocaleTimeString()
        };
        setDownloadLog(prev => [newLog, ...prev]);

        if (json.htmlContent) {
          // Open DocumentPreview modal for HTML/PDF payslip / Form 16
          setPreviewDoc({
            isOpen: true,
            title: `${typeName} — ${json.employeeName || selectedEmployeeId}`,
            htmlContent: json.htmlContent,
            filename
          });
        } else if (json.dataBase64) {
          // XLSX binary download
          const binaryString = window.atob(json.dataBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          triggerDownload(blob, filename);
        } else if (json.textContent) {
          // TXT file download (ECR / ESI)
          const blob = new Blob([json.textContent], { type: 'text/plain;charset=utf-8' });
          triggerDownload(blob, filename);
        }
      }
    } catch (e) {
      console.error('Report generation error:', e);
    } finally {
      setGenerating(null);
    }
  };

  const handlePreview = async (endpoint: string, typeName: string) => {
    await handleGenerate(endpoint, typeName, 'HTML');
  };

  const reports = [
    {
      id: 'bank-advice',
      title: 'Bank Payment Advice',
      category: 'Bank Report(s)',
      format: 'XLSX',
      badge: 'Disbursal Ready',
      desc: 'NEFT/RTGS batch file with Beneficiary Name, Account Number, IFSC Code, and Net Pay for HDFC, SBI, ICICI, Axis portals.',
      endpoint: 'bank-advice',
      icon: Building,
      hasPreview: false,
      requiresEmployee: false,
    },
    {
      id: 'ecr',
      title: 'EPFO Electronic Challan (ECR)',
      category: 'Fund - PF Report',
      format: 'TXT',
      badge: 'Statutory EPFO',
      desc: 'Official EPFO format (#~#) with Member UAN, Gross Wages, EPF Wages (capped at ₹15,000), 8.33% EPS, and 3.67% EPF contributions.',
      endpoint: 'ecr',
      icon: ShieldCheck,
      hasPreview: false,
      requiresEmployee: false,
    },
    {
      id: 'esi',
      title: 'ESI Monthly Contribution Return',
      category: 'ESI Report',
      format: 'TXT',
      badge: 'ESIC Portal Ready',
      desc: 'Monthly return containing Insured Person (IP) Number, Days Worked, Total Monthly Wages, and 0.75% / 3.25% deductions under ₹21,000.',
      endpoint: 'esi',
      icon: ShieldCheck,
      hasPreview: false,
      requiresEmployee: false,
    },
    {
      id: 'payslip',
      title: 'Employee Pay Slip',
      category: 'Pay Slip',
      format: 'HTML',
      badge: 'Official Format',
      desc: 'Monthly payslip with itemized earnings heads, statutory deductions, YTD summary, and net take-home pay.',
      endpoint: 'payslip',
      icon: FileText,
      hasPreview: true,
      requiresEmployee: true,
    },
    {
      id: 'form16',
      title: 'Form 16 Part B (TDS Certificate)',
      category: 'TDS Report(s)',
      format: 'HTML',
      badge: 'Income Tax Act',
      desc: 'Annual statutory certificate of tax deducted at source under Section 203 of the Income Tax Act with chapter VI-A deductions.',
      endpoint: 'form16',
      icon: FileSpreadsheet,
      hasPreview: true,
      requiresEmployee: true,
    },
    {
      id: 'register',
      title: 'Monthly Salary Register Extract',
      category: 'Register Monthly',
      format: 'XLSX',
      badge: 'Complete Master',
      desc: 'Full matrix of all active employees with Department, Basic, DA, HRA, Gross, PF, ESI, TDS, Professional Tax, and Net Payable.',
      endpoint: 'register',
      icon: FileSpreadsheet,
      hasPreview: false,
      requiresEmployee: false,
    },
  ];

  if (authLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
        <span>Authenticating console permissions...</span>
      </div>
    );
  }

  // RBAC Guard: Employees are not allowed to view institutional reports console
  if (isEmployee || !canAccess(['super_admin', 'hr_lead', 'payroll_accountant'])) {
    return <AccessDenied title="Institutional Reports Restricted" />;
  }

  const selectedEmpObj = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Zero-Hassle Reports Center</h1>
            <span className="bg-sky-50 text-sky-700 text-[11px] font-semibold px-2.5 py-0.5 rounded border border-sky-200">
              Statutory Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant document generation: Bank Advice, EPF ECR, ESI Returns, Form 16, and Pay Slips
          </p>
        </div>

        {/* Filters bar: Month + Employee Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Employee Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
            <UserCheck className="w-4 h-4 text-slate-500 ml-1" />
            <label className="text-xs font-semibold text-slate-700">Target Staff:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              disabled={loadingEmps}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none max-w-[220px] truncate"
            >
              {loadingEmps ? (
                <option value="">Loading Staff List...</option>
              ) : (
                employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} — {e.firstName} {e.lastName} ({e.departmentName || 'General'})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
            <Calendar className="w-4 h-4 text-slate-500 ml-1" />
            <label className="text-xs font-semibold text-slate-700">Target Month:</label>
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
              <option value="2026-2">February 2026 (Frozen)</option>
              <option value="2026-1">January 2026 (Frozen)</option>
              <option value="2025-12">December 2025 (Frozen)</option>
              <option value="2025-11">November 2025 (Frozen)</option>
              <option value="2025-10">October 2025 (Frozen)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Employee Context Badge */}
      {selectedEmpObj && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Target Employee selected for Payslip & Form 16: <strong>{selectedEmpObj.firstName} {selectedEmpObj.lastName}</strong> ({selectedEmpObj.code} • {selectedEmpObj.departmentName || 'General'})
            </span>
          </div>
          <span className="text-[11px] text-sky-700 font-mono">ID: {selectedEmpObj.id}</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          const isBusy = generating === r.title;
          return (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {r.category}
                  </span>
                  <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                    .{r.format}
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 mt-2">
                  <div className="w-8 h-8 rounded bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{r.title}</h2>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                  {r.desc}
                </p>

                {r.requiresEmployee && selectedEmpObj && (
                  <div className="mt-2 text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 truncate">
                    For: {selectedEmpObj.firstName} {selectedEmpObj.lastName}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {r.badge}
                </span>

                <div className="flex items-center gap-1.5">
                  {r.hasPreview && (
                    <button
                      onClick={() => handlePreview(r.endpoint, r.title)}
                      disabled={isBusy}
                      title="Preview Document Modal"
                      className="p-1.5 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleGenerate(r.endpoint, r.title, r.format)}
                    disabled={isBusy}
                    className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isBusy ? 'animate-bounce' : ''}`} />
                    <span>
                      {isBusy
                        ? 'Generating...'
                        : r.format === 'HTML'
                        ? 'View Document'
                        : `Download ${r.format}`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated Reports Download Activity Log */}
      {downloadLog.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Recent Downloads & Document Views Log</span>
            <span className="text-[11px] text-slate-400 font-normal">Generated in Current Session</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {downloadLog.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between font-mono">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 font-sans">{item.name}</span>
                  <span className="text-slate-400 text-[11px]">({item.id})</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Generated at {item.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={previewDoc.isOpen}
        title={previewDoc.title}
        htmlContent={previewDoc.htmlContent}
        filename={previewDoc.filename}
        onClose={() => setPreviewDoc(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
