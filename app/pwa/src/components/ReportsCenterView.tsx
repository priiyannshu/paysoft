import React, { useState } from 'react';
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
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const ReportsCenterView: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [generating, setGenerating] = useState<string | null>(null);
  const [downloadLog, setDownloadLog] = useState<any[]>([]);

  const handleGenerate = async (endpoint: string, typeName: string, format: string) => {
    setGenerating(typeName);
    try {
      const res = await fetch(`/api/docs/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(selectedMonth, 10),
          year: parseInt(selectedYear, 10),
          orgId: 'org_demo_001',
          employeeId: 'emp_0001'
        })
      });

      if (res.ok) {
        const json = await res.json();
        const newLog = {
          id: json.fileId || `${endpoint}-${Date.now()}`,
          name: `${typeName} (${selectedMonth}/${selectedYear})`,
          format,
          url: json.url,
          timestamp: new Date().toLocaleTimeString()
        };
        setDownloadLog(prev => [newLog, ...prev]);
        
        // Trigger synthetic download
        const blob = new Blob([`PaySoft v2 Generated Statutory Report: ${typeName}\nPeriod: ${selectedMonth}/${selectedYear}\nFile Reference: ${json.fileId}`], { type: 'text/plain' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${endpoint}-${selectedYear}-${selectedMonth}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  const reports = [
    {
      id: 'bank-advice',
      title: 'Bank Payment Advice',
      category: 'Bank Report(s)',
      format: 'XLSX',
      badge: 'Disbursal Ready',
      desc: 'Standard NEFT/RTGS batch file with Beneficiary Name, Account Number, IFSC Code, and Net Pay for HDFC, SBI, ICICI, Axis portals.',
      endpoint: 'bank-advice',
      icon: Building,
      color: 'sky'
    },
    {
      id: 'ecr',
      title: 'EPFO Electronic Challan (ECR)',
      category: 'Fund - PF Report',
      format: 'TXT',
      badge: 'Statutory EPFO',
      desc: 'Fixed-width EPFO format (#~#) with Member UAN, Gross Wages, EPF Wages (capped at ₹15k), 8.33% EPS, and 3.67% EPF contributions.',
      endpoint: 'ecr',
      icon: ShieldCheck,
      color: 'emerald'
    },
    {
      id: 'esi',
      title: 'ESI Monthly Contribution Return',
      category: 'ESI Report',
      format: 'TXT',
      badge: 'ESIC Portal Ready',
      desc: 'Monthly return containing Insured Person (IP) Number, Days Worked, Total Monthly Wages, and 0.75% / 3.25% deductions under ₹21,000.',
      endpoint: 'ecr',
      icon: ShieldCheck,
      color: 'indigo'
    },
    {
      id: 'payslip',
      title: 'Employee Pay Slip (PDF)',
      category: 'Pay Slip',
      format: 'PDF',
      badge: 'DOB Protected',
      desc: 'Official monthly payslip with earnings heads, statutory deductions, YTD summary, and date-of-birth encryption protection.',
      endpoint: 'payslip',
      icon: FileText,
      color: 'rose'
    },
    {
      id: 'form16',
      title: 'Form 16 Part B (TDS Certificate)',
      category: 'TDS Report(s)',
      format: 'PDF',
      badge: 'Income Tax Act',
      desc: 'Annual statutory certificate of tax deducted at source under Section 203 of the Income Tax Act with chapter VI-A deductions.',
      endpoint: 'form16',
      icon: FileSpreadsheet,
      color: 'amber'
    },
    {
      id: 'register',
      title: 'Monthly Salary Register Extract',
      category: 'Register Monthly',
      format: 'XLSX',
      badge: 'Complete Master',
      desc: 'Full matrix of all 385 employees with Department, Basic, DA, HRA, Gross, PF, ESI, TDS, Professional Tax, and Net Payable.',
      endpoint: 'bank-advice',
      icon: FileSpreadsheet,
      color: 'teal'
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Zero-Hassle Reports Download Center</h1>
            <span className="bg-sky-100 text-sky-800 text-[10px] uppercase font-black px-2 py-0.5 rounded border border-sky-300">
              Engine 6 Connected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            One-click statutory document generation: Bank Advice, EPF ECR, ESI Returns, Form 16, and Payslips
          </p>
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

      {/* Reports Grid (Matching zero_hassle_reports.png menu items) */}
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
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {r.badge}
                </span>

                <button
                  onClick={() => handleGenerate(r.endpoint, r.title, r.format)}
                  disabled={isBusy}
                  className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition"
                >
                  <Download className={`w-3.5 h-3.5 ${isBusy ? 'animate-bounce' : ''}`} />
                  <span>{isBusy ? 'Generating...' : `Download ${r.format}`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated Reports Download Activity Log */}
      {downloadLog.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Recent Downloads Session Log</span>
            <span className="text-[11px] text-slate-400 font-normal">Generated in Edge Memory & R2</span>
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
    </div>
  );
};
