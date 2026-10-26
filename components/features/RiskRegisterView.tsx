import React, { useState } from 'react';
import { Project, RiskItem } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, ShieldCheckIcon, DeleteIcon, EditIcon } from '../../constants';
import { mealStorage } from '../../services/mealStorage';

interface RiskRegisterViewProps {
  activeProject: Project | null;
}

export const RiskRegisterView: React.FC<RiskRegisterViewProps> = ({ activeProject }) => {
  const [risks, setRisks] = useState<RiskItem[]>(() => {
    return mealStorage.getRisks(activeProject?.id);
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RiskItem['category']>('Operational');
  const [likelihood, setLikelihood] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  const [mitigation, setMitigation] = useState('');
  const [earlyWarning, setEarlyWarning] = useState('');
  const [owner, setOwner] = useState('');

  const reload = () => {
    setRisks(mealStorage.getRisks(activeProject?.id));
  };

  const handleSaveRisk = () => {
    if (!activeProject || !title.trim() || !mitigation.trim()) {
      alert('Risk title and mitigation plan are required.');
      return;
    }

    const rating = likelihood * impact;
    const newRisk: RiskItem = {
      id: `risk_${Date.now()}`,
      projectId: activeProject.id,
      title,
      category,
      likelihood,
      impact,
      rating,
      earlyWarningIndicator: earlyWarning || undefined,
      mitigation,
      owner: owner || 'Project Lead',
      status: 'active',
      reviewDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    };

    mealStorage.saveRisk(newRisk);
    reload();
    setIsAdding(false);
    setTitle('');
    setMitigation('');
    setEarlyWarning('');
    setOwner('');
  };

  const handleDeleteRisk = (id: string) => {
    if (confirm('Delete this risk register entry?')) {
      mealStorage.deleteRisk(id);
      reload();
    }
  };

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <p className="text-neutral-600">Please select an active project to view Risk & Adaptive Management.</p>
      </div>
    );
  }

  // Count risk severity
  const highRisks = risks.filter(r => r.rating >= 15).length;
  const mediumRisks = risks.filter(r => r.rating >= 8 && r.rating < 15).length;
  const lowRisks = risks.filter(r => r.rating < 8).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-700 rounded-md">
              <ShieldCheckIcon className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-800">Risk, Assumptions & Adaptive Management</h2>
              <p className="text-xs text-neutral-500">
                5x5 Risk matrix, early-warning indicator links, mitigation strategies, and adaptive pivoting.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsAdding(true)} leftIcon={<PlusIcon />}>
          Add New Risk / Assumption
        </Button>
      </div>

      {/* Heat Matrix Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-rose-500 bg-white">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">High / Extreme Severity (15-25)</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{highRisks}</span>
          <span className="text-xs text-neutral-400 mt-0.5 block">Requires immediate senior escalation</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Medium Severity (8-14)</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{mediumRisks}</span>
          <span className="text-xs text-neutral-400 mt-0.5 block">Tracked via monthly early-warning indicators</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Low Severity (1-7)</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{lowRisks}</span>
          <span className="text-xs text-neutral-400 mt-0.5 block">Standard routine operational mitigation</span>
        </Card>
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase font-semibold border-b">
              <tr>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Risk Statement & Category</th>
                <th className="py-3 px-4">Likelihood × Impact</th>
                <th className="py-3 px-4">Mitigation & Adaptive Action</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {risks.map(r => {
                const badgeColor = r.rating >= 15 ? 'bg-rose-100 text-rose-800' : r.rating >= 8 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
                return (
                  <tr key={r.id} className="hover:bg-neutral-50 transition">
                    <td className="py-3.5 px-4 font-bold">
                      <span className={`px-2.5 py-1 rounded text-xs font-black ${badgeColor}`}>
                        Score {r.rating}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-800 text-xs">{r.title}</div>
                      <div className="text-[11px] text-neutral-400 font-medium">{r.category} · Status: {r.status}</div>
                      {r.earlyWarningIndicator && (
                        <div className="text-[11px] text-primary mt-1">
                          📡 <strong>Early Warning:</strong> {r.earlyWarningIndicator}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">
                      L: {r.likelihood} × I: {r.impact}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-700 max-w-md leading-relaxed">
                      {r.mitigation}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-neutral-600">
                      {r.owner}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => handleDeleteRisk(r.id)} 
                        className="p-1.5 text-neutral-400 hover:text-red-600 transition"
                        title="Delete entry"
                      >
                        <DeleteIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Risk Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-800">Add Risk or Critical Assumption</h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Risk Statement *</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Extreme seasonal flooding damages clinic solar refrigerators"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Category</label>
                <select className="w-full px-2 py-2 border border-neutral-300 rounded text-xs bg-white" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                  <option value="Operational">Operational</option>
                  <option value="Financial">Financial</option>
                  <option value="Contextual">Contextual</option>
                  <option value="Security">Security</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Safeguarding">Safeguarding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Likelihood (1-5)</label>
                <select className="w-full px-2 py-2 border border-neutral-300 rounded text-xs bg-white" value={likelihood} onChange={(e) => setLikelihood(parseInt(e.target.value))}>
                  <option value={1}>1 - Rare</option>
                  <option value={2}>2 - Unlikely</option>
                  <option value={3}>3 - Possible</option>
                  <option value={4}>4 - Likely</option>
                  <option value={5}>5 - Almost Certain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Impact (1-5)</label>
                <select className="w-full px-2 py-2 border border-neutral-300 rounded text-xs bg-white" value={impact} onChange={(e) => setImpact(parseInt(e.target.value))}>
                  <option value={1}>1 - Negligible</option>
                  <option value={2}>2 - Minor</option>
                  <option value={3}>3 - Moderate</option>
                  <option value={4}>4 - Major</option>
                  <option value={5}>5 - Catastrophic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Early Warning Indicator / Trigger</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs"
                value={earlyWarning}
                onChange={(e) => setEarlyWarning(e.target.value)}
                placeholder="e.g., Weekly rainfall forecast exceeding 80mm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Mitigation Plan & Adaptive Strategy *</label>
              <textarea 
                rows={2} 
                className="w-full px-3 py-2 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-primary"
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
                placeholder="Concrete actions to prevent or lessen the impact..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Designated Owner</label>
              <input 
                type="text" 
                className="w-full px-3 py-1.5 border border-neutral-300 rounded text-xs"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g., District Operations Officer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button size="sm" variant="secondary" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveRisk}>Save Risk Entry</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRegisterView;
