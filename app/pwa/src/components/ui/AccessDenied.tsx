import React from 'react';
import { ShieldAlert, UserCheck } from 'lucide-react';

export interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Access Restricted',
  message = 'Your current user role (Employee) does not have authorization to view executive management dashboards or compliance reports. Please use Employee Self-Service (ESS).'
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <a
            href="/ess"
            className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Go to ESS Portal</span>
          </a>
        </div>
      </div>
    </div>
  );
};
