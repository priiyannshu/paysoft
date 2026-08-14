import React, { useState, useEffect } from 'react';
import { ShieldAlert, Code2, Clock } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/admin/audit-logs?limit=100')
      .then(r => r.json())
      .then(d => {
        setLogs(d.data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            Security & Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">Immutable record of all statutory mutations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.created_at || log.createdAt).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 border border-slate-200">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{log.actor_id || log.actorId}</td>
                <td className="px-4 py-3 text-slate-600">{log.entity_type || log.entityType} ({log.entity_id || log.entityId})</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelectedLog(log)} className="text-sky-600 hover:text-sky-700 font-medium text-xs flex items-center gap-1 bg-sky-50 px-2 py-1 rounded cursor-pointer">
                    <Code2 className="w-3.5 h-3.5" /> View Payload
                  </button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No audit logs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Audit Payload</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-50">
              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-all">
                {JSON.stringify(JSON.parse(selectedLog.payload), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
