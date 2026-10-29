import React, { useState, useEffect, useCallback } from 'react';
import { Project, AuditLog } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { TerminalIcon, DownloadIcon } from '../../constants';
import { mealApiClient } from '../../services/apiClient';

interface AuditTrailViewProps {
  activeProject: Project | null;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ activeProject }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await mealApiClient.getAuditLogs(activeProject?.organisationId, activeProject?.id);
      setLogs(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to query audit trail from Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject?.organisationId, activeProject?.id]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return l.action.toLowerCase().includes(term) ||
           l.entityType.toLowerCase().includes(term) ||
           l.details.toLowerCase().includes(term) ||
           l.actorRole.toLowerCase().includes(term) ||
           l.actorName.toLowerCase().includes(term);
  });

  const handleExportLogs = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Details'].join(','),
      ...logs.map(l => [
        `"${l.timestamp}"`,
        `"${(l.actorName || '').replace(/"/g, '""')}"`,
        `"${l.actorRole}"`,
        `"${l.action}"`,
        `"${l.entityType}"`,
        `"${l.entityId}"`,
        `"${l.details.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Audit_Trail_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-slate-100 text-slate-700 rounded-md">
            <TerminalIcon className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-neutral-800">Immutable Audit Trail & System Activity</h2>
            <p className="text-xs text-neutral-500">
              Verifiable event log recording user mutations, approvals, DQA corrections, and compliance events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder="Search action, entity or role..."
            className="px-3 py-1.5 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-primary w-56"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button size="sm" variant="secondary" onClick={handleExportLogs} leftIcon={<DownloadIcon className="w-3.5 h-3.5" />} disabled={logs.length === 0}>
            Export Audit CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-xs text-neutral-500">Retrieving audit ledger from Supabase...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <TerminalIcon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-neutral-700">No Audit Events Logged Yet</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Events will be recorded automatically when projects, indicators, forms or submissions are modified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono text-xs">
                {filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-neutral-50">
                    <td className="py-2.5 px-4 text-neutral-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="font-semibold text-neutral-800 block">{l.actorName || 'User'}</span>
                      <span className="text-[10px] text-primary">{l.actorRole.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2.5 px-4 font-sans font-bold text-neutral-800">
                      {l.action}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500">
                      {l.entityType}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-neutral-700 max-w-md truncate" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrailView;
