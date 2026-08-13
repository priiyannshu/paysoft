import { useState, useEffect } from 'react';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  role: string;
  orgId?: string;
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
}

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
    return {
      name: 'PSR Computers',
      role: 'super_admin',
      email: 'admin@demo.paysoft',
      orgId: 'org_demo_001'
    };
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('paysoft_user', JSON.stringify(data.user));
        }
      }
    } catch (e) {
      console.error('Error validating auth session:', e);
    } finally {
      setLoading(false);
    }
  };

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
          }
        } catch {}
      }
    };

    window.addEventListener('paysoft_role_changed', handleRoleChange);
    return () => {
      window.removeEventListener('paysoft_role_changed', handleRoleChange);
    };
  }, []);

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
    canAccess
  };
};
