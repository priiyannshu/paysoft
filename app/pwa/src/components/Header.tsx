import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Calculator,
  FileText,
  Download,
  Play,
  ShieldCheck,
  UserCheck,
  Bot,
  LogOut,
  ChevronDown,
  Clock,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentPath?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentPath = '/' }) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentUser, setCurrentUser] = useState<any>({
    name: 'PSR Computers',
    code: 'PSR',
    role: 'super_admin',
    email: 'admin@demo.paysoft'
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch logged in user
    fetch('/auth/me')
      .then(res => res.json())
      .then((data: any) => {
        if (data && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const switchRole = async (email: string, role: string, name: string) => {
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Password123!',
          orgCode: 'DEMO'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const navTabs = [
    { label: 'General Information', href: '/', icon: Building2 },
    { label: 'Employee Master', href: '/employees', icon: Users },
    { label: 'Salary Statistics', href: '/salary-stats', icon: Calculator },
    { label: 'Annual Statements', href: '/annual-statements', icon: FileText },
    { label: 'Zero-Hassle Reports', href: '/reports', icon: Download },
    { label: 'Payroll Console', href: '/payroll', icon: Play },
    { label: 'ESS & Tax Simulator', href: '/ess', icon: UserCheck },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md select-none">
      {/* Top Application Title Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-semibold text-sky-400 text-sm tracking-wide">
            <span className="bg-sky-500 text-slate-950 px-1.5 py-0.5 rounded font-black text-xs">PS2</span>
            <span>PaySoft v2</span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium">ABCD SCHOOL</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-mono">FY 2025–2026 (AY 2026–2027)</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Online Edge Engine</span>
        </div>

        {/* User Session & Role Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <span className="text-slate-400">User:</span>
            <span className="text-sky-300 font-semibold">{currentUser.name || 'PSR Computers'}</span>
            <span className="bg-sky-950 text-sky-300 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border border-sky-800">
              {currentUser.role || 'Super Admin'}
            </span>
          </div>

          {/* Quick Demo Switcher Dropdown */}
          <div className="relative group">
            <button className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition">
              <span className="text-[11px]">Role Switcher</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-50 hidden group-hover:block">
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
                Switch Demo Persona
              </div>
              <button
                onClick={() => switchRole('admin@demo.paysoft', 'super_admin', 'Admin')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center justify-between text-xs"
              >
                <span>👑 Super Admin</span>
                <span className="text-[10px] text-slate-400">Full Access</span>
              </button>
              <button
                onClick={() => switchRole('hr@demo.paysoft', 'hr_lead', 'HR Lead')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center justify-between text-xs"
              >
                <span>👥 HR Lead</span>
                <span className="text-[10px] text-slate-400">Employees & Leave</span>
              </button>
              <button
                onClick={() => switchRole('accountant@demo.paysoft', 'payroll_accountant', 'Accountant')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center justify-between text-xs"
              >
                <span>💳 Accountant</span>
                <span className="text-[10px] text-slate-400">Payroll & Tax</span>
              </button>
              <button
                onClick={() => switchRole('sakshi.nair@example.com', 'employee', 'Sakshi Nair')}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center justify-between text-xs"
              >
                <span>👤 Employee</span>
                <span className="text-[10px] text-slate-400">ESS Portal</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="text-slate-400 hover:text-rose-400 transition p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Classic ERP Menu Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          {/* Master Dropdown */}
          <div className="relative group">
            <button className="px-2.5 py-1 text-slate-200 hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
              <span>💼 Master</span>
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
            <button className="px-2.5 py-1 text-slate-200 hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
              <span>⚡ Transactions</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute left-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
              <a href="/payroll" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300 font-semibold text-sky-400">▶ Run Monthly Payroll</a>
              <a href="/payroll" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🔒 Freeze Payroll Month</a>
              <a href="/ess" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📋 Leave Application & Approval</a>
              <a href="/ess" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📑 Form 12BB Declaration Review</a>
            </div>
          </div>

          {/* Reports Dropdown */}
          <div className="relative group">
            <button className="px-2.5 py-1 text-slate-200 hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
              <span>📊 Report(s)</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute left-0 mt-1 w-60 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
              <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📄 Register Monthly (Excel)</a>
              <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📑 Employee Pay Slip (PDF)</a>
              <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🏦 Bank Payment Advice (XLSX)</a>
              <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🏛️ PF Electronic Challan (ECR)</a>
              <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🏥 ESI Monthly Return</a>
              <a href="/annual-statements" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">📜 Annual Earning Statement</a>
              <a href="/reports" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">⚖️ Form 16 Part B Certificate</a>
            </div>
          </div>

          {/* Utilities Dropdown */}
          <div className="relative group">
            <button className="px-2.5 py-1 text-slate-200 hover:bg-slate-800 rounded font-medium flex items-center space-x-1">
              <span>🛠️ Utilities</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <div className="absolute left-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 hidden group-hover:block">
              <a href="/?view=audit" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🔍 Live Audit Checklist</a>
              <a href="/ess?tab=simulator" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🧮 Tax Regime Simulator</a>
              <a href="/api/health" target="_blank" className="block px-3 py-1.5 hover:bg-sky-900/50 hover:text-sky-300">🩺 Edge Health Diagnostics</a>
            </div>
          </div>
        </div>

        {/* Real-time Clock */}
        <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{currentTime || 'Loading...'}</span>
        </div>
      </div>

      {/* Main Tab Bar matching PaySoft classic view */}
      <div className="bg-slate-800/90 border-b border-slate-700 px-4 flex space-x-1 overflow-x-auto text-xs font-medium">
        {navTabs.map(tab => {
          const isActive = currentPath === tab.href || (tab.href !== '/' && currentPath.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={`flex items-center space-x-2 px-3 py-2.5 border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-sky-400 text-sky-300 bg-slate-800 font-semibold shadow-inner'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </a>
          );
        })}
      </div>
    </header>
  );
};
