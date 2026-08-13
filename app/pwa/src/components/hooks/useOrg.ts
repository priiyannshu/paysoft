import { useState, useEffect } from 'react';

export interface Org {
  id: string;
  name: string;
  code: string;
  address?: string;
  stateCode?: string;
  financialYear: string;
  assessmentYear: string;
}

export interface UseOrgReturn {
  org: Org;
  loading: boolean;
  error: string | null;
  refreshOrg: () => Promise<void>;
}

const defaultOrg: Org = {
  id: 'org_demo_001',
  name: 'ABCD SCHOOL',
  code: 'DEMO',
  address: 'New Delhi',
  stateCode: '07',
  financialYear: '2025-2026',
  assessmentYear: '2026-2027',
};

export const useOrg = (): UseOrgReturn => {
  const [org, setOrg] = useState<Org>(defaultOrg);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrg = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/org/current');
      if (res.ok) {
        const data = await res.json();
        if (data && data.name) {
          setOrg(data);
        }
      } else {
        setError('Failed to fetch organization details');
      }
    } catch (e: any) {
      console.error('Error fetching org data:', e);
      setError(e?.message || 'Error fetching organization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  return {
    org,
    loading,
    error,
    refreshOrg: fetchOrg
  };
};
