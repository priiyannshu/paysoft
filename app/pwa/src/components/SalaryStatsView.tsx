import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calculator,
  Calendar,
  Building2,
  CreditCard,
  Layers,
  ArrowRight,
  Download,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { AccessDenied } from './ui/AccessDenied';

export const SalaryStatsView: React.FC = () => {
  const { isEmployee, canAccess } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState('3');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  // Guard: Employees cannot access institutional salary stats
  if (isEmployee || !canAccess(['super_admin', 'hr_lead', 'payroll_accountant'])) {
    return (
      <AccessDenied
        title="Institutional Access Restricted"
        message="Salary statistics, financial breakdowns, and institutional cost trends are restricted to HR Leads, Payroll Accountants, and Super Admins."
      />
    );
  }

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary-stats?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const json = await res.json();
        setStatsData(json);
      }
    } catch (e) {
      console.error('Error fetching salary stats:', e);
    } fontinally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const yearly = statsData?.yearlySnapshot || [];
  const departmentsList = statsData?.departmentSnapshot || [];
  const paymentTypeStats = statsData?.paymentTypeStats || [];

  const grossTotal = statsData?.financials?.totalGross || 0;
  const netTotal = statsData?.financials?.netPay || 0;
  const deductTotal = statsData?.financials?.totalDeductions || 0;
  const tdsTotal = statsData?.financials?.totalTds || 0;
  const pfEsiTotal = statsData?.financials?.totalPfEsiPtax || 0;
  const otherTotal = statsData?.financials?.totalOther || 0;

  const selectedMonthNum = parseInt(selectedMonth, 10);
  const selectedYearNum = parseInt(selectedYear, 10);

  // Maximum gross for chart bar scaling
  const maxGross = yearly.length > 0 ? Math.max(...yearly.map((y: any) => y.gross || 0), 100000) : 7000000;

  const getMonthName = (m: string) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(m, 10) - 1] || m;
  };

  return (
    <div className="p-4 space-y-4 max-w-[1600px] mx-auto">
      {/* Top Bar with Month Picker */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Salary Statistics & Financials Breakdown</h1>
            <p className="text-xs text-slate-500">
              Complete statutory formula breakups, payment mode splits, department summaries, and FY 2025–26 trend analysis
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-lg p-1.5">
          <Calendar className="w-4 h-4 text-slate-500 ml-1" />
          <label className="text-xs font-semibold text-slate-700">Salary Month:</label>
          <select
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-');
              setSelectedYear(y);
              setSelectedMonth(m);
            }}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="2026-3">31-03-2026 (March 2026)</option>
            <option value="2026-2">28-02-2026 (February 2026)</option>
            <option value="2026-1">31-01-2026 (January 2026)</option>
            <option value="2025-12">31-12-2025 (December 2025)</option>
            <option value="2025-11">30-11-2025 (November 2025)</option>
            <option value="2025-10">31-10-2025 (October 2025)</option>
            <option value="2025-9">30-09-2025 (September 2025)</option>
            <option value="2025-8">31-08-2025 (August 2025)</option>
            <option value="2025-7">31-07-2025 (July 2025)</option>
            <option value="2025-6">30-06-2025 (June 2025)</option>
            <option value="2025-5">31-05-2025 (May 2025)</option>
            <option value="2025-4">30-04-2025 (April 2025)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs font-mono text-slate-500">
          Loading salary statistics and statutory breakdowns...
        </div>
      ) : (
        <>
          {/* Header Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500">Selected Payroll Period</div>
                <div className="text-base font-bold text-sky-900 mt-0.5">
                  {getMonthName(selectedMonth)} – {selectedYear} Payroll
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {statsData?.selectedPeriod?.workingDays || 31} CALENDAR DAYS
                </div>
              </div>
              <span className="bg-sky-100 text-sky-800 px-2.5 py-1 rounded font-mono font-bold text-xs">
                FY 2025-26
              </span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500">Working Days</div>
                <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                  {(statsData?.selectedPeriod?.workingDays || 31).toFixed(2)}
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-slate-500">Payroll Processed Records</div>
                <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                  {statsData?.selectedPeriod?.payrollProcessedCount || 0} Staff
                </div>
              </div>
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
          </div>

          {/* Financials Statutory Formula Banner */}
          <div className="bg-white rounded-lg border-2 border-sky-600 p-4 shadow-sm space-y-2">
            <div className="text-xs font-black text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span>Financials (Statutory Formula Breakdown)</span>
            </div>

            <div className="bg-sky-50/60 rounded-md p-3 font-mono text-xs text-slate-800 space-y-1.5 overflow-x-auto">
              <div className="flex items-center space-x-2 text-slate-600 whitespace-nowrap">
                <span className="font-semibold text-slate-900">Total Payroll Cost =</span>
                <span>Employees Deposit + TDS Payment + PF+ ESI + Prof Tax + Other Deductions</span>
              </div>

              <div className="flex items-center space-x-2 font-bold text-xs whitespace-nowrap">
                <span className="text-slate-900">Total Payroll Cost =</span>
                <span className="text-emerald-700">₹{netTotal.toLocaleString('en-IN')}.00</span>
                <span className="text-slate-400">+</span>
                <span className="text-rose-700">₹{tdsTotal.toLocaleString('en-IN')}.00</span>
                <span className="text-slate-400">+</span>
                <span className="text-indigo-700">₹{pfEsiTotal.toLocaleString('en-IN')}.00</span>
                <span className="text-slate-400">+</span>
                <span className="text-slate-500">0.00</span>
                <span className="text-slate-400">+</span>
                <span className="text-slate-500">0.00</span>
                <span className="text-slate-400">+</span>
                <span className="text-amber-700">₹{otherTotal.toLocaleString('en-IN')}.00</span>
                <span className="text-slate-400">=</span>
                <span className="text-sky-900 text-sm font-black underline decoration-sky-500">
                  ₹{grossTotal.toLocaleString('en-IN')}.00
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Employee Total Statistics + Payment Type Stats + Pay Type Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Employee Total Statistics (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="text-xs font-bold text-rose-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                EMPLOYEE TOTAL STATISTICS
              </div>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">GROSS PAY:</span>
                  <span className="text-sm font-black text-emerald-700">₹{grossTotal.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">GR DEDUCTION:</span>
                  <span className="text-sm font-black text-rose-700">₹{deductTotal.toLocaleString('en-IN')}.00</span>
                </div>

                <div className="flex justify-between items-center bg-sky-50 p-2.5 rounded border border-sky-200">
                  <span className="text-xs font-bold text-sky-900">NET PAY:</span>
                  <span className="text-base font-black text-sky-900">₹{netTotal.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
            </div>

            {/* Payment Type Stats (4 cols) - Dynamic from API */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                Payment Type Stats
              </div>
              <div className="p-2 flex-1 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2">Payment Type</th>
                      <th className="py-1.5 px-2 text-right">TOTAL GROSS</th>
                      <th className="py-1.5 px-2 text-right">TOTAL DEDUCT</th>
                      <th className="py-1.5 px-2 text-right">NET PAY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {paymentTypeStats.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 font-sans font-medium text-slate-800">{item.paymentType}</td>
                        <td className="py-1.5 px-2 text-right">{item.gross?.toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-2 text-right text-rose-600">{item.deductions?.toLocaleString('en-IN')}</td>
                        <td className="py-1.5 px-2 text-right font-semibold text-emerald-700">{item.netPay?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pay Type Stats (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                Pay Type Stats
              </div>
              <div className="p-2 flex-1 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-1.5 px-2">Pay Type</th>
                      <th className="py-1.5 px-2 text-right">TOTAL GROSS</th>
                      <th className="py-1.5 px-2 text-right">TOTAL DEDUCT</th>
                      <th className="py-1.5 px-2 text-right">NET PAY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 font-sans font-medium text-slate-800">SALARY</td>
                      <td className="py-1.5 px-2 text-right">{grossTotal.toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 text-right text-rose-600">{deductTotal.toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 text-right font-semibold text-emerald-700">{netTotal.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="py-1.5 px-2 font-sans text-slate-900">Total :</td>
                      <td className="py-1.5 px-2 text-right">{grossTotal.toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 text-right text-rose-600">{deductTotal.toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-2 text-right text-emerald-800">{netTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Row: Payroll Cost Summary Visual Trend + Department & Yearly Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Interactive Bar Chart (6 cols) */}
            <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Payroll Cost Summary (12-Month Trend)</span>
                <span className="text-[10px] text-slate-500 font-normal">01-04-2025 To 31-03-2026</span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-end space-y-3">
                {/* Bars container */}
                <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-300">
                  {yearly.map((item: any, idx: number) => {
                    const heightPercent = Math.max(10, Math.round(((item.gross || 0) / maxGross) * 100));
                    // Exact month matching bug fix
                    const isSelected = item.month === selectedMonthNum && item.year === selectedYearNum;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap font-mono">
                          <div>{item.label}</div>
                          <div>Gross: ₹{item.gross?.toLocaleString('en-IN')}</div>
                          <div>Net: ₹{item.netPay?.toLocaleString('en-IN')}</div>
                        </div>

                        {/* Stacked Visual Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all ${
                            isSelected ? 'bg-sky-600 shadow-md ring-2 ring-sky-400' : 'bg-emerald-600/80 hover:bg-emerald-600'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
                  <span>30-04-2025</span>
                  <span>31-08-2025</span>
                  <span>31-12-2025</span>
                  <span className="font-bold text-sky-700">31-03-2026</span>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-emerald-600 rounded-xs" />
                    <span className="text-slate-600">Monthly Gross Payroll</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-sky-600 rounded-xs" />
                    <span className="text-slate-600">Selected Month ({getMonthName(selectedMonth)} {selectedYear})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Department Level Snapshot & Yearly Snapshot (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Department Level Snapshot */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Department Level Snapshot</span>
                  <span className="text-[10px] text-slate-500 font-normal">{departmentsList.length} Departments</span>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase font-semibold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Department Name</th>
                        <th className="py-1.5 px-3 text-right">TOTAL GROSS</th>
                        <th className="py-1.5 px-3 text-right">TOTAL DEDUCT</th>
                        <th className="py-1.5 px-3 text-right">NET PAY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {departmentsList.map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 px-3 font-sans text-slate-800 font-medium">{d.name}</td>
                          <td className="py-1 px-3 text-right">{d.gross?.toLocaleString('en-IN') || '0'}</td>
                          <td className="py-1 px-3 text-right text-rose-600">{d.deductions?.toLocaleString('en-IN') || '0'}</td>
                          <td className="py-1 px-3 text-right font-semibold text-emerald-700">{d.netPay?.toLocaleString('en-IN') || '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Yearly Snapshot Table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Yearly Snapshot</span>
                  <span className="text-[10px] text-slate-500 font-normal">01-04-2025 To 31-03-2026</span>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase font-semibold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-3">Month - Year</th>
                        <th className="py-1.5 px-3 text-right">Total Gross</th>
                        <th className="py-1.5 px-3 text-right">Total Deduction</th>
                        <th className="py-1.5 px-3 text-right">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {yearly.map((y: any, idx: number) => {
                        const isSelectedRow = y.month === selectedMonthNum && y.year === selectedYearNum;
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 ${isSelectedRow ? 'bg-sky-50 font-bold' : ''}`}>
                            <td className="py-1 px-3 font-sans text-slate-800">{y.label}</td>
                            <td className="py-1 px-3 text-right">{y.gross?.toLocaleString('en-IN')}</td>
                            <td className="py-1 px-3 text-right text-rose-600">{y.deductions?.toLocaleString('en-IN')}</td>
                            <td className="py-1 px-3 text-right font-semibold text-emerald-700">{y.netPay?.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
