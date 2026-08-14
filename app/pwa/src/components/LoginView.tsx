import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const [orgCode, setOrgCode] = useState('DEMO');
  const [email, setEmail] = useState('admin@demo.paysoft');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPersonaRole = (emailAddr: string): { role: string; name: string; code: string } => {
    if (emailAddr.includes('hr')) {
      return { role: 'hr_lead', name: 'Priya Sharma (HR Lead)', code: 'HR' };
    }
    if (emailAddr.includes('accountant')) {
      return { role: 'payroll_accountant', name: 'Ramesh Verma (Accountant)', code: 'ACCT' };
    }
    if (emailAddr.includes('sakshi') || emailAddr.includes('employee')) {
      return { role: 'employee', name: 'Sakshi Nair (Employee)', code: 'EMP' };
    }
    return { role: 'super_admin', name: 'PSR Computers', code: 'PSR' };
  };

  const handleLogin = async (e?: React.FormEvent, customCredentials?: any) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = customCredentials || {
      orgCode,
      email,
      password,
    };

    const targetPersona = getPersonaRole(payload.email);

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': targetPersona.role,
          'X-User-Email': payload.email,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        const userObj = {
          id: data.user?.id || 'usr_demo',
          email: data.user?.email || payload.email,
          name: data.user?.name || targetPersona.name,
          role: data.user?.role || targetPersona.role,
          code: targetPersona.code,
          orgId: data.user?.orgId || 'org_demo_001',
        };

        // Store user in localStorage after successful login
        localStorage.setItem('paysoft_user', JSON.stringify(userObj));

        // Dispatch event so any listening React components sync state
        window.dispatchEvent(new CustomEvent('paysoft_role_changed', { detail: userObj }));

        // Role-based redirect
        if (userObj.role === 'employee') {
          window.location.href = '/ess';
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        setError(data.error || 'Invalid credentials or organization code');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setOrgCode('DEMO');
    handleLogin(undefined, {
      orgCode: 'DEMO',
      email: demoEmail,
      password: 'Password123!',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 text-slate-950 font-black text-2xl shadow-lg">
          PS
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          PaySoft Enterprise Portal
        </h2>
        <p className="text-xs text-slate-400">
          Enterprise Indian Organization Payroll & Human Resources Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 space-y-6">
          {error && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300">Organization Code</label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  required
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="e.g. DEMO"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300">Work Email Address</label>
              <div className="mt-1 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="admin@demo.paysoft"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300">Password</label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* Security Badge */}
            <div className="p-2.5 bg-slate-900/50 border border-dashed border-slate-600 rounded-lg text-center">
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Protected by Enterprise Security</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 focus:outline-none transition disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to PaySoft'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Persona Box */}
          <div className="border-t border-slate-700 pt-5 space-y-2.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">
              One-Click Demo Personas (Seed Org)
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('admin@demo.paysoft')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 p-2 rounded-lg border border-slate-600 text-left transition cursor-pointer"
              >
                <div className="font-bold text-sky-300">👑 Super Admin</div>
                <div className="text-[10px] text-slate-400">admin@demo.paysoft</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('hr@demo.paysoft')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 p-2 rounded-lg border border-slate-600 text-left transition cursor-pointer"
              >
                <div className="font-bold text-emerald-300">👥 HR Lead</div>
                <div className="text-[10px] text-slate-400">hr@demo.paysoft</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('accountant@demo.paysoft')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 p-2 rounded-lg border border-slate-600 text-left transition cursor-pointer"
              >
                <div className="font-bold text-indigo-300">💳 Accountant</div>
                <div className="text-[10px] text-slate-400">accountant@demo.paysoft</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('sakshi.nair@example.com')}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-200 p-2 rounded-lg border border-slate-600 text-left transition cursor-pointer"
              >
                <div className="font-bold text-amber-300">👤 Employee</div>
                <div className="text-[10px] text-slate-400">sakshi.nair@...</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
