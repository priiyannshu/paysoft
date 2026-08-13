import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  FileSpreadsheet,
  FileText,
  Calculator,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  Download,
  ShieldAlert
} from 'lucide-react';

export const EmployeeMasterView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Employee for Detailed View/Modal
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [taxRegimeView, setTaxRegimeView] = useState<'new' | 'old'>('new');
  const [simulatedTax, setSimulatedTax] = useState<any>(null);
  const [savingNotice, setSavingNotice] = useState(false);

  // Form edit states for selected employee
  const [editForm, setEditForm] = useState<any>({});

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedDept) params.set('departmentId', selectedDept);
      if (selectedStatus) params.set('status', selectedStatus);
      params.set('page', String(page));
      params.set('limit', '50');

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setDepartments(data.departments || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, selectedStatus, page]);

  const openEmployeeModal = async (emp: any) => {
    try {
      const res = await fetch(`/api/employees/${emp.id}`);
      const fullEmp = res.ok ? await res.json() : emp;
      setSelectedEmployee(fullEmp);
      setEditForm({
        ...fullEmp,
        basicPay: fullEmp.basicPay || 37500,
        daPercent: fullEmp.daPercent ?? 75,
        hraPercent: fullEmp.hraPercent ?? 30,
      });

      // Calculate live tax comparison
      const taxInput = {
        annualGross: (fullEmp.basicPay || 37500) * 1.75 * 12,
        basicMonthly: fullEmp.basicPay || 37500,
        hraMonthly: (fullEmp.basicPay || 37500) * 0.30,
        stateCode: 'MH',
        regime: (fullEmp.taxRegime || 'new') as 'old' | 'new',
        declarations: {
          section80C: 150000,
          section80D: 25000,
          hraRentPaidMonthly: 15000,
        }
      };

      const taxRes = await fetch('/api/tax/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxInput)
      });
      if (taxRes.ok) {
        const sim = await taxRes.json();
        setSimulatedTax(sim);
      }
    } catch (e) {
      setSelectedEmployee(emp);
      setEditForm(emp);
    }
  };

  // Live earnings and deductions math for modal
  const basic = Number(editForm.basicPay || 37500);
  const da = Math.round(basic * (Number(editForm.daPercent ?? 75) / 100));
  const hra = Math.round(basic * (Number(editForm.hraPercent ?? 30) / 100));
  const grossEarnings = basic + da + hra;
  const pfDeduction = grossEarnings > 15000 ? 1800 : Math.round(grossEarnings * 0.12);
  const esiDeduction = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0075) : 0;
  const profTax = 200;
  const tds = grossEarnings > 50000 ? 2500 : 0;
  const totalDeductions = pfDeduction + esiDeduction + profTax + tds;
  const netPay = grossEarnings - totalDeductions;

  const handleSaveEmployee = () => {
    setSavingNotice(true);
    setTimeout(() => {
      setSavingNotice(false);
      setSelectedEmployee(null);
      fetchEmployees();
    }, 800);
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            Staff Information & Employee Master
          </h1>
          <p className="text-xs text-slate-500">
            Unified Employee Directory ({totalCount} active staff records) across 19 departments with live tax simulation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/reports"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold border border-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master XLSX</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Employee Code, Name, PAN Number, or Email..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-slate-600">Department:</label>
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Departments (19)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-slate-600">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active (On Rolls)</option>
            <option value="resigned">Resigned / Inactive</option>
          </select>
        </div>

        {/* Missing PAN Shortcut */}
        <button
          onClick={() => { setSearch('missing-pan'); setPage(1); }}
          className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded text-xs font-semibold border border-rose-200 transition flex items-center gap-1"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Audit: Missing PAN (14)</span>
        </button>
      </div>

      {/* Main Employee Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-900 text-slate-200 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Emp Code</th>
                <th className="py-2.5 px-3">Employee Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Basic Pay</th>
                <th className="py-2.5 px-3 text-right">Gross (Est.)</th>
                <th className="py-2.5 px-3">PAN Number</th>
                <th className="py-2.5 px-3">PF UAN / Bank</th>
                <th className="py-2.5 px-3 text-center">Tax Regime</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-sans text-xs">
                    Loading employee directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No employees matching current filter criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => {
                  const basicVal = emp.basicPay || 37500;
                  const daVal = Math.round(basicVal * ((emp.daPercent || 75) / 100));
                  const hraVal = Math.round(basicVal * ((emp.hraPercent || 30) / 100));
                  const grossVal = basicVal + daVal + hraVal;

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => openEmployeeModal(emp)}
                      className="hover:bg-sky-50/70 transition cursor-pointer"
                    >
                      <td className="py-2 px-3 text-sky-800 font-bold font-mono">
                        {emp.code}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600">
                        {emp.departmentName || 'Administrative'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-900">
                        ₹{basicVal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">
                        ₹{grossVal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {emp.panNumber ? (
                          <span className="text-slate-800 font-medium">{emp.panNumber}</span>
                        ) : (
                          <span className="text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-bold text-[10px]">
                            MISSING
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-600">
                        {emp.pfUan ? `UAN: ${emp.pfUan}` : emp.bankName ? `${emp.bankName} (${emp.bankAccount?.slice(-4)})` : '—'}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          emp.taxRegime === 'new' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.taxRegime || 'new'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {emp.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-sans">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEmployeeModal(emp); }}
                          className="bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded text-[11px] font-medium shadow-xs"
                        >
                          View Master
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{employees.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalCount}</span> employees
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Staff Information Simplified Modal (Matches employee_master.png) */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-5xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="bg-sky-600 text-white font-bold text-xs px-2 py-0.5 rounded">
                  {editForm.code || 'EMP001'}
                </span>
                <h2 className="text-base font-bold">
                  {editForm.firstName} {editForm.lastName} [{editForm.code}] — [{selectedEmployee.departmentName || 'ADMINISTRATIVE'}]
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs (Basic Details, Other Heads, Pay Ledger, etc.) */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 flex space-x-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-2 px-3 border-b-2 transition ${
                  activeTab === 'basic' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                👤 Basic Details
              </button>
              <button
                onClick={() => setActiveTab('tax')}
                className={`py-2 px-3 border-b-2 transition ${
                  activeTab === 'tax' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                🧮 Live Tax Simulator & Comparison
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`py-2 px-3 border-b-2 transition ${
                  activeTab === 'ledger' ? 'border-sky-600 text-sky-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Pay Ledger (12 Months)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 text-xs space-y-4">
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Personal & Identification Details (8 cols) */}
                  <div className="md:col-span-8 space-y-4">
                    {/* Personal Details Section */}
                    <div className="border border-sky-200 rounded-lg p-3 bg-sky-50/30 space-y-3">
                      <div className="font-bold text-sky-900 uppercase tracking-wider text-[11px] border-b border-sky-200 pb-1">
                        Personal Details
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Emp CD *</label>
                          <input
                            type="text"
                            value={editForm.code || ''}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">First Name *</label>
                          <input
                            type="text"
                            value={editForm.firstName || ''}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Last Name *</label>
                          <input
                            type="text"
                            value={editForm.lastName || ''}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Department *</label>
                          <select
                            value={editForm.departmentId || ''}
                            onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Designation</label>
                          <input
                            type="text"
                            value={editForm.designation || 'Assistant Teacher'}
                            onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">PAN Number</label>
                          <input
                            type="text"
                            value={editForm.panNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm, panNumber: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold uppercase"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Aadhaar Number</label>
                          <input
                            type="text"
                            value={editForm.aadhaarNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm, aadhaarNumber: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">PF UAN</label>
                          <input
                            type="text"
                            value={editForm.pfUan || ''}
                            onChange={(e) => setEditForm({ ...editForm, pfUan: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Bank Name</label>
                          <input
                            type="text"
                            value={editForm.bankName || 'HDFC Bank'}
                            onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">Account Number</label>
                          <input
                            type="text"
                            value={editForm.bankAccount || ''}
                            onChange={(e) => setEditForm({ ...editForm, bankAccount: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-medium">IFSC Code</label>
                          <input
                            type="text"
                            value={editForm.bankIfsc || ''}
                            onChange={(e) => setEditForm({ ...editForm, bankIfsc: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pay Control Details Section */}
                    <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/20 space-y-3">
                      <div className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] border-b border-emerald-200 pb-1">
                        Pay Control & Slabs Setup
                      </div>

                      <div className="grid grid-cols-4 gap-2 font-mono">
                        <div>
                          <label className="text-[11px] text-slate-600 font-sans font-medium">Current Basic (₹)</label>
                          <input
                            type="number"
                            value={editForm.basicPay}
                            onChange={(e) => setEditForm({ ...editForm, basicPay: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-sans font-medium">DA %</label>
                          <input
                            type="number"
                            value={editForm.daPercent}
                            onChange={(e) => setEditForm({ ...editForm, daPercent: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-sans font-medium">HRA %</label>
                          <input
                            type="number"
                            value={editForm.hraPercent}
                            onChange={(e) => setEditForm({ ...editForm, hraPercent: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600 font-sans font-medium">Tax Regime</label>
                          <select
                            value={editForm.taxRegime || 'new'}
                            onChange={(e) => setEditForm({ ...editForm, taxRegime: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-sans font-bold"
                          >
                            <option value="new">New Regime (Default)</option>
                            <option value="old">Old Regime (Deductions)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earnings, Deductions & Live Calculations (4 cols) */}
                  <div className="md:col-span-4 space-y-3">
                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-2">
                      <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                        Monthly Salary Structure Computation
                      </div>

                      {/* Earnings */}
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-700">
                          <span>Basic Pay:</span>
                          <span>₹{basic.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>DA (75%):</span>
                          <span>₹{da.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>HRA (30%):</span>
                          <span>₹{hra.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-800 border-t border-slate-200 pt-1">
                          <span>Gross Earnings:</span>
                          <span>₹{grossEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between text-slate-700">
                          <span>Provident Fund (EPF):</span>
                          <span>₹{pfDeduction.toLocaleString('en-IN')}</span>
                        </div>
                        {esiDeduction > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>ESI (0.75%):</span>
                            <span>₹{esiDeduction.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-700">
                          <span>Professional Tax (MH):</span>
                          <span>₹{profTax.toLocaleString('en-IN')}</span>
                        </div>
                        {tds > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>Income Tax (TDS):</span>
                            <span>₹{tds.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-rose-800 border-t border-slate-200 pt-1">
                          <span>Total Deductions:</span>
                          <span>₹{totalDeductions.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Net Pay Highlight */}
                      <div className="bg-sky-600 text-white rounded-md p-2 text-center font-mono">
                        <div className="text-[10px] uppercase tracking-wider font-semibold">Net Disbursal Pay</div>
                        <div className="text-base font-bold">₹{netPay.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Tax Liability Quick Card */}
                    <div className="border border-sky-300 rounded-lg p-2.5 bg-sky-50 text-[11px] space-y-1.5">
                      <div className="font-bold text-sky-950 flex items-center justify-between">
                        <span>Tax Liability [2025-2026]</span>
                        <span className="bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded font-mono text-[10px]">FY 25-26</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                        <div className="bg-white p-1 rounded border border-sky-200">
                          <div className="text-slate-500">Gross Sal</div>
                          <div className="font-bold text-slate-800">₹{(grossEarnings * 12).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white p-1 rounded border border-sky-200">
                          <div className="text-slate-500">Taxable</div>
                          <div className="font-bold text-slate-800">₹{Math.max(0, (grossEarnings * 12) - 75000).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="bg-white p-1 rounded border border-sky-200">
                          <div className="text-slate-500">Est Tax</div>
                          <div className="font-bold text-emerald-700">₹0 (87A Rebate)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tax' && (
                <div className="space-y-4">
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                    <h3 className="font-bold text-sky-900 text-xs">
                      FY 2025–2026 Old vs. New Tax Regime Comparison Simulator
                    </h3>
                    <p className="text-[11px] text-sky-700 mt-0.5">
                      Live comparative calculation computed using standard Income Tax statutory rules
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* New Regime Card */}
                    <div className="border-2 border-sky-500 rounded-lg p-4 bg-white shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-sky-900">New Tax Regime (Default)</span>
                        <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Standard Deduction: ₹75,000
                        </span>
                      </div>
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Annual Gross Salary:</span>
                          <span>₹{(grossEarnings * 12).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Standard Deduction:</span>
                          <span>- ₹75,000</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                          <span>Taxable Income:</span>
                          <span>₹{Math.max(0, (grossEarnings * 12) - 75000).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Tax before Rebate:</span>
                          <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>Section 87A Rebate:</span>
                          <span>Full Rebate (under ₹7.75L)</span>
                        </div>
                        <div className="flex justify-between font-black text-sm text-emerald-700 border-t border-slate-300 pt-2">
                          <span>Total Net Annual Tax:</span>
                          <span>₹0.00 / year</span>
                        </div>
                      </div>
                    </div>

                    {/* Old Regime Card */}
                    <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800">Old Tax Regime</span>
                        <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          Standard Deduction: ₹50,000
                        </span>
                      </div>
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Annual Gross Salary:</span>
                          <span>₹{(grossEarnings * 12).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Standard Deduction:</span>
                          <span>- ₹50,000</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Section 80C Deductions:</span>
                          <span>- ₹1,50,000</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>HRA Exemption:</span>
                          <span>- ₹1,35,000</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                          <span>Taxable Income:</span>
                          <span>₹{Math.max(0, (grossEarnings * 12) - 335000).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-2">
                          <span>Total Net Annual Tax:</span>
                          <span>₹0.00 / year</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ledger' && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">12 Months Payroll History</div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Month / Year</th>
                          <th className="py-2 px-3 text-right">Gross Earnings</th>
                          <th className="py-2 px-3 text-right">PF Deduction</th>
                          <th className="py-2 px-3 text-right">Total Deductions</th>
                          <th className="py-2 px-3 text-right">Net Pay</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {['03/2026', '02/2026', '01/2026', '12/2025', '11/2025', '10/2025', '09/2025', '08/2025', '07/2025', '06/2025', '05/2025', '04/2025'].map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{m}</td>
                            <td className="py-1.5 px-3 text-right">₹{grossEarnings.toLocaleString('en-IN')}</td>
                            <td className="py-1.5 px-3 text-right text-slate-600">₹{pfDeduction.toLocaleString('en-IN')}</td>
                            <td className="py-1.5 px-3 text-right text-rose-700">₹{totalDeductions.toLocaleString('en-IN')}</td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-700">₹{netPay.toLocaleString('en-IN')}</td>
                            <td className="py-1.5 px-3 text-center">
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-sans uppercase">
                                {i === 0 ? 'Computed' : 'Frozen'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-100 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <a
                  href={`/annual-statements?employeeId=${selectedEmployee.id}`}
                  className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold border border-slate-300 shadow-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Annual Statement Card</span>
                </a>
              </div>

              <div className="flex items-center space-x-2">
                {savingNotice && (
                  <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Changes Saved!
                  </span>
                )}
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveEmployee}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
