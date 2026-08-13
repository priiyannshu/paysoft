import React from 'react';
import { ShieldCheck, Cpu, Database, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs px-4 py-2 flex flex-wrap items-center justify-between select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <span className="font-semibold text-sky-400">Login:</span>
          <span>Psr Computers [PSR]</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center space-x-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>D1 Multi-Tenant Isolation Active</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span>Copyright © P.S.R. Computers & PaySoft Core</span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span>Cloudflare Workers + Durable Objects</span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="bg-slate-800 text-sky-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
          v2.5.0 Pro
        </span>
      </div>
    </footer>
  );
};
