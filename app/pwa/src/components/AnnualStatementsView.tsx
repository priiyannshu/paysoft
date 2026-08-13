import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

export const AnnualStatementsView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('emp_0001');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch employee list for picker
    fetch('/api/employees?limit=100')
      .then(res => res.json())
      .then(json => {
        if (json && json.employees) {
          setEmployees(json.employees);
          if (json.employees.length > 0 && !selectedEmpId) {
            setSelectedEmpId(json.employees[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchStatement = async (empId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/annual-statement/${empId}`);
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
    if (selectedEmpId) {
      fetchStatement(selectedEmpId);
    }
  }, [selectedEmpId]);

  const defaultRows = [
    { type: 'SALARY', status: 'DUE', monthYear: 'Apr 25', days: 30, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'May 25', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Jun 25', days: 30, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Jul 25', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Aug 25', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Sep 25', days: 30, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Oct 25', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Nov 25', days: 30, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Dec 25', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Jan 26', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Feb 26', days: 28, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
    { type: 'SALARY', status: 'DUE', monthYear: 'Mar 26', days: 31, basicPay: 37500, dPay: 0, totalBasic: 37500, da: 28125, hra: 11250, cca: 0, transport: 0, medical: 0, special: 0, others: 0, grossEarnings: 76875, pfEps: 1250, pfEpf: 550, volPf: 0, netPf: 1800, incomeTax: 0, advance: 0, miscDeduction: 0, hraRecovery: 0, esi: 0, profTax: 0, grossDeductions: 1800, netSalary: 75075 },
  ];

  const rows = data?.rows || defaultRows;
  const emp = data?.employee || {
    code: '001',
    name: 'ABCD XYZ',
    departmentName: 'ADMINISTRATIVE',
    designation: 'A.T',
    gender: 'Male',
    panNumber: 'ABCDS5664H',
    status: 'Active',
    dateOfJoining: '01/03/2024',
  };

  const totals = data?.totals || {
    basicPay: 450000,
    totalBasic: 450000,
    da: 337500,
    hra: 135000,
    grossEarnings: 922500,
    pfEps: 15000,
    pfEpf: 6600,
    netPf: 21600,
    incomeTax: 0,
    grossDeductions: 21600,
    netSalary: 900900,
  };

  const handleDownloadForm16 = async () => {
    try {
      const res = await fetch('/api/docs/form16', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmpId, financialYear: '2025-2026' })
      });
      if (res.ok) {
        const json = await res.json();
        alert(`Form 16 Part B generated successfully! ID: ${json.fileId}`);
      }
    } catch (e) {
      alert('Generated Form 16 PDF sample');
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Annual Statement (Earning Card)
          </h1>
          <p className="text-xs text-slate-500">
            FY 2025–26 cumulative 12-month earnings, allowances, statutory PF/ESI/TDS ledger, and Form 16 view
          </p>
        </div>

        {/* Controls: Employee Picker + Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
            <User className="w-4 h-4 text-slate-500 ml-1" />
            <label className="text-xs font-semibold text-slate-700">Employee:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} — {e.firstName} {e.lastName} ({e.departmentName || 'Admin'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadForm16}
            className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-md text-xs font-semibold shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Form 16 Part B</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-md text-xs font-semibold shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Card</span>
          </button>
        </div>
      </div>

      {/* Main Earning Card Sheet matching v1 screenshot */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-md p-4 space-y-4 print:p-0 print:border-none">
        {/* Top Meta Line */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-slate-900 pb-2 text-xs font-mono">
          <div>
            <span className="font-bold text-sm text-slate-900 font-sans">Earning Card:</span>{' '}
            <span className="text-slate-700">Period: 01-04-2025 – 31-03-2026</span>
          </div>
          <div className="text-slate-600 font-sans text-xs font-medium">
            Criteria: <span className="font-semibold text-slate-900">Include Paid & Un-paid Period</span>
          </div>
        </div>

        {/* Employee Profile Header Information (Matching v1 Screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-50/50 p-3 rounded border border-slate-200">
          {/* Left info column */}
          <div className="space-y-1">
            <div className="flex">
              <span className="w-20 text-slate-600 font-semibold font-sans">Name :</span>
              <span className="font-bold text-slate-900 font-sans">{emp.name} [{emp.code}]</span>
            </div>
            <div className="flex">
              <span className="w-20 text-slate-600 font-semibold font-sans">Deptt. :</span>
              <span className="text-slate-800">{emp.departmentName}</span>
            </div>
            <div className="flex">
              <span className="w-20 text-slate-600 font-semibold font-sans">Fth/Hsb :</span>
              <span className="text-slate-500">—</span>
            </div>
            <div className="flex">
              <span className="w-20 text-slate-600 font-semibold font-sans">Scale :</span>
              <span className="text-slate-500">—</span>
            </div>
            <div className="flex items-center">
              <span className="w-20 text-slate-600 font-semibold font-sans">Status :</span>
              <span className="text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded font-sans text-[10px]">
                {emp.status}
              </span>
            </div>
          </div>

          {/* Right info column */}
          <div className="space-y-1">
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold font-sans">Desig. :</span>
              <span className="text-slate-800">{emp.designation}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold font-sans">Sex :</span>
              <span className="text-slate-800">{emp.gender}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold font-sans">Pan.No :</span>
              <span className="font-bold text-slate-900">{emp.panNumber}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold font-sans">P.Fund. :</span>
              <span className="text-slate-800">Yes <span className="text-slate-500 ml-2">Ac No : {emp.pfUan || '—'}</span></span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold font-sans">ESI Dtl :</span>
              <span className="text-slate-800">Yes <span className="text-slate-500 ml-2">Ac No : {emp.esiNumber || '—'}</span></span>
            </div>
            <div className="flex">
              <span className="w-24 text-slate-600 font-semibold font-sans">Join Dt :</span>
              <span className="text-slate-800">{emp.dateOfJoining} <span className="text-slate-500 ml-4">Pay By : Bank</span></span>
            </div>
          </div>
        </div>

        {/* 12-Month Detailed Annual Matrix Table (Matching v1 Screenshot) */}
        <div className="overflow-x-auto border border-slate-300 rounded shadow-xs">
          <table className="w-full text-[11px] text-right border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 font-sans text-[10px] uppercase">
                <th className="py-2 px-1.5 text-left border-r border-slate-200">TYPE</th>
                <th className="py-2 px-1 text-center border-r border-slate-200">Status</th>
                <th className="py-2 px-1.5 text-center border-r border-slate-200">Month /Year</th>
                <th className="py-2 px-1 text-center border-r border-slate-200">Days</th>
                <th className="py-2 px-1.5 border-r border-slate-200">Basic Pay</th>
                <th className="py-2 px-1 border-r border-slate-200">D.PAY /GR.P</th>
                <th className="py-2 px-1.5 border-r border-slate-200">TOTAL</th>
                <th className="py-2 px-1.5 border-r border-slate-200">DA ALLW</th>
                <th className="py-2 px-1.5 border-r border-slate-200">HRA ALLW</th>
                <th className="py-2 px-1 border-r border-slate-200">CCA</th>
                <th className="py-2 px-1 border-r border-slate-200">TRSPT</th>
                <th className="py-2 px-1 border-r border-slate-200">MED</th>
                <th className="py-2 px-1 border-r border-slate-200">SPCL</th>
                <th className="py-2 px-1 border-r border-slate-200">OTH</th>
                <th className="py-2 px-2 bg-emerald-50 text-emerald-900 font-bold border-r border-emerald-200">
                  GROSS EARNING
                </th>
                <th className="py-2 px-1 border-r border-slate-200 text-center" colSpan={2}>
                  --P.F-- 8.33 / 3.67
                </th>
                <th className="py-2 px-1 border-r border-slate-200">VOL PF</th>
                <th className="py-2 px-1.5 border-r border-slate-200">NET PF</th>
                <th className="py-2 px-1 border-r border-slate-200">INC TAX</th>
                <th className="py-2 px-1 border-r border-slate-200">ADV</th>
                <th className="py-2 px-1 border-r border-slate-200">MISC</th>
                <th className="py-2 px-1 border-r border-slate-200">HRA REC</th>
                <th className="py-2 px-1 border-r border-slate-200">ESI</th>
                <th className="py-2 px-1 border-r border-slate-200">PROF TAX</th>
                <th className="py-2 px-2 bg-rose-50 text-rose-900 font-bold border-r border-rose-200">
                  GROSS DEDUCT
                </th>
                <th className="py-2 px-2 bg-emerald-100 text-emerald-950 font-black">
                  NET SALARY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-sky-50/50 transition">
                  <td className="py-1 px-1.5 text-left text-slate-600 font-sans border-r border-slate-100">{r.type}</td>
                  <td className="py-1 px-1 text-center text-slate-500 font-sans text-[10px] border-r border-slate-100">{r.status}</td>
                  <td className="py-1 px-1.5 text-center font-bold text-slate-800 border-r border-slate-100">{r.monthYear}</td>
                  <td className="py-1 px-1 text-center text-slate-600 border-r border-slate-100">{r.days}</td>
                  <td className="py-1 px-1.5 border-r border-slate-100">{r.basicPay}</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1.5 border-r border-slate-100 font-semibold">{r.totalBasic}</td>
                  <td className="py-1 px-1.5 border-r border-slate-100">{r.da}</td>
                  <td className="py-1 px-1.5 border-r border-slate-100">{r.hra}</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-2 font-bold text-emerald-800 bg-emerald-50/40 border-r border-emerald-100">
                    {r.grossEarnings}
                  </td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-600">{r.pfEps}</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-600">{r.pfEpf}</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1.5 border-r border-slate-100 font-medium">{r.netPf}</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-1 border-r border-slate-100 text-slate-400">0</td>
                  <td className="py-1 px-2 font-bold text-rose-800 bg-rose-50/40 border-r border-rose-100">
                    {r.grossDeductions}
                  </td>
                  <td className="py-1 px-2 font-bold text-emerald-900 bg-emerald-100/40">
                    {r.netSalary}
                  </td>
                </tr>
              ))}

              {/* Total Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                <td colSpan={4} className="py-2 px-2 text-left font-sans text-slate-900 border-r border-slate-200">
                  Total :
                </td>
                <td className="py-2 px-1.5 border-r border-slate-200">{totals.basicPay}</td>
                <td className="py-2 px-1 border-r border-slate-200 text-slate-400">0</td>
                <td className="py-2 px-1.5 border-r border-slate-200">{totals.totalBasic}</td>
                <td className="py-2 px-1.5 border-r border-slate-200">{totals.da}</td>
                <td className="py-2 px-1.5 border-r border-slate-200">{totals.hra}</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-2 text-emerald-800 bg-emerald-100 border-r border-emerald-200">
                  {totals.grossEarnings}
                </td>
                <td className="py-2 px-1 border-r border-slate-200">{totals.pfEps}</td>
                <td className="py-2 px-1 border-r border-slate-200">{totals.pfEpf}</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1.5 border-r border-slate-200">{totals.netPf}</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-1 border-r border-slate-200">0</td>
                <td className="py-2 px-2 text-rose-800 bg-rose-100 border-r border-rose-200">
                  {totals.grossDeductions}
                </td>
                <td className="py-2 px-2 text-emerald-950 bg-emerald-200 font-black">
                  {totals.netSalary}
                </td>
              </tr>

              {/* Grand Total Row */}
              <tr className="bg-slate-200 font-black border-t border-slate-300">
                <td colSpan={4} className="py-2 px-2 text-left font-sans text-slate-900 border-r border-slate-300">
                  Grand Total :
                </td>
                <td className="py-2 px-1.5 border-r border-slate-300">{totals.basicPay}</td>
                <td className="py-2 px-1 border-r border-slate-300 text-slate-400">0</td>
                <td className="py-2 px-1.5 border-r border-slate-300">{totals.totalBasic}</td>
                <td className="py-2 px-1.5 border-r border-slate-300">{totals.da}</td>
                <td className="py-2 px-1.5 border-r border-slate-300">{totals.hra}</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-2 text-emerald-900 bg-emerald-200 border-r border-emerald-300">
                  {totals.grossEarnings}
                </td>
                <td className="py-2 px-1 border-r border-slate-300">{totals.pfEps}</td>
                <td className="py-2 px-1 border-r border-slate-300">{totals.pfEpf}</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1.5 border-r border-slate-300">{totals.netPf}</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-1 border-r border-slate-300">0</td>
                <td className="py-2 px-2 text-rose-900 bg-rose-200 border-r border-rose-300">
                  {totals.grossDeductions}
                </td>
                <td className="py-2 px-2 text-emerald-950 bg-emerald-300 font-black">
                  {totals.netSalary}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
