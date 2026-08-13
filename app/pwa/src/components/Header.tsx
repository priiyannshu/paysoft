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
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPath = '/' }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({
    name: 'PSR Computers',
    code: 'PSR',
    role: 'super_admin',
    email: 'admin@demo.paysoft'
  });

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

    // Read cached user role immediately for instantaneous client sync
    try {
      const cached = localStorage.getItem('paysoft_user');
      if (cached) {
        setCurrentUser(JSON.parse(cached));
      }
    } catch {}

    // Fetch logged in user from server
    fetch('/auth/me')
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data: any) => {
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('paysoft_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const switchRole = async (email: string, role: string, name: string) => {
    try {
      const userPayload = {
        name,
        code: role === 'super_admin' ? 'PSR' : role === 'hr_lead' ? 'HR' : role === 'payroll_accountant' ? 'ACCT' : 'EMP',
        role,
        email,
        orgId: 'org_demo_001'
      };

      // Set client cache immediately
      localStorage.setItem('paysoft_user', JSON.stringify(userPayload));
      setCurrentUser(userPayload);

      // Attempt server login
      await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': role,
          'X-User-Email': email,
        },
        body: JSON.stringify({
          email,
          password: 'Password123!',
          orgCode: 'DEMO'
        })
      }).catch(() => {});

      // Notify window of role switch
      window.dispatchEvent(new CustomEvent('paysoft_role_changed', { detail: userPayload }));
      
      // Reload page to reflect role changes across all view components
      setTimeout(() => {
        window.location.reload();
      }, 150);
    } catch (e) {
      console.error('Error switching role:', e);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('paysoft_user');
      await fetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      window.location.href = '/login';
    }
  };

  const navModules = [
    { label: 'Executive Overview', href: '/', icon: Building2, desc: 'Overview, verification checklist & monthly runs' },
    { label: 'Staff Information (Master)', href: '/employees', icon: Users, desc: '385 staff records, salary structures & taxation' },
    { label: 'Salary Statistics', href: '/salary-stats', icon: Calculator, desc: 'Statutory formulas, department snapshots & trends' },
    { label: 'Annual Statements', href: '/annual-statements', icon: FileText, desc: 'Full 12-month earning cards with statutory heads' },
    { label: 'Zero-Hassle Reports', href: '/reports', icon: Download, desc: 'Bank Advice, EPF ECR, ESI Returns, Form 16' },
    { label: 'Payroll Console', href: '/payroll', icon: Play, desc: 'Execute monthly calculations & freeze periods' },
    { label: 'Employee Self-Service (ESS)', href: '/ess', icon: UserCheck, desc: 'Form 12BB declarations, leave & tax simulator' },
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'hr_lead': return 'HR Lead';
      case 'payroll_accountant': return 'Accountant';
      case 'employee': return 'Employee';
      default: return 'User';
    }
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

            {/* Brand Logo & Organization */}
            <div className="flex items-center space-x-2 font-bold text-sky-400 text-sm tracking-wide">
              <span className="bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded font-black text-xs">PS2</span>
              <span>PaySoft</span>
            </div>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-200 font-semibold hidden md:inline">ABCD SCHOOL</span>
            <span className="text-slate-600 hidden lg:inline">•</span>
            <span className="text-emerald-400 font-mono text-[11px] hidden lg:inline">FY 2025–26 (AY 2026–27)</span>
          </div>

          {/* Center / Right ERP Dropdown Menus for Fast Desktop Access */}
          <div className="hidden xl:flex items-center space-x-1">
            {/* Master Dropdown */}
            <div className="relative group">
              <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                <span>Master</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                <a href="/employees" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">Staff Information (Master)</a>
                <a href="/employees?view=departments" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">Department Master (19)</a>
                <a href="/salary-stats" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">Salary Heads & Slabs</a>
                <a href="/ess" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">Tax Declaration Master</a>
              </div>
            </div>

            {/* Transactions Dropdown */}
            <div className="relative group">
              <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                <span>Transactions</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                <a href="/payroll" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300 font-semibold text-sky-400">▶ Run Monthly Payroll</a>
                <a href="/payroll" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🔒 Freeze Payroll Month</a>
                <a href="/ess" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📋 Leave Application & Approval</a>
                <a href="/ess" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📑 Form 12BB Review</a>
              </div>
            </div>

            {/* Reports Dropdown */}
            <div className="relative group">
              <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                <span>Report(s)</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📄 Bank Payment Advice (XLSX)</a>
                <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🏛️ EPFO Electronic Challan (ECR)</a>
                <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🏥 ESI Monthly Return</a>
                <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📑 Employee Pay Slip</a>
                <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">⚖️ Form 16 Part B Certificate</a>
                <a href="/annual-statements" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📜 Annual Earning Statement</a>
              </div>
            </div>

            {/* Utilities Dropdown */}
            <div className="relative group">
              <button className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
                <span>Utilities</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute left-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
                <a href="/?view=audit" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🔍 Live Compliance Audit</a>
                <a href="/ess?tab=simulator" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🧮 Tax Regime Simulator</a>
              </div>
            </div>
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
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${currentUser.role === 'super_admin' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'}`}
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
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${currentUser.role === 'hr_lead' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'}`}
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
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${currentUser.role === 'payroll_accountant' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'}`}
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
                  className={`w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center justify-between transition ${currentUser.role === 'employee' ? 'bg-sky-900/40 text-sky-300 font-semibold' : 'text-slate-200'}`}
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
                    onClick={handleLogout}
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
              onClick={handleLogout}
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
                    <div className="text-[11px] text-slate-400">ABCD SCHOOL • FY 2025–26</div>
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

                {navModules.map((item) => {
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

              {/* Quick Statutory Shortcuts */}
              <div className="p-3 border-t border-slate-800 space-y-1">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Statutory Downloads & Utilities
                </div>
                <div className="grid grid-cols-2 gap-1.5 px-2">
                  <a
                    href="/reports"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 text-[11px] text-slate-300 hover:text-sky-300 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Bank Advice</span>
                  </a>
                  <a
                    href="/reports"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 text-[11px] text-slate-300 hover:text-emerald-300 flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>PF ECR Challan</span>
                  </a>
                  <a
                    href="/reports"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 text-[11px] text-slate-300 hover:text-indigo-300 flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>ESI Return</span>
                  </a>
                  <a
                    href="/annual-statements"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 text-[11px] text-slate-300 hover:text-amber-300 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Form 16 Part B</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Profile & Role Bar in Drawer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{currentUser.name || 'PSR Computers'}</div>
                  <div className="text-[11px] text-sky-400">{getRoleDisplayName(currentUser.role)}</div>
                </div>
                <button
                  onClick={handleLogout}
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
