import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'hr_lead' | 'payroll_accountant' | 'employee' | string;
  orgId: string;
  code?: string;
}

export interface UseAuthReturn {
  user: User | null;
  role: string;
  isAdmin: boolean;
  isHR: boolean;
  isAccountant: boolean;
  isEmployee: boolean;
  loading: boolean;
  canAccess: (requiredRoles: string[]) => boolean;
  switchRole: (email: string, targetRole: string, name: string, empId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const DEFAULT_ADMIN: User = {
  id: 'usr_admin',
  name: 'PSR Computers',
  email: 'admin@demo.paysoft',
  role: 'super_admin',
  code: 'PSR',
  orgId: 'org_demo_001'
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('paysoft_user');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.error('Failed to parse cached user:', e);
      }
    }
    return DEFAULT_ADMIN;
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const userObj: User = {
            id: data.user.id || 'usr_demo',
            name: data.user.name || 'PaySoft User',
            email: data.user.email || '',
            role: data.user.role || 'employee',
            orgId: data.user.orgId || 'org_demo_001',
            code: data.user.role === 'super_admin' ? 'PSR' : data.user.role === 'hr_lead' ? 'HR' : data.user.role === 'payroll_accountant' ? 'ACCT' : 'EMP'
          };
          setUser(userObj);
          localStorage.setItem('paysoft_user', JSON.stringify(userObj));
        }
      }
    } catch (e) {
      // Keep cached localStorage user if server check fails in demo/local mode
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    const handleRoleChange = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        setUser(customEv.detail);
      } else {
        try {
          const cached = localStorage.getItem('paysoft_user');
          if (cached) {
            setUser(JSON.parse(cached));
          } else {
            setUser(null);
          }
        } catch {}
      }
    };

    window.addEventListener('paysoft_role_changed', handleRoleChange);
    return () => {
      window.removeEventListener('paysoft_role_changed', handleRoleChange);
    };
  }, [fetchUser]);

  const switchRole = async (email: string, targetRole: string, name: string, empId?: string) => {
    let resolvedId = empId || 'usr_demo';
    let resolvedCode = 'USR';

    if (targetRole === 'super_admin') {
      resolvedId = 'usr_admin';
      resolvedCode = 'PSR';
    } else if (targetRole === 'hr_lead') {
      resolvedId = 'usr_hr';
      resolvedCode = 'HR';
    } else if (targetRole === 'payroll_accountant') {
      resolvedId = 'usr_acct';
      resolvedCode = 'ACCT';
    } else if (targetRole === 'employee') {
      resolvedId = empId || 'emp_0002';
      resolvedCode = 'EMP';
    }

    const newUserObj: User = {
      id: resolvedId,
      name,
      email,
      role: targetRole,
      code: resolvedCode,
      orgId: user?.orgId || 'org_demo_001'
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('paysoft_user', JSON.stringify(newUserObj));
      setUser(newUserObj);
      window.dispatchEvent(new CustomEvent('paysoft_role_changed', { detail: newUserObj }));

      // Handle role-based navigation redirects
      const currentPath = window.location.pathname;
      if (targetRole === 'employee') {
        // Employees only have access to /ess and /annual-statements
        if (currentPath !== '/ess' && currentPath !== '/annual-statements') {
          window.location.href = '/ess';
        }
      } else {
        // If switched to admin/HR/accountant from an employee screen that isn't ESS, keep current or go to dashboard
        if (currentPath === '/login') {
          window.location.href = '/dashboard';
        }
      }
    }
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Continue client cleanup even if network request fails
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('paysoft_user');
      setUser(null);
      window.dispatchEvent(new CustomEvent('paysoft_role_changed', { detail: null }));
      window.location.href = '/login';
    }
  };

  const role = user?.role || 'employee';
  const isAdmin = role === 'super_admin';
  const isHR = role === 'super_admin' || role === 'hr_lead';
  const isAccountant = role === 'super_admin' || role === 'payroll_accountant';
  const isEmployee = role === 'employee';

  const canAccess = (requiredRoles: string[]): boolean => {
    if (!role) return false;
    if (role === 'super_admin') return true;
    return requiredRoles.includes(role);
  };

  return {
    user,
    role,
    isAdmin,
    isHR,
    isAccountant,
    isEmployee,
    loading,
    canAccess,
    switchRole,
    logout
  };
};
