import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Calculator,
  FileText,
  Download,
  Play,
  UserCheck,
  LogOut,
  ChevronDown,
  Clock,
  Menu,
  X,
  Shield,
  FileSpreadsheet,
  Sliders
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useOrg } from './hooks/useOrg';

interface HeaderProps {
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPath = '/' }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, role, switchRole, logout } = useAuth();
  const { org } = useOrg();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleDisplayName = (userRole: string) => {
    switch (userRole) {
      case 'super_admin': return 'Super Admin';
      case 'hr_lead': return 'HR Lead';
      case 'payroll_accountant': return 'Accountant';
      case 'employee': return 'Employee';
      default: return 'User';
    }
  };

  // Nav modules for sidebar drawer filtered by role
  const allNavModules = [
    {
      label: 'Executive Overview',
      href: '/',
      icon: Building2,
      desc: 'Overview, verification checklist & monthly runs',
      roles: ['super_admin', 'hr_lead', 'payroll_accountant']
    },
    {
      label: 'Staff Information (Master)',
      href: '/employees',
      icon: Users,
      desc: '385 staff records, salary structures & taxation',
      roles: ['super_admin', 'hr_lead']
    },
    {
      label: 'Salary Statistics',
      href: '/salary-stats',
      icon: Calculator,
      desc: 'Statutory formulas, department snapshots & trends',
      roles: ['super_admin', 'hr_lead', 'payroll_accountant']
    },
    {
      label: 'Annual Statements',
      href: '/annual-statements',
      icon: FileText,
      desc: 'Full 12-month earning cards with statutory heads',
      roles: ['super_admin', 'hr_lead', 'payroll_accountant']
    },
    {
      label: 'Zero-Hassle Reports',
      href: '/reports',
      icon: Download,
      desc: 'Bank Advice, EPF ECR, ESI Returns, Form 16',
      roles: ['super_admin', 'hr_lead', 'payroll_accountant']
    },
    {
      label: 'Payroll Console',
      href: '/payroll',
      icon: Play,
      desc: 'Execute monthly calculations & freeze periods',
      roles: ['super_admin', 'hr_lead', 'payroll_accountant']
    },
    {
      label: 'Employee Self-Service (ESS)',
      href: '/ess',
      icon: UserCheck,
      desc: 'Form 12BB declarations, leave & tax simulator',
      roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee']
    },
    {
      label: 'Tax Regime Simulator',
      href: '/ess?tab=simulator',
      icon: Sliders,
      desc: 'Compare Old vs New Tax Regimes',
      roles: ['employee']
    }
  ];

  const visibleNavModules = allNavModules.filter(m => m.roles.includes(role));

  // Filtered dropdown menu items
  const masterItems = [
    { label: 'Staff Information (Master)', href: '/employees', roles: ['super_admin', 'hr_lead'] },
    { label: 'Department Master', href: '/employees?view=departments', roles: ['super_admin', 'hr_lead'] },
    { label: 'Salary Heads & Slabs', href: '/salary-stats', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: 'Tax Declaration Master', href: '/ess', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
  ].filter(item => item.roles.includes(role));

  const transactionItems = [
    { label: '▶ Run Monthly Payroll', href: '/payroll', roles: ['super_admin', 'hr_lead', 'payroll_accountant'], className: 'font-semibold text-sky-400' },
    { label: '🔒 Freeze Payroll Month', href: '/payroll', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: '📋 Leave Application & Approval', href: '/ess', roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee'] },
    { label: '📑 Form 12BB Review', href: '/ess', roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee'] },
  ].filter(item => item.roles.includes(role));

  const reportItems = [
    { label: '📄 Bank Payment Advice (XLSX)', href: '/reports', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: '🏛️ EPFO Electronic Challan (ECR)', href: '/reports', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: '🏥 ESI Monthly Return', href: '/reports', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: '📑 Employee Pay Slip', href: role === 'employee' ? '/ess' : '/reports', roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee'] },
    { label: '⚖️ Form 16 Part B Certificate', href: role === 'employee' ? '/ess' : '/reports', roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee'] },
    { label: '📜 Annual Earning Statement', href: '/annual-statements', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
  ].filter(item => item.roles.includes(role));

  const utilityItems = [
    { label: '🔍 Live Compliance Audit', href: '/?view=audit', roles: ['super_admin', 'hr_lead'] },
    { label: '🧮 Tax Regime Simulator', href: '/ess?tab=simulator', roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee'] },
  ].filter(item => item.roles.includes(role));

  // Sidebar drawer statutory shortcuts
  const statutoryShortcuts = [
    { label: 'Bank Advice', href: '/reports', icon: Download, color: 'text-sky-400', hoverColor: 'hover:text-sky-300', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: 'PF ECR Challan', href: '/reports', icon: Shield, color: 'text-emerald-400', hoverColor: 'hover:text-emerald-300', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: 'ESI Return', href: '/reports', icon: FileSpreadsheet, color: 'text-indigo-400', hoverColor: 'hover:text-indigo-300', roles: ['super_admin', 'hr_lead', 'payroll_accountant'] },
    { label: 'Form 16 Part B', href: role === 'employee' ? '/ess' : '/annual-statements', icon: FileText, color: 'text-amber-400', hoverColor: 'hover:text-amber-300', roles: ['super_admin', 'hr_lead', 'payroll_accountant', 'employee'] },
  ].filter(item => item.roles.includes(role));

  const currentUser = user || {
    name: 'PSR Computers',
    code: 'PSR',
    role: 'super_admin',
    email: 'admin@demo.paysoft',
  };

  return (
    <>
      <header className="bg-slate-900 text-white shadow-md select-none sticky top-0 z-40">
        {/* Top Application Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Navigation Menu"
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              <Menu className="w-5 h-5 text-sky-400" />
              <span className="font-semibold text-xs tracking-wide hidden sm:inline">Menu</span>
            </button>

            <span className="text-slate-700">|</span>

            {/* Brand Logo & Dynamic Organization Identity */}
            <div className="flex items-center space-x-2 font-bold text-sky-400 text-sm tracking-wide">
              <span className="bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded font-black text-xs">PS3</span>
              <span>PaySoft</span>
            </div>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-200 font-semibold hidden md:inline">{org.name}</span>
            <span className="text-slate-600 hidden lg:inline">•</span>
            <span className="text-emerald-400 font-mono text-[11px] hidden lg:inline">
              FY {org.financialYear} (AY {org.assessmentYear})
            </span>
          </div>

          {/* Center / Right ERP Dropdown Menus for Fast Desktop Access */}
          <div className="hidden xl:flex items-center space-x-1">
            {/* Master Dropdown (hidden if no visible master items for employee) */}
            {masterItems.length > 0 && (
              <div className="relative group">
                <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                  <span>Master</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <div className="absolute left-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                  {masterItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Dropdown */}
            {transactionItems.length > 0 && (
              <div className="relative group">
                <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                  <span>Transactions</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <div className="absolute left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                  {transactionItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      className={`block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300 ${item.className || ''}`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Dropdown */}
            {reportItems.length > 0 && (
              <div className="relative group">
                <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                  <span>Report(s)</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <div className="absolute left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                  {reportItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Utilities Dropdown */}
            {utilityItems.length > 0 && (
              <div className="relative group">
                <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                  <span>Utilities</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <div className="absolute left-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                  {utilityItems.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.href}
                      className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Session, Role Switcher & Clock */}
          <div className="flex items-center space-x-3">
            {/* Real-time Clock */}
            <div className="hidden sm:flex items-center space-x-1.5 text-slate-400 font-mono text-[11px] bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentTime || 'Loading...'}</span>
            </div>

            {/* Role Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1 rounded-md border border-slate-700 transition">
                <span className="text-slate-300 font-medium text-xs max-w-[120px] truncate">
                  {currentUser.name || 'User'}
                </span>
                <span className="bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border border-sky-800">
                  {getRoleDisplayName(currentUser.role)}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <div className="absolute right-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-2 z-50 hidden group-hover:block">
                <div className="px-3 pb-2 mb-1 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700 font-bold">
                  Switch Active Persona
                </div>

                <button
                  onClick={() => switchRole('admin@demo.paysoft', 'super_admin', 'PSR Computers')}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${
                    currentUser.role === 'super_admin' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <div>
                      <div className="text-xs">Super Admin</div>
                      <div className="text-[10px] text-slate-400">Full Enterprise Access</div>
                    </div>
                  </div>
                  {currentUser.role === 'super_admin' && <span className="text-sky-400 text-xs">✓</span>}
                </button>

                <button
                  onClick={() => switchRole('hr@demo.paysoft', 'hr_lead', 'Priya Sharma (HR Lead)')}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${
                    currentUser.role === 'hr_lead' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <div>
                      <div className="text-xs">HR Lead</div>
                      <div className="text-[10px] text-slate-400">Staff Master & Leave Review</div>
                    </div>
                  </div>
                  {currentUser.role === 'hr_lead' && <span className="text-sky-400 text-xs">✓</span>}
                </button>

                <button
                  onClick={() => switchRole('accountant@demo.paysoft', 'payroll_accountant', 'Ramesh Verma (Accountant)')}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${
                    currentUser.role === 'payroll_accountant' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">💳</span>
                    <div>
                      <div className="text-xs">Payroll Accountant</div>
                      <div className="text-[10px] text-slate-400">Payroll Runs & Statutory Reports</div>
                    </div>
                  </div>
                  {currentUser.role === 'payroll_accountant' && <span className="text-sky-400 text-xs">✓</span>}
                </button>

                <button
                  onClick={() => switchRole('sakshi.nair@example.com', 'employee', 'Sakshi Nair (Employee)')}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${
                    currentUser.role === 'employee' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">👤</span>
                    <div>
                      <div className="text-xs">Employee Persona</div>
                      <div className="text-[10px] text-slate-400">Self Service, Tax & Payslip</div>
                    </div>
                  </div>
                  {currentUser.role === 'employee' && <span className="text-sky-400 text-xs">✓</span>}
                </button>

                <div className="border-t border-slate-700 mt-1 pt-1 px-3">
                  <button
                    onClick={logout}
                    className="w-full text-left py-1 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 transition p-1 rounded hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Hamburger Navigation Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] bg-slate-900 text-white shadow-2xl flex flex-col justify-between border-r border-slate-800 z-10 overflow-y-auto">
            <div>
              {/* Drawer Top Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                    PS
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">PaySoft Enterprise</div>
                    <div className="text-[11px] text-slate-400">
                      {org.name} • FY {org.financialYear}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modules List */}
              <div className="p-3 space-y-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Core Modules
                </div>

                {visibleNavModules.map((item) => {
                  const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition ${
                        isActive
                          ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.desc}</div>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Quick Statutory Shortcuts (Role Filtered) */}
              {statutoryShortcuts.length > 0 && (
                <div className="p-3 border-t border-slate-800 space-y-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Statutory Downloads & Utilities
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 px-2">
                    {statutoryShortcuts.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <a
                          key={idx}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`p-2 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 text-[11px] text-slate-300 ${item.hoverColor} flex items-center gap-1.5`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Profile & Role Bar in Drawer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{currentUser.name || 'PSR Computers'}</div>
                  <div className="text-[11px] text-sky-400">{getRoleDisplayName(currentUser.role)}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
